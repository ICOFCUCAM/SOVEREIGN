alter table polished.documents add column if not exists shared boolean not null default false;
alter table polished.documents add column if not exists share_token uuid;
create unique index if not exists documents_share_token_idx on polished.documents(share_token) where share_token is not null;

drop function if exists public.polished_list_documents();
create function public.polished_list_documents()
returns table(id uuid, kind text, title text, template text, preview text, favorite boolean, shared boolean, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.template, d.preview, d.favorite, d.shared, d.created_at
  from polished.documents d
  where d.user_id = auth.uid()
  order by d.favorite desc, d.created_at desc
  limit 300;
$$;
revoke all on function public.polished_list_documents() from public, anon;
grant execute on function public.polished_list_documents() to authenticated;

create or replace function public.polished_set_shared(p_id uuid, p_shared boolean)
returns text
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_token uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_shared then
    update polished.documents set shared = true, share_token = coalesce(share_token, gen_random_uuid()), updated_at = now()
      where id = p_id and user_id = v_uid;
  else
    update polished.documents set shared = false, updated_at = now() where id = p_id and user_id = v_uid;
  end if;
  select share_token into v_token from polished.documents where id = p_id and user_id = v_uid;
  if not p_shared then return null; end if;
  return v_token::text;
end; $$;

create or replace function public.polished_get_shared(p_token uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','polished' as $$
declare v jsonb;
begin
  select jsonb_build_object('kind', kind, 'title', title, 'template', template, 'payload', payload)
    into v from polished.documents where share_token = p_token and shared = true;
  return v;
end; $$;

revoke all on function public.polished_set_shared(uuid, boolean) from public, anon;
grant execute on function public.polished_set_shared(uuid, boolean) to authenticated;
revoke all on function public.polished_get_shared(uuid) from public;
grant execute on function public.polished_get_shared(uuid) to anon, authenticated;
