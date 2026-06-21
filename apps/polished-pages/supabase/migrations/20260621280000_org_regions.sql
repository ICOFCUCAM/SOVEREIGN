-- Regional coverage for NGO / ministry program centers. edition_culture is the
-- real cultural/regional dimension set during localization, so we surface it as
-- "regions". Membership-checked, same pattern as the other org analytics RPCs.
create or replace function public.polished_org_regions(p_org uuid)
returns table(region text, total bigint)
language sql security definer set search_path to 'public','polished' as $$
  select d.edition_culture as region, count(*) as total
  from polished.documents d
  where d.org_id = p_org and polished.org_is_member(p_org)
    and d.edition_culture is not null and d.edition_culture <> ''
  group by d.edition_culture
  order by 2 desc, 1;
$$;
grant execute on function public.polished_org_regions(uuid) to authenticated;
