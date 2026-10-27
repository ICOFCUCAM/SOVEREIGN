-- AI Teacher retrieval, keyword leg (BLUEPRINT.md §2b). Students ask in
-- sentences, so the keyword search matches ANY meaningful word of the question
-- (English stop words removed, words stemmed: "spirits" finds "spirit"),
-- ranked by how many match and how close together. The exact-form index (tsv,
-- 'simple') stays for exact-term work such as terminology checks.
alter table polished.source_chunks add column if not exists tsv_en tsvector generated always as (to_tsvector('english', chunk_text)) stored;
create index if not exists source_chunks_tsv_en_idx on polished.source_chunks using gin (tsv_en);

create or replace function public.polished_teacher_retrieve(p_course_id uuid, p_query text, p_embedding text default null, p_limit int default 30, p_chapter text default null)
returns table(version_id uuid, chunk_id text, chapter_id text, chapter_number int, heading_path text[], paragraph_start int, paragraph_end int, char_start int, char_end int,
  chunk_text text, source_location text, source_title text, source_role text, lexical_rank int, vector_rank int, score double precision)
language sql stable security definer set search_path to 'public', 'polished' as $$
  with allowed as (
    select s.version_id, s.role, d.title from polished.course_sources s
    join polished.courses c on c.id = s.course_id join polished.documents d on d.id = s.document_id
    where s.course_id = p_course_id and c.owner_id = auth.uid() and s.role <> 'excluded' and s.version_id is not null
  ), pool as (
    select ch.*, a.role, a.title from polished.source_chunks ch join allowed a on a.version_id = ch.version_id
    where p_chapter is null or ch.chapter_id = p_chapter
  ), q as (
    -- any meaningful word of the question
    select nullif(replace(plainto_tsquery('english', coalesce(p_query, ''))::text, ' & ', ' | '), '')::tsquery as q
  ), lex as (
    select version_id, chunk_id, row_number() over (order by ts_rank_cd(tsv_en, q.q, 1) desc, ordinal)::int as r
    from pool, q where q.q is not null and tsv_en @@ q.q
    order by r limit greatest(1, least(p_limit, 40))
  ), vec as (
    select version_id, chunk_id, row_number() over (order by embedding <=> p_embedding::public.vector)::int as r
    from pool where p_embedding is not null and embedding is not null
    order by embedding <=> p_embedding::public.vector limit greatest(1, least(p_limit, 40))
  ), fused as (
    select coalesce(l.version_id, v.version_id) as version_id, coalesce(l.chunk_id, v.chunk_id) as chunk_id, l.r as lr, v.r as vr,
      coalesce(1.0 / (60 + l.r), 0) + coalesce(1.0 / (60 + v.r), 0) as score
    from lex l full join vec v on v.version_id = l.version_id and v.chunk_id = l.chunk_id
  )
  select p.version_id, p.chunk_id, p.chapter_id, p.chapter_number, p.heading_path, p.paragraph_start, p.paragraph_end, p.char_start, p.char_end,
    p.chunk_text, p.source_location, p.title, p.role, f.lr, f.vr, f.score::double precision
  from fused f join pool p on p.version_id = f.version_id and p.chunk_id = f.chunk_id
  order by f.score desc limit greatest(1, least(p_limit, 40));
$$;
