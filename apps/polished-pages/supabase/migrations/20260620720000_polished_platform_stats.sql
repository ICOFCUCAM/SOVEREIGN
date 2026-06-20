-- Trust: real, public platform stats computed from actual published data (never
-- fabricated). The homepage shows these only when they are meaningful.
create or replace function public.polished_platform_stats()
returns jsonb language sql security definer set search_path to 'public','polished' as $$
  select jsonb_build_object(
    'resources',  (select count(*) from polished.documents where listed = true and shared = true),
    'creators',   (select count(distinct author_name) from polished.documents where listed = true and shared = true and author_name is not null),
    'downloads',  (select coalesce(sum(download_count), 0) from polished.documents where listed = true and shared = true),
    'views',      (select coalesce(sum(view_count), 0) from polished.documents where listed = true and shared = true),
    'categories', (select count(distinct category) from polished.documents where listed = true and shared = true and category is not null),
    'languages',  (select count(distinct edition_language) from polished.documents where edition_language is not null)
  );
$$;
revoke all on function public.polished_platform_stats() from public;
grant execute on function public.polished_platform_stats() to anon, authenticated;
