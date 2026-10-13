-- ExitOS · tenant isolation for the exchange tables (document-system rebuild, deliverable 2).
--
-- 0001 made every exchange table readable by any authenticated user, and the
-- app signs every browser in as an (anonymous) authenticated user, so any
-- visitor could read every company's listing profile, every offer, NDA
-- request, deal, deal document and deal event. 0002/0003 already restricted
-- writes; this restricts reads to the parties, and scrubs listing rows of the
-- private profile and exact figures that earlier versions stored in them.
--
-- Parties: the buyer on the row, and the owner of the listing it concerns.
-- The seeded demo listing ('lst-demo-helios') has no owner; its rows stay
-- readable so the demo inbox works, and the console says that demo requests
-- come from anyone using the demo.
--
-- Rollback (restores the 0001/0003 read policies; the scrubbed listing data is
-- not restorable and must not be):
--   drop policy exitos_offers_read on public.exitos_offers;           create policy exitos_offers_read on public.exitos_offers for select to authenticated using (true);
--   drop policy exitos_nda_read on public.exitos_nda_requests;        create policy exitos_nda_read on public.exitos_nda_requests for select to authenticated using (true);
--   drop policy exitos_deals_read on public.exitos_deals;             create policy exitos_deals_read on public.exitos_deals for select to authenticated using (true);
--   drop policy exitos_docs_read on public.exitos_documents;          create policy exitos_docs_read on public.exitos_documents for select to authenticated using (true);
--   drop policy exitos_events_read on public.exitos_deal_events;      create policy exitos_events_read on public.exitos_deal_events for select to authenticated using (true);
--   drop function public.exitos_owns_listing(text);

-- listing ownership, as a security-definer helper so policies on other tables
-- can ask it without needing read access to every listing row's data
create or replace function public.exitos_owns_listing(p_listing_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.exitos_listings l
    where l.id = p_listing_id and l.owner_account_id = auth.uid()::text
  );
$$;
revoke all on function public.exitos_owns_listing(text) from public;
grant execute on function public.exitos_owns_listing(text) to authenticated;

-- ── offers: the buyer who made it, and the listing's owner ───────────
drop policy if exists exitos_offers_read on public.exitos_offers;
create policy exitos_offers_read on public.exitos_offers for select to authenticated using (
  buyer_account_id = auth.uid()::text
  or public.exitos_owns_listing(listing_id)
  or listing_id = 'lst-demo-helios'
);

-- ── NDA requests ─────────────────────────────────────────────────────
drop policy if exists exitos_nda_read on public.exitos_nda_requests;
create policy exitos_nda_read on public.exitos_nda_requests for select to authenticated using (
  buyer_account_id = auth.uid()::text
  or public.exitos_owns_listing(listing_id)
  or listing_id = 'lst-demo-helios'
);

-- ── deals ────────────────────────────────────────────────────────────
drop policy if exists exitos_deals_read on public.exitos_deals;
create policy exitos_deals_read on public.exitos_deals for select to authenticated using (
  buyer_account_id = auth.uid()::text
  or public.exitos_owns_listing(listing_id)
  or listing_id = 'lst-demo-helios'
);

-- ── deal documents: the owner; buyers see 'public' ones, and 'post_nda'
--    ones only with a signed NDA request on that listing ────────────────
drop policy if exists exitos_docs_read on public.exitos_documents;
create policy exitos_docs_read on public.exitos_documents for select to authenticated using (
  public.exitos_owns_listing(listing_id)
  or data->>'visibility' = 'public'
  or (data->>'visibility' = 'post_nda' and exists (
    select 1 from public.exitos_nda_requests r
    where r.listing_id = exitos_documents.listing_id
      and r.buyer_account_id = auth.uid()::text
      and r.data->>'status' = 'signed'
  ))
);

-- ── deal events: the actor's own, and events on a listing one owns ────
drop policy if exists exitos_events_read on public.exitos_deal_events;
create policy exitos_events_read on public.exitos_deal_events for select to authenticated using (
  account_id = auth.uid()::text
  or public.exitos_owns_listing(subject_id)
  or subject_id = 'lst-demo-helios'
);

-- ── listings: scrub the private profile and exact figures ────────────
-- The listing pool stays readable by every buyer (it is the marketplace), so a
-- row may hold public fields only. Exact revenue/growth become the same
-- brackets the app uses (src/lib/bands.ts); EBITDA margin is dropped.
create or replace function public.exitos_revenue_band(v numeric)
returns jsonb language sql immutable as $$
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
returns jsonb language sql immutable as $$
  select case
    when v < 0    then jsonb_build_object('low', null, 'high', 0,    'label', 'declining')
    when v < 0.1  then jsonb_build_object('low', 0,    'high', 0.1,  'label', '0–10%')
    when v < 0.25 then jsonb_build_object('low', 0.1,  'high', 0.25, 'label', '10–25%')
    when v < 0.5  then jsonb_build_object('low', 0.25, 'high', 0.5,  'label', '25–50%')
    else               jsonb_build_object('low', 0.5,  'high', null, 'label', 'over 50%')
  end;
$$;

update public.exitos_listings
set data = jsonb_set(
  data - 'profile',
  '{publicView}',
  (data->'publicView') - 'revenueUsd' - 'growthPct' - 'ebitdaMarginPct'
    || case when coalesce(data->'publicView'->>'disclosed', 'true') <> 'false' and data->'publicView' ? 'revenueUsd'
            then jsonb_build_object('revenueBand', public.exitos_revenue_band((data->'publicView'->>'revenueUsd')::numeric)) else '{}'::jsonb end
    || case when coalesce(data->'publicView'->>'disclosed', 'true') <> 'false' and data->'publicView' ? 'growthPct'
            then jsonb_build_object('growthBand', public.exitos_growth_band((data->'publicView'->>'growthPct')::numeric)) else '{}'::jsonb end
)
where data ? 'profile'
   or data->'publicView' ? 'revenueUsd'
   or data->'publicView' ? 'growthPct'
   or data->'publicView' ? 'ebitdaMarginPct';
