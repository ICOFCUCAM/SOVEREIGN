-- ExitOS · end-to-end self-test of one deal, through the functions and policies a real deal uses
-- (deliverable 6, D6-4): NDA request → issue → both signatures and verifications → execution →
-- data-room access → offer and acceptance → transaction → conditions → signing → closing →
-- post-closing obligations. Each step is taken by the party that would take it, signed in as that
-- account; nothing is written as the owner except the listing and the seller's data-room files.
--
-- select public.exitos_selftest_deal_end_to_end();
--
-- ALWAYS ends by raising, so every row it wrote is rolled back. Every write is scoped to the test's
-- own rows. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_deal_end_to_end();

create or replace function public.exitos_selftest_deal_end_to_end() returns void
language plpgsql set search_path = public as $$
declare
  S uuid := gen_random_uuid(); B uuid := gen_random_uuid(); C uuid := gen_random_uuid();
  L text := 'zz-selftest-e2e-' || gen_random_uuid()::text; R text := 'zz-selftest-e2e-r-' || gen_random_uuid()::text;
  O text := 'zz-selftest-e2e-o-' || gen_random_uuid()::text; CO text := 'co-' || gen_random_uuid()::text;
  F1 uuid := gen_random_uuid(); F2 uuid := gen_random_uuid();
  TXT text := 'MUTUAL NON-DISCLOSURE AGREEMENT (end-to-end self-test). The parties keep confidential all information disclosed for the proposed transaction and use it only to evaluate it. This text exists only inside a rolled-back self-test.';
  H text; HS text := repeat('c', 64); AG uuid; TX uuid; sig uuid; it record; st text; who uuid; peer uuid;
  out text := ''; fails int := 0; n int; m int; ok boolean;
begin
  H := encode(sha256(convert_to(TXT, 'UTF8')), 'hex');
  -- the seller's listing and its data room: one file disclosed to buyers under an NDA, one kept back
  insert into public.exitos_listings (id, owner_account_id, data) values (L, S::text, jsonb_build_object('id', L, 'code', 'Project Selftest E2E', 'listedAt', 't', 'publicView', '{}'::jsonb));
  insert into public.exit_data_room_documents (id, tenant_id, room_kind, filename, mime, bytes, storage_path, company_id, disclosure, review_state) values
    (F1, S, 'financial', 'selftest-e2e-accounts.pdf', 'application/pdf', 1, 'selftest/e2e-1', CO, 'post_nda', 'accepted'),
    (F2, S, 'legal', 'selftest-e2e-board.pdf', 'application/pdf', 1, 'selftest/e2e-2', CO, 'seller_only', 'accepted');
  execute 'set local role authenticated';

  -- ── 1 · the buyer asks for an NDA; the seller issues it ──
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  insert into public.exitos_nda_requests values (R, L, B::text, '{"status":"requested"}');
  begin perform * from public.exitos_buyer_room_files(gen_random_uuid()); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 01 the buyer requests an NDA from its own account and has no data-room access yet', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  AG := public.exitos_nda_issue(L, CO, B::text, R, 'Mutual NDA', 'v1', 'seller_supplied', 'mutual', TXT, 12, 24, null);

  -- ── 2 · both parties sign from their own accounts; each verifies the other ──
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  sig := public.exitos_nda_sign(AG, 'buyer', 'Bea Buyer', 'CEO', 'bea@example.test', 'in_app_typed', H, '{"typedName":"Bea Buyer"}', now());
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  perform public.exitos_nda_verify_signature(sig, 'verified', 'typed signature from the buyer''s account');
  sig := public.exitos_nda_sign(AG, 'seller', 'Sam Seller', 'Founder', 'sam@example.test', 'external_esign', H,
    jsonb_build_object('provider', 'ExampleSign', 'envelopeId', 'env-e2e', 'signedCopySha256', repeat('a', 64)), now());
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  st := public.exitos_nda_verify_signature(sig, 'verified', 'envelope checked with the provider');
  select st = 'executed' and (select data->>'status' from public.exitos_nda_requests where id = R) = 'signed' into ok;
  out := out || format(E'\n%s 02 the NDA executes once both signatures are verified, and only execution marks the request signed (%s)', ok, st); fails := fails + (not ok)::int;
  select count(*), count(*) filter (where id = F1) into n, m from public.exitos_buyer_room_files(AG);
  begin perform public.exitos_buyer_file_path(AG, F2); ok := false; exception when others then ok := true; end;
  ok := ok and n = 1 and m = 1;
  out := out || format(E'\n%s 03 the buyer sees and can open only the disclosed file (%s listed), not the one kept back', ok, n); fails := fails + (not ok)::int;

  -- ── 3 · the buyer offers with terms; the seller accepts ──
  insert into public.exitos_offers values (O, L, B::text, jsonb_build_object('amountUsd', 60000000, 'status', 'submitted',
    'terms', jsonb_build_object('cashPct', 0.9, 'escrowPct', 0.1, 'escrowMonths', 12, 'earnoutPct', 0.1, 'earnoutMonths', 24)));
  begin update public.exitos_offers set data = data || '{"status":"accepted"}' where id = O; ok := false; exception when others then ok := true; end;
  begin perform public.exitos_txn_create(O, AG); ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 04 the buyer can neither accept its own offer nor open a transaction', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  begin perform public.exitos_txn_create(O, AG); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 no transaction before the seller accepts the offer', ok); fails := fails + (not ok)::int;
  update public.exitos_offers set data = data || '{"status":"accepted"}' where id = O;
  get diagnostics n = row_count;
  out := out || format(E'\n%s 06 the seller accepts the offer (%s row)', n = 1, n); fails := fails + (not (n = 1))::int;

  -- ── 4 · the transaction ──
  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C::text, true);
  begin perform public.exitos_txn_create(O, AG); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 07 an unrelated account cannot open a transaction on the deal', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  TX := public.exitos_txn_create(O, AG);
  select t.price_usd = 60000000 and (t.terms->>'escrowPct')::numeric = 0.1 and a.transaction_id = TX::text into ok
    from public.exitos_transactions t join public.exitos_nda_agreements a on a.id = t.nda_agreement_id where t.id = TX;
  out := out || format(E'\n%s 08 the seller opens it: price and terms fixed from the accepted offer, the NDA bound to it', coalesce(ok, false)); fails := fails + (not coalesce(ok, false))::int;
  begin perform public.exitos_txn_create(O, AG); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 09 a second transaction cannot be opened on the same NDA', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin ok := public.exitos_buyer_file_path(AG, F1) = 'selftest/e2e-1'; exception when others then ok := false; end;
  out := out || format(E'\n%s 10 the buyer keeps its data-room access while the transaction is live', ok); fails := fails + (not ok)::int;

  -- ── 5 · signing conditions: each evidenced by its owner (both → seller), confirmed by the other party ──
  for it in select * from public.exitos_transaction_items where transaction_id = TX and gate = 'signing' order by created_at, id loop
    who := case when it.owner_party = 'buyer' then B else S end; peer := case when who = S then B else S end;
    perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', who::text, true);
    perform public.exitos_txn_evidence_item(it.id, jsonb_build_object('description', 'Done: ' || it.title, 'documentSha256', repeat('d', 64)));
    perform set_config('request.jwt.claims', json_build_object('sub', peer, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', peer::text, true);
    perform public.exitos_txn_confirm_item(it.id, 'confirm', 'checked');
  end loop;
  select count(*) filter (where status = 'satisfied' and confirmed_by <> evidenced_by), count(*) into n, m from public.exitos_transaction_items where transaction_id = TX and gate = 'signing';
  out := out || format(E'\n%s 11 every signing condition satisfied, each confirmed by the party that did not evidence it (%s of %s)', n = m and n > 0, n, m); fails := fails + (not (n = m and n > 0))::int;

  -- ── 6 · signing: both parties name the same signed agreement ──
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  st := public.exitos_txn_confirm_milestone(TX, 'signing', jsonb_build_object('signatoryName', 'Sam Seller', 'documentSha256', HS));
  ok := st = 'negotiating';
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  st := public.exitos_txn_confirm_milestone(TX, 'signing', jsonb_build_object('signatoryName', 'Bea Buyer', 'documentSha256', HS));
  ok := ok and st = 'signed';
  out := out || format(E'\n%s 12 one confirmation is not signing; both on the same agreement hash is (%s)', ok, st); fails := fails + (not ok)::int;

  -- ── 7 · completion conditions: one waived by both parties, the rest evidenced and confirmed ──
  select * into it from public.exitos_transaction_items where transaction_id = TX and gate = 'closing' and title like 'Regulatory clearances%';
  perform public.exitos_txn_waive_item(it.id, 'counsel advise no clearance applies');                    -- the buyer asks
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  st := public.exitos_txn_waive_item(it.id, 'agreed');                                                     -- the seller agrees
  for it in select * from public.exitos_transaction_items where transaction_id = TX and gate = 'closing' and status = 'open' order by created_at, id loop
    who := case when it.owner_party = 'buyer' then B else S end; peer := case when who = S then B else S end;
    perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', who::text, true);
    perform public.exitos_txn_evidence_item(it.id, jsonb_build_object('description', 'Done: ' || it.title));
    perform set_config('request.jwt.claims', json_build_object('sub', peer, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', peer::text, true);
    perform public.exitos_txn_confirm_item(it.id, 'confirm', null);
  end loop;
  select count(*) filter (where status = 'waived'), count(*) filter (where status = 'satisfied') into n, m from public.exitos_transaction_items where transaction_id = TX and gate = 'closing';
  ok := st = 'waived' and n = 1 and m = (select count(*) - 1 from public.exitos_transaction_items where transaction_id = TX and gate = 'closing');
  out := out || format(E'\n%s 13 completion conditions met: %s waived by both parties, %s satisfied', ok, n, m); fails := fails + (not ok)::int;

  -- ── 8 · completion: both parties state the same amount paid ──
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  perform public.exitos_txn_confirm_milestone(TX, 'closing', jsonb_build_object('amountUsd', '48000000', 'reference', 'CHAPS-E2E'));
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  st := public.exitos_txn_confirm_milestone(TX, 'closing', jsonb_build_object('amountUsd', '48000000', 'reference', 'WIRE-E2E'));
  out := out || format(E'\n%s 14 both confirm the same amount paid: completed (%s)', st = 'closed', st); fails := fails + (not (st = 'closed'))::int;

  -- ── 9 · after completion ──
  select count(*) into n from public.exitos_transaction_items where transaction_id = TX and gate = 'post_closing' and source = 'from_terms' and due_date is not null;
  out := out || format(E'\n%s 15 completion creates the escrow, earn-out and confidentiality obligations with due dates (%s)', n = 3, n); fails := fails + (not (n = 3))::int;
  select * into it from public.exitos_transaction_items where transaction_id = TX and gate = 'post_closing' and title like 'Release of the escrow%';
  perform public.exitos_txn_evidence_item(it.id, '{"description":"Escrow agent released the balance; no claims notified"}');
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  perform public.exitos_txn_confirm_item(it.id, 'confirm', 'funds received');
  perform public.exitos_txn_add_item(TX, 'post_closing', 'Transitional services for finance systems', 'seller', (now() + interval '6 months')::date, true);
  select count(*) filter (where status = 'satisfied'), count(*) into n, m from public.exitos_transaction_items where transaction_id = TX and gate = 'post_closing';
  out := out || format(E'\n%s 16 a post-closing obligation is discharged by evidence and confirmation, and a new one added (%s of %s satisfied)', n = 1 and m = 4, n, m); fails := fails + (not (n = 1 and m = 4))::int;
  begin perform public.exitos_txn_terminate(TX, 'too late'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 17 a completed deal cannot be terminated', ok); fails := fails + (not ok)::int;

  -- ── 10 · the record, and who can see it ──
  select count(distinct action) into n from public.exitos_transaction_events where transaction_id = TX and action in ('created', 'item_evidenced', 'item_confirmed', 'waiver_requested', 'item_waived', 'signed', 'closed');
  select count(distinct action) into m from public.exitos_nda_events where agreement_id = AG and action in ('issued', 'signature_recorded', 'signature_verified', 'executed', 'files_listed', 'file_downloaded');
  out := out || format(E'\n%s 18 the audit trails hold every step: transaction %s of 7, NDA %s of 6', n = 7 and m = 6, n, m); fails := fails + (not (n = 7 and m = 6))::int;
  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C::text, true);
  select (select count(*) from public.exitos_transactions where id = TX) + (select count(*) from public.exitos_transaction_items where transaction_id = TX)
       + (select count(*) from public.exitos_nda_agreements where id = AG) + (select count(*) from public.exitos_offers where id = O) into n;
  begin perform public.exitos_buyer_file_path(AG, F1); ok := false; exception when others then ok := true; end;
  ok := ok and n = 0;
  out := out || format(E'\n%s 19 an unrelated account sees none of the deal and opens no file (%s rows)', ok, n); fails := fails + (not ok)::int;
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('request.jwt.claim.sub', '', true);
  begin select count(*) into n from public.exitos_transaction_items; ok := false; exception when others then ok := true; end;
  begin perform * from public.exitos_buyer_room_files(AG); ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 20 a signed-out visitor reads nothing and lists nothing', ok); fails := fails + (not ok)::int;

  raise exception 'SELFTEST % (% failed of 20; all test rows rolled back)%', case when fails = 0 then 'PASS' else 'FAIL' end, fails, out;
end $$;

revoke all on function public.exitos_selftest_deal_end_to_end() from public, anon, authenticated;
