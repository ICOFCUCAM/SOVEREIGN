alter table polished.documents add column if not exists tags text[] not null default '{}';
alter table polished.documents add column if not exists featured boolean not null default false;

create table if not exists polished.admins (user_id uuid primary key, created_at timestamptz default now());

drop function if exists public.polished_list_documents();
create function public.polished_list_documents()
returns table(id uuid, kind text, title text, template text, preview text, favorite boolean, shared boolean, listed boolean, category text, price_cents integer, tags text[], created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.template, d.preview, d.favorite, d.shared, d.listed, d.category, d.price_cents, d.tags, d.created_at
  from polished.documents d
  where d.user_id = auth.uid()
  order by d.favorite desc, d.created_at desc
  limit 300;
$$;
revoke all on function public.polished_list_documents() from public, anon;
grant execute on function public.polished_list_documents() to authenticated;

create or replace function public.polished_set_tags(p_id uuid, p_tags text[])
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update polished.documents set tags = coalesce(p_tags, '{}'), updated_at = now() where id = p_id and user_id = auth.uid();
end; $$;

create or replace function public.polished_duplicate_document(p_id uuid)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_new uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into polished.documents(user_id, kind, title, template, payload, preview, tags)
  select v_uid, kind, title || ' (copy)', template, payload, preview, tags
  from polished.documents where id = p_id and user_id = v_uid
  returning id into v_new;
  if v_new is null then raise exception 'not found'; end if;
  return v_new;
end; $$;

create or replace function public.polished_is_admin()
returns boolean language sql security definer set search_path to 'public','polished' as $$
  select exists (select 1 from polished.admins where user_id = auth.uid());
$$;

create or replace function public.polished_set_featured(p_id uuid, p_featured boolean)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if not exists (select 1 from polished.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  update polished.documents set featured = coalesce(p_featured, false), updated_at = now() where id = p_id;
end; $$;

drop function if exists public.polished_catalog(text, text);
create function public.polished_catalog(p_category text default null, p_search text default null)
returns table(token uuid, kind text, title text, category text, price_cents integer, preview text, author_name text, license text, featured boolean, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.kind, d.title, d.category, d.price_cents, d.preview, d.author_name, d.license, d.featured, d.created_at
  from polished.documents d
  where d.listed = true and d.shared = true and d.share_token is not null
    and (p_category is null or d.category = p_category)
    and (p_search is null or d.title ilike '%' || p_search || '%')
  order by d.featured desc, d.created_at desc limit 200;
$$;
revoke all on function public.polished_catalog(text, text) from public;
grant execute on function public.polished_catalog(text, text) to anon, authenticated;

revoke all on function public.polished_set_tags(uuid, text[]) from public, anon;
revoke all on function public.polished_duplicate_document(uuid) from public, anon;
revoke all on function public.polished_set_featured(uuid, boolean) from public, anon;
grant execute on function public.polished_set_tags(uuid, text[]) to authenticated;
grant execute on function public.polished_duplicate_document(uuid) to authenticated;
grant execute on function public.polished_set_featured(uuid, boolean) to authenticated;
grant execute on function public.polished_is_admin() to authenticated;

-- admin curation from the public catalog (by share token)
create or replace function public.polished_admin_feature(p_token uuid, p_featured boolean)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if not exists (select 1 from polished.admins where user_id = auth.uid()) then raise exception 'not authorized'; end if;
  update polished.documents set featured = coalesce(p_featured, false), updated_at = now() where share_token = p_token;
end; $$;
revoke all on function public.polished_admin_feature(uuid, boolean) from public, anon;
grant execute on function public.polished_admin_feature(uuid, boolean) to authenticated;

-- To enable curation: insert into polished.admins(user_id) values ('<owner-uuid>');
