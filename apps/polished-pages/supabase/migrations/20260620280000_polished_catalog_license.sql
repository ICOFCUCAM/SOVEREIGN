alter table polished.documents add column if not exists license text;

drop function if exists public.polished_publish(uuid, boolean, text, integer, text);
create function public.polished_publish(p_id uuid, p_listed boolean, p_category text, p_price_cents integer, p_author text default null, p_license text default null)
returns text
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_token uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_listed then
    update polished.documents set
      listed = true, shared = true, share_token = coalesce(share_token, gen_random_uuid()),
      category = nullif(btrim(p_category), ''), price_cents = greatest(0, coalesce(p_price_cents, 0)),
      author_name = nullif(btrim(p_author), ''), license = nullif(btrim(p_license), ''), updated_at = now()
      where id = p_id and user_id = v_uid;
  else
    update polished.documents set listed = false, updated_at = now() where id = p_id and user_id = v_uid;
  end if;
  select share_token into v_token from polished.documents where id = p_id and user_id = v_uid;
  return v_token::text;
end; $$;
revoke all on function public.polished_publish(uuid, boolean, text, integer, text, text) from public, anon;
grant execute on function public.polished_publish(uuid, boolean, text, integer, text, text) to authenticated;

drop function if exists public.polished_catalog(text, text);
create function public.polished_catalog(p_category text default null, p_search text default null)
returns table(token uuid, kind text, title text, category text, price_cents integer, preview text, author_name text, license text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.kind, d.title, d.category, d.price_cents, d.preview, d.author_name, d.license, d.created_at
  from polished.documents d
  where d.listed = true and d.shared = true and d.share_token is not null
    and (p_category is null or d.category = p_category)
    and (p_search is null or d.title ilike '%' || p_search || '%')
  order by d.created_at desc limit 200;
$$;
revoke all on function public.polished_catalog(text, text) from public;
grant execute on function public.polished_catalog(text, text) to anon, authenticated;

create or replace function public.polished_get_shared(p_token uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','polished' as $$
declare v jsonb;
begin
  select jsonb_build_object('kind', kind, 'title', title, 'template', template, 'payload', payload, 'author_name', author_name, 'license', license)
    into v from polished.documents where share_token = p_token and shared = true;
  return v;
end; $$;
