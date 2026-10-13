-- ExitOS · end-to-end self-test: executed NDA → transaction → signing → closing → post-closing,
-- and termination ending transaction-scoped data-room access (20261014140000).
--
-- select public.exitos_selftest_transaction_lifecycle();
--
-- Sets up throwaway listings, NDAs, offers and data-room files, acts as the seller, the buyer, an
-- unrelated account and anon, and ALWAYS ends by raising so every row it wrote is rolled back.
-- Every write is scoped to the test's own rows. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_transaction_lifecycle();

create or replace function public.exitos_selftest_transaction_lifecycle() returns void
language plpgsql set search_path = public as $$
declare
  S uuid := gen_random_uuid(); B uuid := gen_random_uuid(); C uuid := gen_random_uuid();
  L text := 'zz-selftest-tl-' || gen_random_uuid()::text; L2 text := 'zz-selftest-tl2-' || gen_random_uuid()::text;
  CO text := 'co-' || gen_random_uuid()::text;
  OF1 text := 'zz-selftest-of1-' || gen_random_uuid()::text; OF2 text := 'zz-selftest-of2-' || gen_random_uuid()::text; OF3 text := 'zz-selftest-of3-' || gen_random_uuid()::text;
  N1 uuid := gen_random_uuid(); N2 uuid := gen_random_uuid(); NX uuid := gen_random_uuid();
  F1 uuid := gen_random_uuid();
  H1 text := repeat('1', 64); H2 text := repeat('2', 64);
  TXT text := repeat('Self-test agreement text. ', 10);
  T1 uuid; T2 uuid; it record; st text; out text := ''; fails int := 0; n int; ok boolean;
begin
  insert into public.exitos_listings (id, owner_account_id, data) values
    (L, S::text, jsonb_build_object('id', L, 'code', 'Project Selftest', 'listedAt', 't', 'publicView', '{}'::jsonb)),
    (L2, S::text, jsonb_build_object('id', L2, 'code', 'Project Selftest 2', 'listedAt', 't', 'publicView', '{}'::jsonb));
  insert into public.exitos_offers values
    (OF1, L, B::text, jsonb_build_object('amountUsd', 50000000, 'status', 'accepted', 'terms', jsonb_build_object('escrowPct', 0.08, 'escrowMonths', 12, 'earnoutPct', 0.1, 'earnoutMonths', 24))),
    (OF2, L, B::text, '{"amountUsd":45000000,"status":"submitted"}'),
    (OF3, L2, B::text, '{"amountUsd":30000000,"status":"accepted"}');
  insert into public.exitos_nda_agreements (id, listing_id, company_id, owner_account_id, buyer_account_id, nda_request_id, title, document_version, document_origin,
      document_text, document_sha256, shape, required_signers, access_term_months, survival_months, state, executed_at, access_until) values
    (N1, L, CO, S::text, B::text, 'zz-r1', 'NDA', 'v1', 'seller_supplied', TXT, H1, 'mutual', array['seller','buyer'], 12, 24, 'executed', now(), now() + interval '12 months'),
    (N2, L2, CO, S::text, B::text, 'zz-r2', 'NDA', 'v1', 'seller_supplied', TXT, H1, 'mutual', array['seller','buyer'], 12, 24, 'executed', now(), now() + interval '12 months');
  insert into public.exit_data_room_documents (id, tenant_id, room_kind, filename, mime, bytes, storage_path, company_id, disclosure, review_state)
    values (F1, S, 'financial', 'selftest-tl.pdf', 'application/pdf', 1, 'selftest/tl', CO, 'post_nda', 'accepted');
  execute 'set local role authenticated';

  -- creation
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin perform public.exitos_txn_create(OF1, N1); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 01 the buyer cannot open the transaction', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  begin perform public.exitos_txn_create(OF2, N1); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 02 no transaction from an offer that was not accepted', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_txn_create(OF1, N2); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 03 no transaction with an NDA from another listing', ok); fails := fails + (not ok)::int;
  T1 := public.exitos_txn_create(OF1, N1);
  select count(*) into n from public.exitos_transaction_items where transaction_id = T1;
  select ok_ into ok from (select (select transaction_id from public.exitos_nda_agreements where id = N1) = T1::text as ok_) x;
  ok := ok and n = 9;
  out := out || format(E'\n%s 04 the seller opens the transaction: standard conditions created, NDA bound to it (%s items)', ok, n); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C::text, true);
  select count(*) into n from public.exitos_transactions where id = T1; ok := n = 0;
  select count(*) into n from public.exitos_transaction_items where transaction_id = T1; ok := ok and n = 0;
  begin perform public.exitos_txn_terminate(T1, 'x'); ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 05 an unrelated account can neither see nor end the transaction', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin ok := public.exitos_buyer_file_path(N1, F1) = 'selftest/tl'; exception when others then ok := false; end;
  out := out || format(E'\n%s 06 the buyer keeps data-room access while the transaction is live', ok); fails := fails + (not ok)::int;

  -- items
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  select * into it from public.exitos_transaction_items where transaction_id = T1 and owner_party = 'buyer' and gate = 'signing' limit 1;
  begin perform public.exitos_txn_evidence_item(it.id, '{"description":"seller says the buyer approved"}'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 07 a party cannot evidence the other party''s condition', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  perform public.exitos_txn_evidence_item(it.id, '{"description":"Investment committee minutes of 3 November"}');
  begin perform public.exitos_txn_confirm_item(it.id, 'confirm', null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 08 the party that recorded evidence cannot confirm it', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  perform public.exitos_txn_confirm_item(it.id, 'confirm', 'minutes seen');
  select status = 'satisfied' into ok from public.exitos_transaction_items where id = it.id;
  out := out || format(E'\n%s 09 the counterparty confirms and the condition is satisfied', ok); fails := fails + (not ok)::int;

  -- signing
  perform public.exitos_txn_confirm_milestone(T1, 'signing', jsonb_build_object('signatoryName', 'Sam Seller', 'documentSha256', H1));
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  st := public.exitos_txn_confirm_milestone(T1, 'signing', jsonb_build_object('signatoryName', 'Bea Buyer', 'documentSha256', H1));
  out := out || format(E'\n%s 10 both parties confirming signing is not enough while conditions are open (%s)', st = 'negotiating', st); fails := fails + (not (st = 'negotiating'))::int;
  -- satisfy the rest of the signing conditions: the buyer evidences "both" items, the seller confirms; the seller's items are waived by both
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'signing' and status = 'open' and owner_party = 'both' loop
    perform public.exitos_txn_evidence_item(it.id, '{"description":"agreed form circulated"}');
  end loop;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'signing' and status = 'evidenced' loop
    perform public.exitos_txn_confirm_item(it.id, 'confirm', null);
  end loop;
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'signing' and status = 'open' loop
    perform public.exitos_txn_waive_item(it.id, 'not needed for this deal');
  end loop;
  select count(*) into n from public.exitos_transaction_items where transaction_id = T1 and gate = 'signing' and status = 'waived'; ok := n = 0;
  out := out || format(E'\n%s 11 a waiver asked by one party is not granted until the other agrees', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  perform public.exitos_txn_confirm_milestone(T1, 'signing', jsonb_build_object('signatoryName', 'Bea Buyer', 'documentSha256', H2));
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'signing' and status = 'open' loop
    perform public.exitos_txn_waive_item(it.id, 'agreed');
  end loop;
  select state into st from public.exitos_transactions where id = T1;
  out := out || format(E'\n%s 12 conditions met but the parties named different agreements: not signed (%s)', st = 'negotiating', st); fails := fails + (not (st = 'negotiating'))::int;
  st := public.exitos_txn_confirm_milestone(T1, 'signing', jsonb_build_object('signatoryName', 'Bea Buyer', 'documentSha256', H1));
  out := out || format(E'\n%s 13 the same agreement and every condition met: signed (%s)', st = 'signed', st); fails := fails + (not (st = 'signed'))::int;
  begin perform public.exitos_txn_add_item(T1, 'signing', 'late condition', 'seller', null, true); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 14 no signing condition can be added after signing', ok); fails := fails + (not ok)::int;

  -- closing
  perform public.exitos_txn_confirm_milestone(T1, 'closing', jsonb_build_object('amountUsd', '50000000', 'reference', 'WIRE-1'));
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  st := public.exitos_txn_confirm_milestone(T1, 'closing', jsonb_build_object('amountUsd', '50000000', 'reference', 'WIRE-1'));
  out := out || format(E'\n%s 15 completion is not confirmed while closing conditions are open (%s)', st = 'signed', st); fails := fails + (not (st = 'signed'))::int;
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'closing' and owner_party in ('seller', 'both') loop
    perform public.exitos_txn_evidence_item(it.id, '{"description":"done"}');
  end loop;
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'closing' and status = 'evidenced' loop
    perform public.exitos_txn_confirm_item(it.id, 'confirm', null);
  end loop;
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'closing' and status = 'open' loop
    perform public.exitos_txn_evidence_item(it.id, '{"description":"escrow agent engaged"}');
  end loop;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  perform public.exitos_txn_confirm_milestone(T1, 'closing', jsonb_build_object('amountUsd', '49000000', 'reference', 'WIRE-1'));
  for it in select * from public.exitos_transaction_items where transaction_id = T1 and gate = 'closing' and status = 'evidenced' loop
    perform public.exitos_txn_confirm_item(it.id, 'confirm', null);
  end loop;
  select state into st from public.exitos_transactions where id = T1;
  out := out || format(E'\n%s 16 conditions met but the parties confirmed different amounts: not closed (%s)', st = 'signed', st); fails := fails + (not (st = 'signed'))::int;
  st := public.exitos_txn_confirm_milestone(T1, 'closing', jsonb_build_object('amountUsd', '50000000', 'reference', 'WIRE-1'));
  out := out || format(E'\n%s 17 the same amount and every condition met: closed (%s)', st = 'closed', st); fails := fails + (not (st = 'closed'))::int;

  -- post-closing
  select count(*) into n from public.exitos_transaction_items where transaction_id = T1 and gate = 'post_closing' and source = 'from_terms' and due_date is not null; ok := n = 3;
  out := out || format(E'\n%s 18 closing creates the post-closing obligations from the terms, with due dates (%s: escrow, earn-out, confidentiality)', ok, n); fails := fails + (not ok)::int;
  begin perform public.exitos_txn_terminate(T1, 'too late'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 19 a closed transaction cannot be terminated', ok); fails := fails + (not ok)::int;
  select * into it from public.exitos_transaction_items where transaction_id = T1 and gate = 'post_closing' and owner_party = 'both' limit 1;
  perform public.exitos_txn_evidence_item(it.id, '{"description":"Escrow released by the agent"}');
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  perform public.exitos_txn_confirm_item(it.id, 'confirm', null);
  select status = 'satisfied' into ok from public.exitos_transaction_items where id = it.id;
  out := out || format(E'\n%s 20 a post-closing obligation is closed by evidence and the counterparty''s confirmation', ok); fails := fails + (not ok)::int;
  perform public.exitos_txn_add_item(T1, 'post_closing', 'Non-compete for 24 months', 'seller', (now() + interval '24 months')::date, true);
  select count(*) into n from public.exitos_transaction_items where transaction_id = T1 and gate = 'post_closing'; ok := n = 4;
  out := out || format(E'\n%s 21 either party adds an obligation after closing (%s)', ok, n); fails := fails + (not ok)::int;

  -- integrity
  begin update public.exitos_transactions set state = 'negotiating' where id = T1; ok := false; exception when others then ok := true; end;
  begin insert into public.exitos_transaction_events (transaction_id, action) values (T1, 'forged'); ok := ok and false; exception when others then ok := ok and true; end;
  begin update public.exitos_transaction_items set status = 'satisfied' where transaction_id = T1; ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 22 nobody writes a transaction, its items or its audit trail directly', ok); fails := fails + (not ok)::int;
  select count(distinct action) into n from public.exitos_transaction_events where transaction_id = T1 and action in ('created', 'item_evidenced', 'item_confirmed', 'signing_confirmed', 'signing_mismatch', 'signed', 'closing_mismatch', 'closed');
  ok := n = 8;
  out := out || format(E'\n%s 23 the audit trail records creation, evidence, confirmations, both mismatches, signing and closing (%s of 8)', ok, n); fails := fails + (not ok)::int;

  -- termination ends transaction-scoped access
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  T2 := public.exitos_txn_create(OF3, N2);
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin ok := public.exitos_buyer_file_path(N2, F1) = 'selftest/tl'; exception when others then ok := false; end;
  perform public.exitos_txn_terminate(T2, 'buyer withdrew');
  begin perform public.exitos_buyer_file_path(N2, F1); ok := ok and false; exception when others then ok := ok and true; end;
  begin perform * from public.exitos_buyer_room_files(N2); ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 24 a terminated transaction ends the buyer''s data-room access, though the NDA is still in term', ok); fails := fails + (not ok)::int;

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('request.jwt.claim.sub', '', true);
  begin select count(*) into n from public.exitos_transactions; ok := false; exception when others then ok := true; end;
  begin perform public.exitos_txn_create(OF1, N1); ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 25 anon can neither read nor open transactions', ok); fails := fails + (not ok)::int;

  raise exception 'SELFTEST % (% failed of 25; all test rows rolled back)%', case when fails = 0 then 'PASS' else 'FAIL' end, fails, out;
end $$;
revoke all on function public.exitos_selftest_transaction_lifecycle() from public, anon, authenticated;
