create table if not exists polished.document_versions (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references polished.documents(id) on delete cascade,
  user_id     uuid not null,
  payload     jsonb not null,
  preview     text,
  created_at  timestamptz not null default now()
);
create index if not exists doc_versions_doc_idx on polished.document_versions(document_id, created_at desc);
alter table polished.document_versions enable row level security;

create or replace function public.polished_update_document(p_id uuid, p_payload jsonb, p_preview text)
returns void
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_old jsonb; v_oldprev text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select payload, preview into v_old, v_oldprev from polished.documents where id = p_id and user_id = v_uid;
  if not found then raise exception 'not found'; end if;
  insert into polished.document_versions(document_id, user_id, payload, preview) values (p_id, v_uid, v_old, v_oldprev);
  update polished.documents set
    payload = p_payload,
    preview = left(coalesce(p_preview, ''), 400),
    title = coalesce(nullif(btrim(p_payload->>'title'), ''), title),
    updated_at = now()
    where id = p_id and user_id = v_uid;
  delete from polished.document_versions
    where document_id = p_id
      and id not in (select id from polished.document_versions where document_id = p_id order by created_at desc limit 20);
end; $$;

create or replace function public.polished_list_versions(p_id uuid)
returns table(id uuid, preview text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select v.id, v.preview, v.created_at from polished.document_versions v
  where v.document_id = p_id and v.user_id = auth.uid()
  order by v.created_at desc limit 30;
$$;

create or replace function public.polished_get_version(p_version_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','polished' as $$
declare v jsonb;
begin
  select payload into v from polished.document_versions where id = p_version_id and user_id = auth.uid();
  return v;
end; $$;

revoke all on function public.polished_update_document(uuid, jsonb, text) from public, anon;
revoke all on function public.polished_list_versions(uuid) from public, anon;
revoke all on function public.polished_get_version(uuid) from public, anon;
grant execute on function public.polished_update_document(uuid, jsonb, text) to authenticated;
grant execute on function public.polished_list_versions(uuid) to authenticated;
grant execute on function public.polished_get_version(uuid) to authenticated;
