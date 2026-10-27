-- AI Teacher: embeddings, course rules and runtime context (BLUEPRINT.md §2a,
-- §5a, §11a; build steps 1–3). Owner-checked security-definer functions, like
-- the rest; nothing here gives a student or another author access.

-- Passages of a version the caller owns that still need an embedding.
create or replace function public.polished_teacher_chunks_to_embed(p_version_id uuid, p_limit int default 200)
returns table(chunk_id text, chunk_text text)
language sql stable security definer set search_path to 'public', 'polished' as $$
  select c.chunk_id, c.chunk_text from polished.source_chunks c
  where c.version_id = p_version_id and c.embedding is null and polished.owns_version(p_version_id)
  order by c.ordinal limit greatest(1, least(p_limit, 500));
$$;

-- Stores embeddings for passages of a version the caller owns: [{ "id": chunk_id, "embedding": [...] }].
create or replace function public.polished_teacher_set_embeddings(p_version_id uuid, p_items jsonb)
returns integer language plpgsql security definer set search_path to 'public', 'polished' as $$
declare n int := 0; it jsonb;
begin
  if not polished.owns_version(p_version_id) then raise exception 'version not found'; end if;
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    update polished.source_chunks set embedding = ((it->'embedding')::text)::public.vector
      where version_id = p_version_id and chunk_id = it->>'id';
    if found then n := n + 1; end if;
  end loop;
  return n;
end $$;

-- The course's structured teaching rules (scope and precedence, blueprint §11a), set by its owner.
create or replace function public.polished_teacher_set_course_rules(p_course_id uuid, p_rules jsonb)
returns void language plpgsql security definer set search_path to 'public', 'polished' as $$
begin
  if jsonb_typeof(coalesce(p_rules, '[]'::jsonb)) <> 'array' then raise exception 'rules must be a list'; end if;
  update polished.courses set rules = coalesce(p_rules, '[]'::jsonb), updated_at = now() where id = p_course_id and owner_id = auth.uid();
  if not found then raise exception 'course not found'; end if;
end $$;

-- What the Teacher Runtime needs to know about a course before answering: its title, rules and sources.
create or replace function public.polished_teacher_course_context(p_course_id uuid)
returns jsonb language sql stable security definer set search_path to 'public', 'polished' as $$
  select jsonb_build_object('id', c.id, 'title', c.title, 'mode', c.mode, 'rules', c.rules,
    'sources', coalesce((select jsonb_agg(jsonb_build_object('title', d.title, 'author', d.author_name, 'role', s.role, 'version_id', s.version_id,
        'embedded', (select count(*) from polished.source_chunks x where x.version_id = s.version_id and x.embedding is not null),
        'passages', (select count(*) from polished.source_chunks x where x.version_id = s.version_id)))
      from polished.course_sources s join polished.documents d on d.id = s.document_id where s.course_id = c.id and s.role <> 'excluded'), '[]'::jsonb))
  from polished.courses c where c.id = p_course_id and c.owner_id = auth.uid();
$$;

-- The tutor course for one of the caller's books, if it exists (author mode).
create or replace function public.polished_teacher_course_for_document(p_doc_id uuid)
returns uuid language sql stable security definer set search_path to 'public', 'polished' as $$
  select s.course_id from polished.course_sources s join polished.courses c on c.id = s.course_id
  where s.document_id = p_doc_id and c.owner_id = auth.uid() and c.mode = 'author' order by c.created_at limit 1;
$$;

grant execute on function public.polished_teacher_chunks_to_embed(uuid, int), public.polished_teacher_set_embeddings(uuid, jsonb),
  public.polished_teacher_set_course_rules(uuid, jsonb), public.polished_teacher_course_context(uuid), public.polished_teacher_course_for_document(uuid) to authenticated;
