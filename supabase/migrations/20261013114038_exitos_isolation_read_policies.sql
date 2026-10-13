-- ExitOS · tenant isolation for the exchange tables (document-system rebuild, deliverable 2), part 1 of 2.
-- Applied to the live project as version 20261013114038. The read policies already exist (0001/0003),
-- so they are altered in place.
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
--   alter policy exitos_offers_read on public.exitos_offers using (true);
--   alter policy exitos_nda_read on public.exitos_nda_requests using (true);
--   alter policy exitos_deals_read on public.exitos_deals using (true);
--   alter policy exitos_docs_read on public.exitos_documents using (true);
--   alter policy exitos_events_read on public.exitos_deal_events using (true);
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
alter policy exitos_offers_read on public.exitos_offers using (
  buyer_account_id = auth.uid()::text
  or public.exitos_owns_listing(listing_id)
  or listing_id = 'lst-demo-helios'
);

-- ── NDA requests ─────────────────────────────────────────────────────
alter policy exitos_nda_read on public.exitos_nda_requests using (
  buyer_account_id = auth.uid()::text
  or public.exitos_owns_listing(listing_id)
  or listing_id = 'lst-demo-helios'
);

-- ── deals ────────────────────────────────────────────────────────────
alter policy exitos_deals_read on public.exitos_deals using (
  buyer_account_id = auth.uid()::text
  or public.exitos_owns_listing(listing_id)
  or listing_id = 'lst-demo-helios'
);

-- ── deal documents: the owner; buyers see 'public' ones, and 'post_nda'
--    ones only with a signed NDA request on that listing ────────────────
alter policy exitos_docs_read on public.exitos_documents using (
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
alter policy exitos_events_read on public.exitos_deal_events using (
  account_id = auth.uid()::text
  or public.exitos_owns_listing(subject_id)
  or subject_id = 'lst-demo-helios'
);
