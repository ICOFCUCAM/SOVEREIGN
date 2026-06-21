-- Phase D — Real Marketplace Growth. Public discovery RPCs that turn the
-- marketplace into a knowledge ecosystem: publisher brand stats, multilingual
-- discovery (language collections + most-translated works), and institutions
-- trending by real engagement. Every figure is from real, listed rows.

-- Brand stats for a public organization storefront (publisher as a brand).
create or replace function public.polished_org_storefront_stats(p_slug text)
returns table(works bigint, languages bigint, collections bigint, series bigint, editions bigint)
language sql security definer set search_path to 'public','polished' as $$
  select
    (select count(*) from polished.documents d join polished.organizations o on o.id = d.org_id
       where o.slug = p_slug and d.listed = true and d.shared = true and d.share_token is not null),
    (select count(distinct d.edition_language) from polished.documents d join polished.organizations o on o.id = d.org_id
       where o.slug = p_slug and d.edition_language is not null and d.edition_language <> ''),
    (select count(*) from polished.organization_collections c join polished.organizations o on o.id = c.org_id where o.slug = p_slug),
    (select count(*) from polished.organization_collections c join polished.organizations o on o.id = c.org_id where o.slug = p_slug and c.kind = 'series'),
    (select count(*) from polished.documents d join polished.organizations o on o.id = d.org_id
       where o.slug = p_slug and d.parent_document_id is not null);
$$;

-- Language collections: listed works grouped by language (localization as a
-- marketplace strength).
create or replace function public.polished_marketplace_languages()
returns table(language text, works bigint)
language sql security definer set search_path to 'public','polished' as $$
  select d.edition_language as language, count(*) as works
  from polished.documents d
  where d.listed = true and d.shared = true and d.share_token is not null
    and d.edition_language is not null and d.edition_language <> ''
  group by d.edition_language
  order by 2 desc, 1
  limit 24;
$$;

-- Most translated works: listed originals ranked by how many localized editions
-- they have. Cross-language editions surfaced as a platform differentiator.
create or replace function public.polished_marketplace_most_localized()
returns table(token uuid, title text, author_name text, category text, price_cents integer, editions bigint)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.title, d.author_name, d.category, d.price_cents,
    (select count(*) from polished.documents e where e.parent_document_id = d.id and e.edition_language is not null) as editions
  from polished.documents d
  where d.listed = true and d.shared = true and d.share_token is not null
    and d.parent_document_id is null
  group by d.id
  having (select count(*) from polished.documents e where e.parent_document_id = d.id and e.edition_language is not null) > 0
  order by editions desc, d.created_at desc
  limit 12;
$$;

-- Institutions trending by real engagement (views + downloads of listed works).
create or replace function public.polished_marketplace_trending_orgs()
returns table(slug text, name text, type text, verified boolean, works bigint, engagement bigint)
language sql security definer set search_path to 'public','polished' as $$
  select o.slug, o.name, o.type, o.verified,
    count(distinct d.id) as works,
    coalesce(sum(coalesce(d.view_count,0) + coalesce(d.download_count,0)), 0) as engagement
  from polished.organizations o
  join polished.documents d on d.org_id = o.id and d.listed = true and d.shared = true and d.share_token is not null
  group by o.id
  having coalesce(sum(coalesce(d.view_count,0) + coalesce(d.download_count,0)), 0) > 0
  order by engagement desc, works desc
  limit 12;
$$;

grant execute on function public.polished_org_storefront_stats(text) to anon, authenticated;
grant execute on function public.polished_marketplace_languages() to anon, authenticated;
grant execute on function public.polished_marketplace_most_localized() to anon, authenticated;
grant execute on function public.polished_marketplace_trending_orgs() to anon, authenticated;
