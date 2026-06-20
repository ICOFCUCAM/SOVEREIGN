alter table polished.documents add column if not exists listed boolean not null default false;
alter table polished.documents add column if not exists category text;
alter table polished.documents add column if not exists price_cents integer not null default 0;
create index if not exists documents_listed_idx on polished.documents(listed, created_at desc) where listed;

drop function if exists public.polished_list_documents();
create function public.polished_list_documents()
returns table(id uuid, kind text, title text, template text, preview text, favorite boolean, shared boolean, listed boolean, category text, price_cents integer, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.template, d.preview, d.favorite, d.shared, d.listed, d.category, d.price_cents, d.created_at
  from polished.documents d
  where d.user_id = auth.uid()
  order by d.favorite desc, d.created_at desc
  limit 300;
$$;
revoke all on function public.polished_list_documents() from public, anon;
grant execute on function public.polished_list_documents() to authenticated;

create or replace function public.polished_publish(p_id uuid, p_listed boolean, p_category text, p_price_cents integer)
returns text
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_token uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_listed then
    update polished.documents set
      listed = true, shared = true, share_token = coalesce(share_token, gen_random_uuid()),
      category = nullif(btrim(p_category), ''), price_cents = greatest(0, coalesce(p_price_cents, 0)), updated_at = now()
      where id = p_id and user_id = v_uid;
  else
    update polished.documents set listed = false, updated_at = now() where id = p_id and user_id = v_uid;
  end if;
  select share_token into v_token from polished.documents where id = p_id and user_id = v_uid;
  return v_token::text;
end; $$;
revoke all on function public.polished_publish(uuid, boolean, text, integer) from public, anon;
grant execute on function public.polished_publish(uuid, boolean, text, integer) to authenticated;

create or replace function public.polished_catalog(p_category text default null)
returns table(token uuid, kind text, title text, category text, price_cents integer, preview text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.kind, d.title, d.category, d.price_cents, d.preview, d.created_at
  from polished.documents d
  where d.listed = true and d.shared = true and d.share_token is not null
    and (p_category is null or d.category = p_category)
  order by d.created_at desc limit 200;
$$;
revoke all on function public.polished_catalog(text) from public;
grant execute on function public.polished_catalog(text) to anon, authenticated;
