-- Organization Analytics (Phase B). Meaningful, visibility-focused analytics
-- for the command center, every figure derived from real rows. Membership is
-- checked inside each function (same pattern as the rest of the org RPCs).

-- Monthly activity for the last 6 months: works created, works listed, and
-- localized editions — by the document's created_at.
create or replace function public.polished_org_trends(p_org uuid)
returns table(period date, created bigint, published bigint, editions bigint)
language sql security definer set search_path to 'public','polished' as $$
  with months as (
    select date_trunc('month', generate_series(now() - interval '5 months', now(), interval '1 month'))::date as period
  )
  select m.period,
    count(d.id) as created,
    count(d.id) filter (where d.listed) as published,
    count(d.id) filter (where d.parent_document_id is not null) as editions
  from months m
  left join polished.documents d
    on d.org_id = p_org and date_trunc('month', d.created_at)::date = m.period
  where polished.org_is_member(p_org)
  group by m.period
  order by m.period;
$$;

-- Marketplace performance: the organization's strongest works by engagement.
create or replace function public.polished_org_top_works(p_org uuid)
returns table(title text, kind text, views integer, downloads integer, listed boolean)
language sql security definer set search_path to 'public','polished' as $$
  select d.title, d.kind, d.view_count, d.download_count, d.listed
  from polished.documents d
  where d.org_id = p_org and polished.org_is_member(p_org)
  order by (coalesce(d.view_count,0) + coalesce(d.download_count,0)) desc, d.created_at desc
  limit 8;
$$;

-- Member contribution: works and published works per member.
create or replace function public.polished_org_member_contributions(p_org uuid)
returns table(email text, role text, works bigint, published bigint)
language sql security definer set search_path to 'public','polished','auth' as $$
  select u.email, m.role,
    count(d.id) as works,
    count(d.id) filter (where d.listed) as published
  from polished.organization_members m
  join auth.users u on u.id = m.user_id
  left join polished.documents d on d.org_id = p_org and d.user_id = m.user_id
  where m.org_id = p_org and polished.org_is_member(p_org)
  group by u.email, m.role
  order by works desc, u.email;
$$;

-- Localization activity: works by language across the organization.
create or replace function public.polished_org_languages(p_org uuid)
returns table(language text, total bigint)
language sql security definer set search_path to 'public','polished' as $$
  select coalesce(nullif(d.edition_language,''), 'Original') as language, count(*) as total
  from polished.documents d
  where d.org_id = p_org and polished.org_is_member(p_org)
  group by 1
  order by 2 desc, 1;
$$;

-- Collection health: items and published items per repository.
create or replace function public.polished_org_collection_health(p_org uuid)
returns table(id uuid, name text, kind text, items bigint, published bigint)
language sql security definer set search_path to 'public','polished' as $$
  select c.id, c.name, c.kind,
    count(i.document_id) as items,
    count(i.document_id) filter (where d.listed) as published
  from polished.organization_collections c
  left join polished.organization_collection_items i on i.collection_id = c.id
  left join polished.documents d on d.id = i.document_id
  where c.org_id = p_org and polished.org_is_member(p_org)
  group by c.id, c.name, c.kind
  order by items desc, c.name;
$$;

grant execute on function public.polished_org_trends(uuid) to authenticated;
grant execute on function public.polished_org_top_works(uuid) to authenticated;
grant execute on function public.polished_org_member_contributions(uuid) to authenticated;
grant execute on function public.polished_org_languages(uuid) to authenticated;
grant execute on function public.polished_org_collection_health(uuid) to authenticated;
