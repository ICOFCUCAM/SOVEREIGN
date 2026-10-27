-- AI Teacher RPCs (BLUEPRINT.md §0.1, §2a, §2b; build steps 1–2). Like the rest
-- of Polished Pages, the browser never reads the polished schema directly: these
-- security-definer functions check auth.uid() themselves. Indexing a version
-- grants nothing; retrieval is scoped to one course, its non-excluded sources
-- and the exact version approved for each.

-- Step 1: save a version of a document the caller owns, with its chunks
-- (embeddings are added server-side later). Same text = same version.
create or replace function public.polished_teacher_save_version(p_doc_id uuid, p_content_hash text, p_structure jsonb, p_chunks jsonb)
returns uuid language plpgsql security definer set search_path to 'public', 'polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid; ch jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from polished.documents where id = p_doc_id and user_id = v_uid) then raise exception 'document not found'; end if;
  if jsonb_array_length(coalesce(p_chunks, '[]'::jsonb)) > 20000 then raise exception 'too many passages'; end if;
  select id into v_id from polished.source_versions where document_id = p_doc_id and content_hash = p_content_hash;
  if v_id is null then
    insert into polished.source_versions(document_id, content_hash, structure, created_by) values (p_doc_id, p_content_hash, coalesce(p_structure, '{}'::jsonb), v_uid) returning id into v_id;
  else
    -- Same content hash = same text = the same passages, so saving again updates them in place.
    update polished.source_versions set structure = coalesce(p_structure, structure) where id = v_id;
  end if;
  for ch in select * from jsonb_array_elements(coalesce(p_chunks, '[]'::jsonb)) loop
    insert into polished.source_chunks(version_id, chunk_id, ordinal, chapter_id, chapter_number, heading_path, paragraph_start, paragraph_end, char_start, char_end, chunk_text, tokens, scripture_refs, source_type, source_location, content_hash)
    values (v_id, ch->>'id', (ch->>'ordinal')::int, ch->>'chapterId', nullif(ch->>'chapterNumber', '')::int,
      coalesce((select array_agg(x) from jsonb_array_elements_text(ch->'headingPath') x), '{}'),
      (ch->>'paragraphStart')::int, (ch->>'paragraphEnd')::int, (ch->>'charStart')::int, (ch->>'charEnd')::int,
      ch->>'text', (ch->>'tokens')::int, coalesce(ch->'scriptureRefs', '[]'::jsonb), coalesce(ch->>'sourceType', 'published_book'), ch->>'sourceLocation', ch->>'contentHash')
    on conflict (version_id, chunk_id) do update set ordinal = excluded.ordinal, heading_path = excluded.heading_path, source_location = excluded.source_location, scripture_refs = excluded.scripture_refs;
  end loop;
  update polished.source_versions set status = 'indexed' where id = v_id;
  return v_id;
end $$;

-- The author's list of versions for a document (newest first).
create or replace function public.polished_teacher_versions(p_doc_id uuid)
returns table(id uuid, content_hash text, status text, structure jsonb, approved_at timestamptz, created_at timestamptz, chunks bigint, embedded bigint)
language sql stable security definer set search_path to 'public', 'polished' as $$
  select v.id, v.content_hash, v.status, v.structure, v.approved_at, v.created_at,
    (select count(*) from polished.source_chunks c where c.version_id = v.id),
    (select count(*) from polished.source_chunks c where c.version_id = v.id and c.embedding is not null)
  from polished.source_versions v join polished.documents d on d.id = v.document_id
  where v.document_id = p_doc_id and d.user_id = auth.uid()
  order by v.created_at desc;
$$;

-- The author confirms a version: it becomes the one every course using the document teaches from; earlier ones are superseded.
create or replace function public.polished_teacher_approve_version(p_version_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'polished' as $$
declare v_doc uuid;
begin
  select v.document_id into v_doc from polished.source_versions v join polished.documents d on d.id = v.document_id where v.id = p_version_id and d.user_id = auth.uid();
  if v_doc is null then raise exception 'version not found'; end if;
  if exists (select 1 from polished.source_versions where id = p_version_id and (structure->>'blocking')::boolean) then raise exception 'the structure has errors to fix first'; end if;
  update polished.source_versions set status = 'superseded' where document_id = v_doc and id <> p_version_id and status = 'indexed';
  update polished.source_versions set approved_by = auth.uid(), approved_at = now(), status = 'indexed' where id = p_version_id;
  update polished.course_sources s set version_id = p_version_id from polished.courses c where s.course_id = c.id and s.document_id = v_doc and c.owner_id = auth.uid();
end $$;

-- Author mode: a course for one of the caller's books, using its approved version.
create or replace function public.polished_teacher_ensure_course(p_doc_id uuid, p_title text)
returns uuid language plpgsql security definer set search_path to 'public', 'polished' as $$
declare v_uid uuid := auth.uid(); v_course uuid; v_version uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from polished.documents where id = p_doc_id and user_id = v_uid) then raise exception 'document not found'; end if;
  select s.course_id into v_course from polished.course_sources s join polished.courses c on c.id = s.course_id where s.document_id = p_doc_id and c.owner_id = v_uid and c.mode = 'author' limit 1;
  if v_course is null then
    insert into polished.courses(owner_id, mode, title) values (v_uid, 'author', left(coalesce(nullif(trim(p_title), ''), 'Book tutor'), 300)) returning id into v_course;
    select id into v_version from polished.source_versions where document_id = p_doc_id and approved_at is not null order by approved_at desc limit 1;
    insert into polished.course_sources(course_id, document_id, source_type, role, version_id) values (v_course, p_doc_id, 'published_book', 'required', v_version);
  end if;
  return v_course;
end $$;

-- Step 2: hybrid retrieval for one course (vector + full text, reciprocal rank fusion, k = 60).
-- Only non-excluded sources, only their approved version. Course owner only until enrolments exist.
create or replace function public.polished_teacher_retrieve(p_course_id uuid, p_query text, p_embedding text default null, p_limit int default 30, p_chapter text default null)
returns table(version_id uuid, chunk_id text, chapter_id text, chapter_number int, heading_path text[], paragraph_start int, paragraph_end int, char_start int, char_end int,
  chunk_text text, source_location text, source_title text, source_role text, lexical_rank int, vector_rank int, score double precision)
language sql stable security definer set search_path to 'public', 'polished' as $$
  with allowed as (
    select s.version_id, s.role, d.title from polished.course_sources s
    join polished.courses c on c.id = s.course_id join polished.documents d on d.id = s.document_id
    where s.course_id = p_course_id and c.owner_id = auth.uid() and s.role <> 'excluded' and s.version_id is not null
  ), pool as (
    select ch.* , a.role, a.title from polished.source_chunks ch join allowed a on a.version_id = ch.version_id
    where p_chapter is null or ch.chapter_id = p_chapter
  ), lex as (
    select version_id, chunk_id, row_number() over (order by ts_rank_cd(tsv, q) desc)::int as r
    from pool, websearch_to_tsquery('simple', coalesce(p_query, '')) q where tsv @@ q
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

-- Every function also checks auth.uid() itself; signed-out callers cannot call them at all.
revoke all on function public.polished_teacher_save_version(uuid, text, jsonb, jsonb), public.polished_teacher_versions(uuid), public.polished_teacher_approve_version(uuid),
  public.polished_teacher_ensure_course(uuid, text), public.polished_teacher_retrieve(uuid, text, text, int, text) from public, anon;
grant execute on function public.polished_teacher_save_version(uuid, text, jsonb, jsonb), public.polished_teacher_versions(uuid), public.polished_teacher_approve_version(uuid),
  public.polished_teacher_ensure_course(uuid, text), public.polished_teacher_retrieve(uuid, text, text, int, text) to authenticated;
