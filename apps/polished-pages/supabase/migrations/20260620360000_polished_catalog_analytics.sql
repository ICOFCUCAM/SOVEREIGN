-- Catalog analytics: view/download counters + trending and author-filtered catalog.
alter table polished.documents add column if not exists view_count integer not null default 0;
alter table polished.documents add column if not exists download_count integer not null default 0;

-- Anon-callable counters, scoped to publicly shared docs only.
create or replace function public.polished_record_view(p_token uuid)
returns void language sql security definer set search_path to 'public','polished' as $$
  update polished.documents set view_count = view_count + 1 where share_token = p_token and shared = true;
$$;
create or replace function public.polished_record_download(p_token uuid)
returns void language sql security definer set search_path to 'public','polished' as $$
  update polished.documents set download_count = download_count + 1 where share_token = p_token and shared = true;
$$;
revoke all on function public.polished_record_view(uuid) from public;
revoke all on function public.polished_record_download(uuid) from public;
grant execute on function public.polished_record_view(uuid) to anon, authenticated;
grant execute on function public.polished_record_download(uuid) to anon, authenticated;

-- Catalog now supports sort (new | trending | price) + author filter, and returns counts.
drop function if exists public.polished_catalog(text, text);
create function public.polished_catalog(p_category text default null, p_search text default null, p_sort text default 'new', p_author text default null)
returns table(token uuid, kind text, title text, category text, price_cents integer, preview text, author_name text, license text, featured boolean, view_count integer, download_count integer, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.kind, d.title, d.category, d.price_cents, d.preview, d.author_name, d.license, d.featured, d.view_count, d.download_count, d.created_at
  from polished.documents d
  where d.listed = true and d.shared = true and d.share_token is not null
    and (p_category is null or d.category = p_category)
    and (p_author is null or d.author_name = p_author)
    and (p_search is null or d.title ilike '%' || p_search || '%')
  order by d.featured desc,
    case when p_sort = 'trending' then (d.download_count * 3 + d.view_count) end desc nulls last,
    case when p_sort = 'price' then d.price_cents end asc nulls last,
    d.created_at desc
  limit 200;
$$;
revoke all on function public.polished_catalog(text, text, text, text) from public;
grant execute on function public.polished_catalog(text, text, text, text) to anon, authenticated;

-- Owner library listing surfaces counts so creators see their analytics.
drop function if exists public.polished_list_documents();
create function public.polished_list_documents()
returns table(id uuid, kind text, title text, template text, preview text, favorite boolean, shared boolean, listed boolean, category text, price_cents integer, tags text[], is_template boolean, view_count integer, download_count integer, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.template, d.preview, d.favorite, d.shared, d.listed, d.category, d.price_cents, d.tags, d.is_template, d.view_count, d.download_count, d.created_at
  from polished.documents d where d.user_id = auth.uid()
  order by d.favorite desc, d.created_at desc limit 300;
$$;
revoke all on function public.polished_list_documents() from public, anon;
grant execute on function public.polished_list_documents() to authenticated;
