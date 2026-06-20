-- Document library for Polished Pages. Lives in the isolated `polished` schema
-- and is reached only through SECURITY DEFINER RPCs that filter by auth.uid(),
-- matching the entitlements/usage_counters pattern (PostgREST exposes only public).

create table if not exists polished.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  kind       text not null check (kind in ('cv','cover-letter','book','tailored')),
  title      text not null default 'Untitled',
  template   text,
  preview    text,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_created_idx
  on polished.documents(user_id, created_at desc);

-- Defense in depth: deny all direct access; the definer RPCs (owned by the
-- migration role) bypass RLS and are the only entry points.
alter table polished.documents enable row level security;

create or replace function public.polished_save_document(
  p_kind text, p_title text, p_template text, p_payload jsonb, p_preview text
) returns uuid
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_kind not in ('cv','cover-letter','book','tailored') then raise exception 'invalid kind'; end if;
  insert into polished.documents(user_id, kind, title, template, payload, preview)
  values (v_uid, p_kind, coalesce(nullif(btrim(p_title), ''), 'Untitled'), p_template, p_payload, left(coalesce(p_preview, ''), 400))
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.polished_list_documents()
returns table(id uuid, kind text, title text, template text, preview text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.template, d.preview, d.created_at
  from polished.documents d
  where d.user_id = auth.uid()
  order by d.created_at desc
  limit 200;
$$;

create or replace function public.polished_get_document(p_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select to_jsonb(d) into v from polished.documents d where d.id = p_id and d.user_id = v_uid;
  return v;
end; $$;

create or replace function public.polished_delete_document(p_id uuid)
returns void
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  delete from polished.documents d where d.id = p_id and d.user_id = v_uid;
end; $$;

revoke all on function public.polished_save_document(text,text,text,jsonb,text) from public, anon;
revoke all on function public.polished_list_documents() from public, anon;
revoke all on function public.polished_get_document(uuid) from public, anon;
revoke all on function public.polished_delete_document(uuid) from public, anon;
grant execute on function public.polished_save_document(text,text,text,jsonb,text) to authenticated;
grant execute on function public.polished_list_documents() to authenticated;
grant execute on function public.polished_get_document(uuid) to authenticated;
grant execute on function public.polished_delete_document(uuid) to authenticated;
