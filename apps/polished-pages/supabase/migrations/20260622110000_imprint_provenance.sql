-- Imprint as real book provenance: persist it at publish and surface it on the
-- public listing (Publisher → Imprint → Book lineage).
alter table polished.documents add column if not exists imprint text;

drop function if exists public.polished_publish(uuid, boolean, text, integer, text, text);
create function public.polished_publish(p_id uuid, p_listed boolean, p_category text, p_price_cents integer, p_author text default null::text, p_license text default null::text, p_imprint text default null::text)
returns text language plpgsql security definer set search_path to 'public', 'polished'
as $function$
declare v_uid uuid := auth.uid(); v_token uuid; v_plan text; v_price int := greatest(0, coalesce(p_price_cents, 0));
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_listed and v_price > 0 then
    select plan into v_plan from polished.entitlements where user_id = v_uid;
    if coalesce(v_plan, 'free') = 'free' then
      raise exception 'Listing paid items requires a paid plan (commercial rights). Upgrade to sell on the marketplace.';
    end if;
  end if;
  if p_listed then
    update polished.documents set
      listed = true, shared = true, share_token = coalesce(share_token, gen_random_uuid()),
      category = nullif(btrim(p_category), ''), price_cents = v_price,
      author_name = nullif(btrim(p_author), ''), license = nullif(btrim(p_license), ''),
      imprint = nullif(btrim(p_imprint), ''), updated_at = now()
      where id = p_id and user_id = v_uid;
  else
    update polished.documents set listed = false, updated_at = now() where id = p_id and user_id = v_uid;
  end if;
  select share_token into v_token from polished.documents where id = p_id and user_id = v_uid;
  return v_token::text;
end; $function$;

create or replace function public.polished_get_shared(p_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public', 'polished'
as $function$
declare v jsonb;
begin
  select jsonb_build_object(
    'kind', d.kind, 'title', d.title, 'template', d.template, 'payload', d.payload,
    'author_name', d.author_name,
    'author_verified', coalesce((select bool_or(pr.verified) from polished.creator_profiles pr where pr.display_name = d.author_name), false),
    'license', d.license, 'listed', d.listed, 'category', d.category, 'price_cents', d.price_cents,
    'view_count', d.view_count, 'download_count', d.download_count, 'edition_language', d.edition_language,
    'created_at', d.created_at, 'imprint', d.imprint,
    'org_slug', o.slug, 'org_name', o.name, 'org_verified', o.verified
  ) into v
  from polished.documents d
  left join polished.organizations o on o.id = d.org_id
  where d.share_token = p_token and d.shared = true;
  return v;
end; $function$;
