-- Phase D — Real Marketplace Growth. Enrich the public institution showcase
-- with repository count and creation date so the marketplace can present
-- institutions as brands and surface new institutions. Still real content only
-- (inner join to published works), grouped/sorted client-side.
drop function if exists public.polished_org_showcase();
create or replace function public.polished_org_showcase()
returns table(slug text, name text, type text, tagline text, verified boolean, works bigint, languages bigint, collections bigint, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select o.slug, o.name, o.type, o.tagline, o.verified,
    count(distinct d.id) as works,
    count(distinct nullif(d.edition_language,'')) as languages,
    (select count(*) from polished.organization_collections c where c.org_id = o.id) as collections,
    o.created_at
  from polished.organizations o
  join polished.documents d on d.org_id = o.id and d.listed = true and d.shared = true and d.share_token is not null
  group by o.id
  order by o.verified desc, works desc, o.name
  limit 60;
$$;
grant execute on function public.polished_org_showcase() to anon, authenticated;
