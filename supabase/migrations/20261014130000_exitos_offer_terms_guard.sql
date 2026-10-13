-- ExitOS · structured IOI terms are the bidder's own (deliverable 5, part 3).
--
-- Offers now carry the terms a bidder states (cash share, escrow, exclusivity, financing,
-- conditions …) in data.terms. The guard from 20261014100000 protected only amountUsd and note,
-- so a listing owner could have rewritten a bidder's terms while accepting. Now, for signed-in
-- users: the owner changes nothing but the status (submitted → accepted | rejected); the buyer
-- revises anything while the offer is submitted, or withdraws it; a resolved offer is final.
--
-- Rollback: re-apply exitos_offer_guard from 20261014100000_exitos_exchange_state_integrity.sql.

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
  -- everything but the status is the bidder's: amount, note, terms
  if (new.data - 'status' - 'resolvedAt') is distinct from (old.data - 'status' - 'resolvedAt') and not (is_buyer and st_old = 'submitted') then
    raise exception 'only the bidder revises its offer, and only while it is submitted';
  end if;
  return new;
end $$;
revoke all on function public.exitos_offer_guard() from public, anon, authenticated;
