-- Vector-search RAG for knowledge documents (pgvector, public schema).
create table if not exists polished.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references polished.knowledge_documents(id) on delete cascade,
  user_id uuid not null,
  org_id uuid,
  idx integer not null,
  content text not null,
  embedding public.vector(1536)
);
alter table polished.knowledge_chunks enable row level security;
create index if not exists knowledge_chunks_doc_idx on polished.knowledge_chunks(document_id);
create index if not exists knowledge_chunks_vec_idx on polished.knowledge_chunks using hnsw (embedding public.vector_cosine_ops);

create or replace function public.polished_knowledge_index(p_doc_id uuid, p_chunks jsonb)
returns integer language plpgsql security definer set search_path to 'public', 'polished'
as $function$
declare v_uid uuid := auth.uid(); v_org uuid; v_n int := 0; ch jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select org_id into v_org from polished.knowledge_documents where id = p_doc_id and user_id = v_uid;
  if not found then raise exception 'document not found'; end if;
  delete from polished.knowledge_chunks where document_id = p_doc_id;
  for ch in select * from jsonb_array_elements(coalesce(p_chunks, '[]'::jsonb)) loop
    insert into polished.knowledge_chunks(document_id, user_id, org_id, idx, content, embedding)
      values (p_doc_id, v_uid, v_org, (ch->>'idx')::int, ch->>'content', ((ch->'embedding')::text)::public.vector);
    v_n := v_n + 1;
  end loop;
  return v_n;
end; $function$;

create or replace function public.polished_knowledge_match(p_doc_ids uuid[], p_embedding text, p_k integer default 8)
returns table(content text, document_id uuid, distance double precision)
language sql security definer set search_path to 'public', 'polished'
as $function$
  select c.content, c.document_id, (c.embedding <=> p_embedding::public.vector) as distance
  from polished.knowledge_chunks c
  where c.document_id = any(p_doc_ids) and c.embedding is not null
    and (c.user_id = auth.uid() or (c.org_id is not null and polished.org_is_member(c.org_id)))
  order by c.embedding <=> p_embedding::public.vector
  limit greatest(1, least(coalesce(p_k, 8), 24));
$function$;
