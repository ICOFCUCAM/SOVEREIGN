-- ExitOS · post-deployment self-test for 20261014120000_exitos_nda_lifecycle.sql.
--
-- select public.exitos_selftest_nda_lifecycle();
--
-- Sets up throwaway listings, NDA requests and data-room files for two sellers, then acts as the
-- seller, the authorised buyer, a buyer without an NDA, an unrelated account and anon, through the
-- whole lifecycle and the bypasses around it. ALWAYS ends by raising, so every row it wrote is
-- rolled back. Every write is scoped to the test's own rows. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_nda_lifecycle();

create or replace function public.exitos_selftest_nda_lifecycle() returns void
language plpgsql set search_path = public as $$
declare
  S uuid := gen_random_uuid(); S2 uuid := gen_random_uuid(); B uuid := gen_random_uuid(); B2 uuid := gen_random_uuid(); C uuid := gen_random_uuid();
  L text := 'zz-selftest-l-' || gen_random_uuid()::text; L3 text := 'zz-selftest-l3-' || gen_random_uuid()::text;
  R text := 'zz-selftest-r-' || gen_random_uuid()::text; R3 text := 'zz-selftest-r3-' || gen_random_uuid()::text; R4 text := 'zz-selftest-r4-' || gen_random_uuid()::text;
  D text := 'zz-selftest-d-' || gen_random_uuid()::text;
  CO text := 'co-' || gen_random_uuid()::text; CO2 text := 'co-' || gen_random_uuid()::text;
  F1 uuid := gen_random_uuid(); F2 uuid := gen_random_uuid(); F3 uuid := gen_random_uuid(); F4 uuid := gen_random_uuid(); F5 uuid := gen_random_uuid();
  TXT text := 'MUTUAL NON-DISCLOSURE AGREEMENT (self-test). The parties agree to keep confidential all information disclosed in connection with the proposed transaction, to use it only to evaluate the transaction, and to return or destroy it on request. This text exists only inside a rolled-back self-test.';
  H text; AG uuid; AG2 uuid; sig uuid; st text;
  out text := ''; fails int := 0; n int; ok boolean;
begin
  H := encode(sha256(convert_to(TXT, 'UTF8')), 'hex');
  insert into public.exitos_listings (id, owner_account_id, data) values
    (L, S::text, jsonb_build_object('id', L, 'code', 'Project Selftest', 'listedAt', 't', 'publicView', '{}'::jsonb)),
    (L3, S::text, jsonb_build_object('id', L3, 'code', 'Project Selftest 3', 'listedAt', 't', 'publicView', '{}'::jsonb));
  insert into public.exitos_nda_requests values (R, L, B::text, '{"status":"requested"}'), (R3, L3, B::text, '{"status":"requested"}'), (R4, L, B2::text, '{"status":"requested"}');
  insert into public.exitos_documents (id, listing_id, data) values (D, L, '{"visibility":"post_nda"}');
  insert into public.exit_data_room_documents (id, tenant_id, room_kind, filename, mime, bytes, storage_path, company_id, disclosure, review_state) values
    (F1, S, 'financial', 'selftest-f1.pdf', 'application/pdf', 1, 'selftest/f1', CO, 'post_nda', 'accepted'),
    (F2, S, 'legal', 'selftest-f2.pdf', 'application/pdf', 1, 'selftest/f2', CO, 'seller_only', 'accepted'),
    (F3, S, 'financial', 'selftest-f3.pdf', 'application/pdf', 1, 'selftest/f3', CO2, 'post_nda', 'accepted'),
    (F4, S, 'financial', 'selftest-f4.pdf', 'application/pdf', 1, 'selftest/f4', CO, 'post_nda', 'rejected'),
    (F5, S2, 'financial', 'selftest-f5.pdf', 'application/pdf', 1, 'selftest/f5', CO, 'post_nda', 'accepted');
  execute 'set local role authenticated';

  -- issuing
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin perform public.exitos_nda_issue(L, CO, B::text, R, 'NDA', 'v1', 'seller_supplied', 'mutual', TXT, 12, 24, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 01 a buyer cannot issue the NDA', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  begin perform public.exitos_nda_issue(L, CO, C::text, R, 'NDA', 'v1', 'seller_supplied', 'mutual', TXT, 12, 24, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 02 the seller cannot issue to an account without an NDA request', ok); fails := fails + (not ok)::int;
  AG := public.exitos_nda_issue(L, CO, B::text, R, 'Mutual NDA', 'v1', 'seller_supplied', 'mutual', TXT, 12, 24, null);
  select document_sha256 = H and state = 'issued' into ok from public.exitos_nda_agreements where id = AG;
  out := out || format(E'\n%s 03 the seller issues the NDA; the document hash is fixed at issue', ok); fails := fails + (not ok)::int;
  begin update public.exitos_nda_agreements set state = 'executed' where id = AG; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 04 nobody changes an NDA''s state directly', ok); fails := fails + (not ok)::int;
  begin update public.exitos_nda_requests set data = '{"status":"signed"}' where id = R4; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 the seller cannot mark a request signed', ok); fails := fails + (not ok)::int;

  -- signatures
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin perform * from public.exitos_buyer_room_files(AG); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 06 no access before anyone signs', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_nda_sign(AG, 'buyer', 'Bea Buyer', 'CEO', null, 'in_app_typed', repeat('0', 64), '{"typedName":"Bea Buyer"}', now()); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 07 a signature on an altered document is refused', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_nda_sign(AG, 'seller', 'Bea Buyer', 'CEO', null, 'in_app_typed', H, '{"typedName":"Bea Buyer"}', now()); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 08 the buyer cannot sign for the seller', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_nda_sign(AG, 'buyer', 'Bea Buyer', 'CEO', null, 'in_app_typed', H, '{"typedName":"Someone Else"}', now()); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 09 an in-app signature needs the signatory''s own typed name', ok); fails := fails + (not ok)::int;
  sig := public.exitos_nda_sign(AG, 'buyer', 'Bea Buyer', 'CEO', 'bea@example.test', 'in_app_typed', H, '{"typedName":"Bea Buyer"}', now());
  begin perform public.exitos_nda_verify_signature(sig, 'verified', null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 10 a signer cannot verify their own signature', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C::text, true);
  begin perform public.exitos_nda_verify_signature(sig, 'verified', null); ok := false; exception when others then ok := true; end;
  select count(*) into n from public.exitos_nda_agreements where id = AG; ok := ok and n = 0;
  out := out || format(E'\n%s 11 an unrelated account can neither see the NDA nor verify its signatures', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  st := public.exitos_nda_verify_signature(sig, 'verified', 'typed signature from the buyer''s account');
  out := out || format(E'\n%s 12 the seller verifies the buyer''s signature; the NDA stays issued until every party is verified (%s)', st = 'issued', st); fails := fails + (not (st = 'issued'))::int;
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin perform * from public.exitos_buyer_room_files(AG); ok := false; exception when others then ok := true; end;
  select count(*) into n from public.exitos_documents where id = D; ok := ok and n = 0;
  out := out || format(E'\n%s 13 incomplete signatures give no access (data room or post-NDA documents)', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  begin perform public.exitos_nda_sign(AG, 'seller', 'Sam Seller', 'Founder', null, 'external_esign', H, '{"provider":"ExampleSign"}', now()); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 14 an e-signature without envelope and signed-copy hash is refused', ok); fails := fails + (not ok)::int;
  sig := public.exitos_nda_sign(AG, 'seller', 'Sam Seller', 'Founder', 'sam@example.test', 'external_esign', H,
    jsonb_build_object('provider', 'ExampleSign', 'envelopeId', 'env-123', 'signedCopySha256', repeat('a', 64)), now());
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  st := public.exitos_nda_verify_signature(sig, 'verified', 'envelope checked');
  select state = 'executed' and access_until > now() into ok from public.exitos_nda_agreements where id = AG; ok := ok and st = 'executed';
  out := out || format(E'\n%s 15 the buyer verifies the seller''s signature and the NDA executes', ok); fails := fails + (not ok)::int;
  select data->>'status' = 'signed' into ok from public.exitos_nda_requests where id = R;
  out := out || format(E'\n%s 16 the request is marked signed by execution, not by a flag', coalesce(ok, false)); fails := fails + (not coalesce(ok, false))::int;

  -- access
  select count(*) into n from public.exitos_buyer_room_files(AG);
  select bool_and(id = F1) into ok from public.exitos_buyer_room_files(AG); ok := coalesce(ok, false) and n = 1;
  out := out || format(E'\n%s 17 the buyer lists only the seller''s post-NDA, unrejected files for this company (%s)', ok, n); fails := fails + (not ok)::int;
  begin ok := public.exitos_buyer_file_path(AG, F1) = 'selftest/f1'; exception when others then ok := false; end;
  out := out || format(E'\n%s 18 the buyer can download a disclosed file', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_buyer_file_path(AG, F2); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 19 a seller-only file cannot be downloaded', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_buyer_file_path(AG, F3); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 20 another company''s file cannot be downloaded', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_buyer_file_path(AG, F5); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 21 another seller''s file cannot be downloaded', ok); fails := fails + (not ok)::int;
  select count(*) into n from public.exit_data_room_documents where id in (F1, F2, F3, F4, F5); ok := n = 0;
  out := out || format(E'\n%s 22 no direct read of the seller''s data-room rows (%s)', ok, n); fails := fails + (not ok)::int;
  if to_regclass('storage.objects') is not null then
    execute 'select count(*) from storage.objects where bucket_id = ''exit-data-room''' into n; ok := n = 0;
    out := out || format(E'\n%s 23 no direct read of data-room storage objects (%s)', ok, n); fails := fails + (not ok)::int;
  else out := out || E'\nt 23 (storage not present in this database: skipped)'; end if;
  select count(*) into n from public.exitos_documents where id = D; ok := n = 1;
  out := out || format(E'\n%s 24 the post-NDA listing document opens once the NDA is executed', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', B2, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B2::text, true);
  begin perform * from public.exitos_buyer_room_files(AG); ok := false; exception when others then ok := true; end;
  begin perform public.exitos_buyer_file_path(AG, F1); ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 25 a buyer without an executed NDA cannot list or download', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C::text, true);
  begin perform public.exitos_buyer_file_path(AG, F1); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 26 an unrelated account cannot download', ok); fails := fails + (not ok)::int;

  -- expiry, revocation, termination
  reset role;
  update public.exitos_nda_agreements set access_until = now() - interval '1 second' where id = AG;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin perform public.exitos_buyer_file_path(AG, F1); ok := false; exception when others then ok := true; end;
  select public.exitos_nda_effective_state(state, access_until) into st from public.exitos_nda_agreements where id = AG; ok := ok and st = 'expired';
  out := out || format(E'\n%s 27 an expired NDA gives no access (state %s)', ok, st); fails := fails + (not ok)::int;
  reset role;
  update public.exitos_nda_agreements set access_until = now() + interval '1 month' where id = AG;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  perform public.exitos_nda_revoke_access(AG, 'buyer removed from the process');
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin perform * from public.exitos_buyer_room_files(AG); ok := false; exception when others then ok := true; end;
  begin perform public.exitos_buyer_file_path(AG, F1); ok := ok and false; exception when others then ok := ok and true; end;
  select count(*) into n from public.exitos_documents where id = D; ok := ok and n = 0;
  out := out || format(E'\n%s 28 revoked access is withdrawn from the data room and post-NDA documents', ok); fails := fails + (not ok)::int;
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  AG2 := public.exitos_nda_issue(L3, CO, B::text, R3, 'Mutual NDA', 'v1', 'exitos_template', 'mutual', TXT, 6, 24, array['financial']);
  sig := public.exitos_nda_sign(AG2, 'seller', 'Sam Seller', null, null, 'wet_ink_scan', H, jsonb_build_object('signedCopySha256', repeat('b', 64)), now());
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  perform public.exitos_nda_verify_signature(sig, 'verified', null);
  sig := public.exitos_nda_sign(AG2, 'buyer', 'Bea Buyer', null, null, 'in_app_typed', H, '{"typedName":"bea buyer"}', now());
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  perform public.exitos_nda_verify_signature(sig, 'verified', null);
  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin ok := public.exitos_buyer_file_path(AG2, F1) = 'selftest/f1'; exception when others then ok := false; end;
  perform public.exitos_nda_terminate(AG2, 'process ended');
  begin perform public.exitos_buyer_file_path(AG2, F1); ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 29 a second NDA executes, gives access, and a terminated NDA gives none', ok); fails := fails + (not ok)::int;

  -- audit
  perform set_config('request.jwt.claims', json_build_object('sub', S, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', S::text, true);
  select count(distinct action) into n from public.exitos_nda_events where agreement_id = AG
   and action in ('issued', 'signature_recorded', 'signature_verified', 'executed', 'files_listed', 'file_downloaded', 'access_revoked');
  ok := n = 7;
  out := out || format(E'\n%s 30 the audit trail records issue, signatures, verification, execution, listing, download and revocation (%s of 7)', ok, n); fails := fails + (not ok)::int;
  begin insert into public.exitos_nda_events (agreement_id, action) values (AG, 'forged'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 31 nobody writes audit events directly', ok); fails := fails + (not ok)::int;

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('request.jwt.claim.sub', '', true);
  begin perform * from public.exitos_buyer_room_files(AG); ok := false; exception when others then ok := true; end;
  begin select count(*) into n from public.exitos_nda_agreements; ok := ok and false; exception when others then ok := ok and true; end;
  out := out || format(E'\n%s 32 anon can neither read NDAs nor list files', ok); fails := fails + (not ok)::int;

  raise exception 'SELFTEST % (% failed of 32; all test rows rolled back)%', case when fails = 0 then 'PASS' else 'FAIL' end, fails, out;
end $$;
revoke all on function public.exitos_selftest_nda_lifecycle() from public, anon, authenticated;
