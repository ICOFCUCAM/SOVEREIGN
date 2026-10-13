-- ExitOS · tenant isolation, part 2 of 2: listings hold public fields only.
-- Applied to the live project as version 20261013120536. The final scrub UPDATE was not run there
-- because no listing row held a profile or exact figures (0 rows, checked 2026-10-13); in any other
-- environment it rewrites such rows through the trigger.
--
-- Rollback:
--   drop trigger exitos_listings_public_only on public.exitos_listings; drop function public.exitos_listings_public_only();
--   drop function public.exitos_listing_public_data(jsonb);
--   drop function public.exitos_revenue_band(numeric); drop function public.exitos_growth_band(numeric);
-- (scrubbed data is not restorable and must not be)

-- ── listings: scrub the private profile and exact figures ────────────
-- The listing pool stays readable by every buyer (it is the marketplace), so a
-- row may hold public fields only. Exact revenue/growth become the same
-- brackets the app uses (src/lib/bands.ts); EBITDA margin is dropped.
create or replace function public.exitos_revenue_band(v numeric)
returns jsonb language sql immutable set search_path = public as $$
  select case
    when v < 5e6   then jsonb_build_object('low', 0,     'high', 5e6,   'label', 'under $5M')
    when v < 10e6  then jsonb_build_object('low', 5e6,   'high', 10e6,  'label', '$5–10M')
    when v < 25e6  then jsonb_build_object('low', 10e6,  'high', 25e6,  'label', '$10–25M')
    when v < 50e6  then jsonb_build_object('low', 25e6,  'high', 50e6,  'label', '$25–50M')
    when v < 100e6 then jsonb_build_object('low', 50e6,  'high', 100e6, 'label', '$50–100M')
    when v < 250e6 then jsonb_build_object('low', 100e6, 'high', 250e6, 'label', '$100–250M')
    else                jsonb_build_object('low', 250e6, 'high', null,  'label', 'over $250M')
  end;
$$;
create or replace function public.exitos_growth_band(v numeric)
returns jsonb language sql immutable set search_path = public as $$
  select case
    when v < 0    then jsonb_build_object('low', null, 'high', 0,    'label', 'declining')
    when v < 0.1  then jsonb_build_object('low', 0,    'high', 0.1,  'label', '0–10%')
    when v < 0.25 then jsonb_build_object('low', 0.1,  'high', 0.25, 'label', '10–25%')
    when v < 0.5  then jsonb_build_object('low', 0.25, 'high', 0.5,  'label', '25–50%')
    else               jsonb_build_object('low', 0.5,  'high', null, 'label', 'over 50%')
  end;
$$;

-- One definition of "public fields only", used by the scrub below and by a
-- trigger, so a listing written by any client (including builds older than
-- this migration) never stores a profile or exact figures.
create or replace function public.exitos_listing_public_data(d jsonb)
returns jsonb language sql immutable set search_path = public as $$
  select case when d ? 'profile' or d->'publicView' ? 'revenueUsd' or d->'publicView' ? 'growthPct' or d->'publicView' ? 'ebitdaMarginPct'
  then jsonb_set(
    d - 'profile',
    '{publicView}',
    coalesce(d->'publicView', '{}'::jsonb) - 'revenueUsd' - 'growthPct' - 'ebitdaMarginPct'
      || case when coalesce(d->'publicView'->>'disclosed', 'true') <> 'false' and d->'publicView' ? 'revenueUsd'
              then jsonb_build_object('revenueBand', public.exitos_revenue_band((d->'publicView'->>'revenueUsd')::numeric)) else '{}'::jsonb end
      || case when coalesce(d->'publicView'->>'disclosed', 'true') <> 'false' and d->'publicView' ? 'growthPct'
              then jsonb_build_object('growthBand', public.exitos_growth_band((d->'publicView'->>'growthPct')::numeric)) else '{}'::jsonb end
  )
  else d end;
$$;

create or replace function public.exitos_listings_public_only()
returns trigger language plpgsql set search_path = public as $$
begin
  new.data := public.exitos_listing_public_data(new.data);
  return new;
end;
$$;
drop trigger if exists exitos_listings_public_only on public.exitos_listings;
create trigger exitos_listings_public_only before insert or update on public.exitos_listings
  for each row execute function public.exitos_listings_public_only();

-- scrub what earlier versions stored (the trigger rewrites each row)
update public.exitos_listings set data = data
where data ? 'profile'
   or data->'publicView' ? 'revenueUsd'
   or data->'publicView' ? 'growthPct'
   or data->'publicView' ? 'ebitdaMarginPct';
