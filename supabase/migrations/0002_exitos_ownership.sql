-- ExitOS ownership hardening — replace the permissive USING(true) write
-- policies (flagged by the advisor, lint 0024) with precise, ownership-scoped
-- ones so a buyer can't mutate a founder's listing or another buyer's offer.
-- Reads stay open to authenticated (shared exchange); writes are scoped.

-- ── listings: only the owner writes their listing ───────────────────
alter table public.exitos_listings add column if not exists owner_account_id text;

drop policy if exists exitos_listings_write on public.exitos_listings;
drop policy if exists exitos_listings_ins   on public.exitos_listings;
drop policy if exists exitos_listings_upd   on public.exitos_listings;
drop policy if exists exitos_listings_del   on public.exitos_listings;
create policy exitos_listings_ins on public.exitos_listings for insert to authenticated with check (owner_account_id = auth.uid()::text);
create policy exitos_listings_upd on public.exitos_listings for update to authenticated using (owner_account_id = auth.uid()::text) with check (owner_account_id = auth.uid()::text);
create policy exitos_listings_del on public.exitos_listings for delete to authenticated using (owner_account_id = auth.uid()::text);

-- ── offers: the buyer owns their offer; the listing owner may resolve it ──
drop policy if exists exitos_offers_write on public.exitos_offers;
drop policy if exists exitos_offers_ins   on public.exitos_offers;
drop policy if exists exitos_offers_upd   on public.exitos_offers;
drop policy if exists exitos_offers_del   on public.exitos_offers;
create policy exitos_offers_ins on public.exitos_offers for insert to authenticated with check (buyer_account_id = auth.uid()::text);
create policy exitos_offers_upd on public.exitos_offers for update to authenticated using (
  buyer_account_id = auth.uid()::text
  or exists (select 1 from public.exitos_listings l where l.id = exitos_offers.listing_id and l.owner_account_id = auth.uid()::text)
);
create policy exitos_offers_del on public.exitos_offers for delete to authenticated using (buyer_account_id = auth.uid()::text);

-- ── NDA requests: the buyer requests; the listing owner resolves ────
drop policy if exists exitos_nda_write on public.exitos_nda_requests;
drop policy if exists exitos_nda_ins   on public.exitos_nda_requests;
drop policy if exists exitos_nda_upd   on public.exitos_nda_requests;
drop policy if exists exitos_nda_del   on public.exitos_nda_requests;
create policy exitos_nda_ins on public.exitos_nda_requests for insert to authenticated with check (buyer_account_id = auth.uid()::text);
create policy exitos_nda_upd on public.exitos_nda_requests for update to authenticated using (
  buyer_account_id = auth.uid()::text
  or exists (select 1 from public.exitos_listings l where l.id = exitos_nda_requests.listing_id and l.owner_account_id = auth.uid()::text)
);
create policy exitos_nda_del on public.exitos_nda_requests for delete to authenticated using (buyer_account_id = auth.uid()::text);

-- ── documents: only the listing owner attaches/edits documents ──────
drop policy if exists exitos_docs_write on public.exitos_documents;
drop policy if exists exitos_docs_ins   on public.exitos_documents;
drop policy if exists exitos_docs_upd   on public.exitos_documents;
drop policy if exists exitos_docs_del   on public.exitos_documents;
create policy exitos_docs_ins on public.exitos_documents for insert to authenticated with check (
  exists (select 1 from public.exitos_listings l where l.id = exitos_documents.listing_id and l.owner_account_id = auth.uid()::text)
);
create policy exitos_docs_upd on public.exitos_documents for update to authenticated using (
  exists (select 1 from public.exitos_listings l where l.id = exitos_documents.listing_id and l.owner_account_id = auth.uid()::text)
);
create policy exitos_docs_del on public.exitos_documents for delete to authenticated using (
  exists (select 1 from public.exitos_listings l where l.id = exitos_documents.listing_id and l.owner_account_id = auth.uid()::text)
);
