-- AI Teacher, knowledge first phase 1 (BLUEPRINT.md §12b): the subject gate and
-- the sufficiency check, both without a model. For the question's meaningful
-- words (English stems; stop words, numbers and words about the book itself
-- such as "chapter" or "explain" removed) it reports how many of the course's
-- approved passages contain each word, and how many of the selected evidence
-- passages do. The runtime decides from these counts (teacher-core assessScope).
-- Owner-only like retrieval: another user's course yields no passages.
create or replace function public.polished_teacher_scope(p_course_id uuid, p_query text, p_chunk_ids text[] default '{}')
returns jsonb language sql stable security definer set search_path to 'public', 'polished' as $$
  with allowed as (
    select s.version_id from polished.course_sources s join polished.courses c on c.id = s.course_id
    where s.course_id = p_course_id and c.owner_id = auth.uid() and s.role <> 'excluded' and s.version_id is not null
  ), meta as (
    select unnest(tsvector_to_array(to_tsvector('english',
      'chapter chapters book books author authors say says said teach teaches teaching taught mean means meaning explain explains explained describe describes discuss discusses tell tells talk talks section sections page pages passage passages'))) as lex
  ), terms as (
    select distinct t.lex from unnest(tsvector_to_array(to_tsvector('english', left(coalesce(p_query, ''), 1000)))) as t(lex)
    where t.lex !~ '^[0-9]+$' and length(t.lex) > 1 and t.lex not in (select lex from meta)
  ), pool as (
    select ch.chunk_id, ch.tsv_en from polished.source_chunks ch join allowed a on a.version_id = ch.version_id
  ), counts as (
    select t.lex,
      (select count(*) from pool p where p.tsv_en @@ to_tsquery('simple', quote_literal(t.lex)))::int as in_course,
      (select count(*) from pool p where p.chunk_id = any(coalesce(p_chunk_ids, '{}')) and p.tsv_en @@ to_tsquery('simple', quote_literal(t.lex)))::int as in_evidence
    from terms t
  ), best as (
    select coalesce(max(n), 0)::int as best from (
      select p.chunk_id, count(*) as n from pool p join terms t on p.tsv_en @@ to_tsquery('simple', quote_literal(t.lex))
      where p.chunk_id = any(coalesce(p_chunk_ids, '{}')) group by p.chunk_id) x
  )
  select jsonb_build_object(
    'terms', coalesce((select jsonb_agg(jsonb_build_object('lexeme', lex, 'in_course', in_course, 'in_evidence', in_evidence) order by lex) from counts), '[]'::jsonb),
    'best_passage_terms', (select best from best));
$$;

grant execute on function public.polished_teacher_scope(uuid, text, text[]) to authenticated;
