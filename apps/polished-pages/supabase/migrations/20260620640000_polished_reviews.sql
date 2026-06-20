-- Marketplace trust: ratings & reviews on published items. One review per user
-- per item; you can't review your own work. Aggregates surface on catalog cards.
create table if not exists polished.reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references polished.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);
create index if not exists reviews_document_idx on polished.reviews(document_id);
alter table polished.reviews enable row level security;

create or replace function public.polished_submit_review(p_token uuid, p_rating int, p_body text)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_doc uuid; v_owner uuid; v_r int := greatest(1, least(5, coalesce(p_rating,0)));
begin
  if v_uid is null then raise exception 'sign in to leave a review'; end if;
  select id, user_id into v_doc, v_owner from polished.documents
    where share_token = p_token and shared = true and listed = true;
  if v_doc is null then raise exception 'this item is not available for review'; end if;
  if v_owner = v_uid then raise exception 'you cannot review your own work'; end if;
  insert into polished.reviews(document_id, user_id, rating, body)
    values (v_doc, v_uid, v_r, nullif(btrim(p_body), ''))
  on conflict (document_id, user_id) do update set rating = excluded.rating, body = excluded.body, created_at = now();
end; $$;

create or replace function public.polished_list_reviews(p_token uuid)
returns table(rating int, body text, reviewer text, created_at timestamptz, avg_rating numeric, review_count bigint)
language sql security definer set search_path to 'public','polished' as $$
  with d as (select id from polished.documents where share_token = p_token and shared = true and listed = true)
  select r.rating, r.body, coalesce(pr.display_name, 'Reader') as reviewer, r.created_at,
    avg(r.rating) over () as avg_rating, count(*) over () as review_count
  from polished.reviews r
  join d on d.id = r.document_id
  left join polished.creator_profiles pr on pr.user_id = r.user_id
  order by r.created_at desc limit 100;
$$;

drop function if exists public.polished_catalog(text, text, text, text);
create function public.polished_catalog(p_category text default null, p_search text default null, p_sort text default 'new', p_author text default null)
returns table(token uuid, kind text, title text, category text, price_cents integer, preview text, author_name text, license text, featured boolean, view_count integer, download_count integer, avg_rating numeric, review_count bigint, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.kind, d.title, d.category, d.price_cents, d.preview, d.author_name, d.license, d.featured, d.view_count, d.download_count,
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

revoke all on function public.polished_submit_review(uuid, int, text) from public, anon;
revoke all on function public.polished_list_reviews(uuid) from public;
grant execute on function public.polished_submit_review(uuid, int, text) to authenticated;
grant execute on function public.polished_list_reviews(uuid) to anon, authenticated;
