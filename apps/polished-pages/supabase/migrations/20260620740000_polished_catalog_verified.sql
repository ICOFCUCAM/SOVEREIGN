-- Marketplace trust in the grid: surface the verified-creator flag on every
-- catalog listing so the badge shows on cards and discovery sections, not just
-- on author pages. Real provenance — joined from polished.creator_profiles.
drop function if exists public.polished_catalog(text, text, text, text);
create function public.polished_catalog(p_category text default null, p_search text default null, p_sort text default 'new', p_author text default null)
returns table(token uuid, kind text, title text, category text, price_cents integer, preview text, author_name text, author_verified boolean, license text, featured boolean, view_count integer, download_count integer, avg_rating numeric, review_count bigint, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.kind, d.title, d.category, d.price_cents, d.preview, d.author_name,
    coalesce((select bool_or(pr.verified) from polished.creator_profiles pr where pr.display_name = d.author_name), false) as author_verified,
    d.license, d.featured, d.view_count, d.download_count,
    rv.avg_rating, coalesce(rv.review_count, 0) as review_count, d.created_at
  from polished.documents d
  left join lateral (select avg(rating)::numeric as avg_rating, count(*) as review_count from polished.reviews r where r.document_id = d.id) rv on true
  where d.listed = true and d.shared = true and d.share_token is not null
    and (p_category is null or d.category = p_category)
    and (p_author is null or d.author_name = p_author)
    and (p_search is null or d.title ilike '%' || p_search || '%')
  order by d.featured desc,
    case when p_sort = 'trending' then (d.download_count * 3 + d.view_count) end desc nulls last,
    case when p_sort = 'top-rated' then rv.avg_rating end desc nulls last,
    case when p_sort = 'price' then d.price_cents end asc nulls last,
    d.created_at desc
  limit 200;
$$;
revoke all on function public.polished_catalog(text, text, text, text) from public;
grant execute on function public.polished_catalog(text, text, text, text) to anon, authenticated;
