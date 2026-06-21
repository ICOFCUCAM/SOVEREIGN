-- Phase F — Marketplace Density. Featured collections as a first-class discovery
-- object (real public collections containing listed works only), and a real
-- marketplace health + content-density readout for the admin dashboard. No
-- placeholders: surfaces return only genuine rows.

-- Featured collections: public creator collections that contain listed works.
create or replace function public.polished_marketplace_collections()
returns table(token uuid, title text, description text, works bigint, listed_works bigint)
language sql security definer set search_path to 'public','polished' as $$
  select c.share_token, c.title, c.description,
    count(i.document_id) as works,
    count(i.document_id) filter (where d.listed = true) as listed_works
  from polished.collections c
  join polished.collection_items i on i.collection_id = c.id
  join polished.documents d on d.id = i.document_id
  where c.public = true and c.share_token is not null
  group by c.id
  having count(i.document_id) filter (where d.listed = true) > 0
  order by listed_works desc, c.title
  limit 24;
$$;

-- Marketplace health + content-density audit (admin only). Returns no rows for
-- non-admins. Every figure is a live count — no estimates.
create or replace function public.polished_marketplace_health()
returns table(
  listings bigint, paid_listings bigint, free_listings bigint, listing_views bigint, listing_downloads bigint,
  organizations bigint, publishing_organizations bigint, repositories bigint, public_collections bigint,
  listed_languages bigint, documents_total bigint, documents_in_orgs bigint,
  unpublished_works bigint, orphaned_documents bigint, empty_storefronts bigint, empty_repositories bigint
)
language sql security definer set search_path to 'public','polished','auth' as $$
  select
    (select count(*) from polished.documents where listed and shared and share_token is not null),
    (select count(*) from polished.documents where listed and price_cents > 0),
    (select count(*) from polished.documents where listed and price_cents = 0),
    (select coalesce(sum(view_count),0) from polished.documents where listed),
    (select coalesce(sum(download_count),0) from polished.documents where listed),
    (select count(*) from polished.organizations),
    (select count(distinct o.id) from polished.organizations o join polished.documents d on d.org_id = o.id and d.listed and d.shared and d.share_token is not null),
    (select count(*) from polished.organization_collections),
    (select count(*) from polished.collections where public = true),
    (select count(distinct edition_language) from polished.documents where listed and edition_language is not null and edition_language <> ''),
    (select count(*) from polished.documents),
    (select count(*) from polished.documents where org_id is not null),
    (select count(*) from polished.documents where not listed),
    (select count(*) from polished.documents d where not exists (select 1 from auth.users u where u.id = d.user_id)),
    (select count(*) from polished.organizations o where not exists (select 1 from polished.documents d where d.org_id = o.id and d.listed)),
    (select count(*) from polished.organization_collections c where not exists (select 1 from polished.organization_collection_items i where i.collection_id = c.id))
  where public.is_admin();
$$;

grant execute on function public.polished_marketplace_collections() to anon, authenticated;
grant execute on function public.polished_marketplace_health() to authenticated;
