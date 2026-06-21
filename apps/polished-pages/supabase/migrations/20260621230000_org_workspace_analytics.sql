-- Organization Workspace — richer, truthful analytics for the command center.
-- Extends org analytics with localized editions (translations) and the number
-- of distinct languages, and adds a content-by-type breakdown. Every figure is
-- derived from real rows in polished.documents — nothing is fabricated.

-- Recreate analytics with two additional real signals: translations + languages.
drop function if exists public.polished_org_analytics(uuid);
create or replace function public.polished_org_analytics(p_org uuid)
returns table(
  works bigint, published bigint, views bigint, downloads bigint,
  members bigint, collections bigint, translations bigint, languages bigint
)
language sql security definer set search_path to 'public','polished' as $$
  select
    (select count(*) from polished.documents d where d.org_id = p_org),
    (select count(*) from polished.documents d where d.org_id = p_org and d.listed = true),
    (select coalesce(sum(view_count),0) from polished.documents d where d.org_id = p_org),
    (select coalesce(sum(download_count),0) from polished.documents d where d.org_id = p_org),
    (select count(*) from polished.organization_members m where m.org_id = p_org),
    (select count(*) from polished.organization_collections c where c.org_id = p_org),
    -- localized editions: documents derived from a parent (a translation/edition)
    (select count(*) from polished.documents d where d.org_id = p_org and d.parent_document_id is not null),
    -- distinct languages the organization publishes in
    (select count(distinct d.edition_language) from polished.documents d
       where d.org_id = p_org and d.edition_language is not null and d.edition_language <> '')
  where polished.org_is_member(p_org);
$$;

-- Content mix by kind (books, curricula, assessments, storybooks, …) so the
-- workspace can show what the organization actually produces.
create or replace function public.polished_org_content(p_org uuid)
returns table(kind text, total bigint, published bigint)
language sql security definer set search_path to 'public','polished' as $$
  select coalesce(nullif(d.kind, ''), 'other') as kind,
         count(*) as total,
         count(*) filter (where d.listed = true) as published
  from polished.documents d
  where d.org_id = p_org and polished.org_is_member(p_org)
  group by 1
  order by 2 desc, 1;
$$;

-- Category mix across listed works (Children's storybooks, Curriculum,
-- Textbooks, …) — powers the publisher / school / NGO type-specific views.
create or replace function public.polished_org_categories(p_org uuid)
returns table(category text, total bigint)
language sql security definer set search_path to 'public','polished' as $$
  select coalesce(nullif(d.category, ''), 'Other') as category, count(*) as total
  from polished.documents d
  where d.org_id = p_org and d.listed = true and polished.org_is_member(p_org)
  group by 1
  order by 2 desc, 1;
$$;

grant execute on function public.polished_org_analytics(uuid) to authenticated;
grant execute on function public.polished_org_content(uuid) to authenticated;
grant execute on function public.polished_org_categories(uuid) to authenticated;
