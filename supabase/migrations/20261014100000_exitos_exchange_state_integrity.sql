-- ExitOS · state integrity for NDA requests and offers (security fix, deliverable 5).
--
-- Found in the deliverable 5 survey: the insert policies on exitos_nda_requests and
-- exitos_offers check only that the writer is the buyer, and the update policies let
-- the buyer rewrite the row with no state rule. A buyer could therefore create or edit
-- their own NDA request with status "signed", which unlocks every post_nda document on
-- the listing (exitos_docs_read), or mark their own offer "accepted". No founder action
-- or signature was needed.
--
-- Now, for signed-in users (service role and the database owner are unaffected):
--   NDA requests  start as "requested"; only the listing owner moves requested → signed | rejected;
--                 the listing and buyer of a request never change.
--   Offers        start as "submitted"; the buyer may withdraw, or revise amount and note while
--                 submitted; only the listing owner moves submitted → accepted | rejected;
--                 the listing and buyer never change; resolved offers are final.
-- The update policies gain a WITH CHECK, and anon loses its (unused) table privileges.
-- "Signed" still means the owner recorded it, not that signatures exist: the NDA
-- lifecycle with signature evidence (C-2) replaces it in deliverable 5.
--
-- Rollback:
--   drop trigger exitos_nda_request_guard on public.exitos_nda_requests; drop function public.exitos_nda_request_guard();
--   drop trigger exitos_offer_guard on public.exitos_offers; drop function public.exitos_offer_guard();
--   alter policy exitos_nda_upd on public.exitos_nda_requests with check (true);   -- restores the previous behaviour
--   alter policy exitos_offers_upd on public.exitos_offers with check (true);
--   grant all on public.exitos_nda_requests, public.exitos_offers, public.exitos_documents to anon;

create or replace function public.exitos_nda_request_guard() returns trigger
language plpgsql set search_path = public as $$
declare st_old text; st_new text := coalesce(new.data->>'status', 'requested');
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    if st_new <> 'requested' then raise exception 'an NDA request starts as requested; only the listing owner resolves it'; end if;
    return new;
  end if;
  if new.id <> old.id or new.listing_id is distinct from old.listing_id or new.buyer_account_id is distinct from old.buyer_account_id then
    raise exception 'an NDA request cannot be moved to another listing or buyer';
  end if;
  st_old := coalesce(old.data->>'status', 'requested');
  if st_new <> st_old and not (st_old = 'requested' and st_new in ('signed', 'rejected') and public.exitos_owns_listing(old.listing_id)) then
    raise exception 'only the listing owner resolves a requested NDA (% to % refused)', st_old, st_new;
  end if;
  return new;
end $$;
create trigger exitos_nda_request_guard before insert or update on public.exitos_nda_requests
  for each row execute function public.exitos_nda_request_guard();

create or replace function public.exitos_offer_guard() returns trigger
language plpgsql set search_path = public as $$
declare st_old text; st_new text := coalesce(new.data->>'status', 'submitted'); is_buyer boolean; is_owner boolean;
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    if st_new <> 'submitted' then raise exception 'an offer starts as submitted; only the listing owner accepts or rejects it'; end if;
    return new;
  end if;
  if new.id <> old.id or new.listing_id is distinct from old.listing_id or new.buyer_account_id is distinct from old.buyer_account_id then
    raise exception 'an offer cannot be moved to another listing or buyer';
  end if;
  st_old := coalesce(old.data->>'status', 'submitted');
  is_buyer := old.buyer_account_id = auth.uid()::text;
  is_owner := public.exitos_owns_listing(old.listing_id);
  if st_new <> st_old and not (st_old = 'submitted' and ((is_owner and st_new in ('accepted', 'rejected')) or (is_buyer and st_new = 'withdrawn'))) then
    raise exception 'offer % to % refused: the owner accepts or rejects, the buyer withdraws, a resolved offer is final', st_old, st_new;
  end if;
  if (new.data->'amountUsd' is distinct from old.data->'amountUsd' or new.data->'note' is distinct from old.data->'note')
     and not (is_buyer and st_old = 'submitted') then
    raise exception 'only the buyer revises an offer, and only while it is submitted';
  end if;
  return new;
end $$;
create trigger exitos_offer_guard before insert or update on public.exitos_offers
  for each row execute function public.exitos_offer_guard();

alter policy exitos_nda_upd on public.exitos_nda_requests with check (
  buyer_account_id = auth.uid()::text
  or exists (select 1 from public.exitos_listings l where l.id = exitos_nda_requests.listing_id and l.owner_account_id = auth.uid()::text)
);
alter policy exitos_offers_upd on public.exitos_offers with check (
  buyer_account_id = auth.uid()::text
  or exists (select 1 from public.exitos_listings l where l.id = exitos_offers.listing_id and l.owner_account_id = auth.uid()::text)
);
revoke all on public.exitos_nda_requests, public.exitos_offers, public.exitos_documents from anon;
revoke all on function public.exitos_nda_request_guard(), public.exitos_offer_guard() from public, anon, authenticated;
