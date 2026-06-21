-- Phase D — Search excellence (Circle 6) + provenance (Circle 8). Extend the
-- marketplace catalog with institution and language filters, and carry the
-- owning organization on every listing so provenance is visible. Organization
-- name is folded into the search text so searching an institution finds its
-- works. Same ordering/relevance as before.
drop function if exists public.polished_catalog(text, text, text, text);
create or replace function public.polished_catalog(
  p_category text default null,
  p_search text default null,
  p_sort text default 'new',
  p_author text default null,
  p_language text default null,
  p_org text default null
)
returns table(
  token uuid, kind text, title text, category text, price_cents integer, preview text,
  author_name text, author_verified boolean, license text, featured boolean,
  view_count integer, download_count integer, avg_rating numeric, review_count bigint, created_at timestamptz,
  edition_language text, org_slug text, org_name text, org_verified boolean
)
language sql security definer set search_path to 'public','polished'
as $function$
  with base as (
    select d.share_token as token, d.kind, d.title, d.category, d.price_cents, d.preview, d.author_name,
      coalesce((select bool_or(pr.verified) from polished.creator_profiles pr where pr.display_name = d.author_name), false) as author_verified,
      d.license, d.featured, d.view_count, d.download_count,
      rv.avg_rating, coalesce(rv.review_count, 0) as review_count, d.created_at,
      d.edition_language, o.slug as org_slug, o.name as org_name, o.verified as org_verified,
      lower(d.title || ' ' || coalesce(d.author_name, '') || ' ' || coalesce(d.category, '') || ' ' || coalesce(d.preview, '') || ' ' || coalesce(o.name, '')) as searchable
    from polished.documents d
    left join lateral (select avg(rating)::numeric as avg_rating, count(*) as review_count from polished.reviews r where r.document_id = d.id) rv on true
    left join polished.organizations o on o.id = d.org_id
    where d.listed = true and d.shared = true and d.share_token is not null
      and (p_category is null or d.category = p_category)
      and (p_author is null or d.author_name = p_author)
      and (p_language is null or d.edition_language = p_language)
      and (p_org is null or o.slug = p_org)
  )
  select token, kind, title, category, price_cents, preview, author_name, author_verified, license, featured,
    view_count, download_count, avg_rating, review_count, created_at, edition_language, org_slug, org_name, org_verified
  from base
  where p_search is null
     or btrim(p_search) = ''
     or (select bool_and(searchable like '%' || w || '%')
         from unnest(string_to_array(lower(btrim(p_search)), ' ')) as w
         where length(w) > 0)
  order by
    case when p_search is not null and btrim(p_search) <> '' then
      (case when title ilike '%' || p_search || '%' then 100 else 0 end)
      + (case when author_name ilike '%' || p_search || '%' then 40 else 0 end)
      + (case when org_name ilike '%' || p_search || '%' then 30 else 0 end)
      + (case when category ilike '%' || p_search || '%' then 20 else 0 end)
    end desc nulls last,
    featured desc,
    case when p_sort = 'trending' then (download_count * 3 + view_count) end desc nulls last,
    case when p_sort = 'top-rated' then avg_rating end desc nulls last,
    case when p_sort = 'price' then price_cents end asc nulls last,
    created_at desc
  limit 200;
$function$;

grant execute on function public.polished_catalog(text,text,text,text,text,text) to anon, authenticated;
