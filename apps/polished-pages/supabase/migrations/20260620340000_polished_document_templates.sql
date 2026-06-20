alter table polished.documents add column if not exists is_template boolean not null default false;

drop function if exists public.polished_list_documents();
create function public.polished_list_documents()
returns table(id uuid, kind text, title text, template text, preview text, favorite boolean, shared boolean, listed boolean, category text, price_cents integer, tags text[], is_template boolean, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.template, d.preview, d.favorite, d.shared, d.listed, d.category, d.price_cents, d.tags, d.is_template, d.created_at
  from polished.documents d
  where d.user_id = auth.uid()
  order by d.favorite desc, d.created_at desc
  limit 300;
$$;
revoke all on function public.polished_list_documents() from public, anon;
grant execute on function public.polished_list_documents() to authenticated;

create or replace function public.polished_set_template(p_id uuid, p_is_template boolean)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update polished.documents set is_template = coalesce(p_is_template, false), updated_at = now() where id = p_id and user_id = auth.uid();
end; $$;

create or replace function public.polished_use_template(p_id uuid)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_new uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into polished.documents(user_id, kind, title, template, payload, preview, tags)
  select v_uid, kind, title, template, payload, preview, tags
  from polished.documents where id = p_id and user_id = v_uid
  returning id into v_new;
  if v_new is null then raise exception 'not found'; end if;
  return v_new;
end; $$;

revoke all on function public.polished_set_template(uuid, boolean) from public, anon;
revoke all on function public.polished_use_template(uuid) from public, anon;
grant execute on function public.polished_set_template(uuid, boolean) to authenticated;
grant execute on function public.polished_use_template(uuid) to authenticated;
