-- ExitOS · post-deployment self-test for 20261014100000_exitos_exchange_state_integrity.sql.
--
-- select public.exitos_selftest_exchange_state();
--
-- Since 20261014120000 a request becomes signed only through NDA execution (exitos_selftest_nda_lifecycle
-- covers that); here the owner may only reject.
-- Acts as a listing owner, a buyer and a stranger on a throwaway listing and ALWAYS ends by
-- raising, so every row it wrote is rolled back: the message begins SELFTEST PASS or
-- SELFTEST FAIL and lists each check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_exchange_state();

create or replace function public.exitos_selftest_exchange_state() returns void
language plpgsql set search_path = public as $$
declare
  A text := gen_random_uuid()::text; B text := gen_random_uuid()::text; C text := gen_random_uuid()::text;
  L text := 'zz-selftest-' || gen_random_uuid()::text; NR text := 'zz-selftest-n-' || gen_random_uuid()::text;
  O1 text := 'zz-selftest-o1-' || gen_random_uuid()::text; O2 text := 'zz-selftest-o2-' || gen_random_uuid()::text;
  D text := 'zz-selftest-d-' || gen_random_uuid()::text;
  out text := ''; fails int := 0; n int; ok boolean;
begin
  insert into public.exitos_listings (id, owner_account_id, data) values (L, A, jsonb_build_object('id', L, 'code', 'Project Selftest', 'listedAt', 't', 'publicView', '{}'::jsonb));
  insert into public.exitos_documents (id, listing_id, data) values (D, L, '{"visibility":"post_nda"}');
  execute 'set local role authenticated';

  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B, true);
  begin insert into public.exitos_nda_requests values ('zz-selftest-forged-' || gen_random_uuid()::text, L, B, '{"status":"signed"}'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 01 buyer cannot create a signed NDA request', ok); fails := fails + (not ok)::int;
  insert into public.exitos_nda_requests values (NR, L, B, '{"status":"requested"}');
  begin update public.exitos_nda_requests set data = '{"status":"signed"}' where id = NR; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 02 buyer cannot sign their own NDA request', ok); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_documents where id = D; ok := n = 0;
  out := out || format(E'\n%s 03 buyer cannot read the post-NDA document before the owner signs (%s)', ok, n); fails := fails + (not ok)::int;
  begin update public.exitos_nda_requests set listing_id = 'lst-demo-helios' where id = NR; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 04 buyer cannot move the request to another listing', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_offers values ('zz-selftest-forged-' || gen_random_uuid()::text, L, B, '{"amountUsd":1,"status":"accepted"}'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 buyer cannot create an accepted offer', ok); fails := fails + (not ok)::int;
  insert into public.exitos_offers values (O1, L, B, '{"amountUsd":40000000,"status":"submitted"}');
  insert into public.exitos_offers values (O2, L, B, '{"amountUsd":42000000,"status":"submitted","terms":{"cashPct":0.8,"escrowPct":0.1}}');
  begin update public.exitos_offers set data = data || '{"status":"accepted"}' where id = O1; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 06 buyer cannot accept their own offer', ok); fails := fails + (not ok)::int;
  begin update public.exitos_offers set data = data || '{"amountUsd":41000000}' where id = O1; ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 07 buyer can revise a submitted offer', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C, true);
  update public.exitos_nda_requests set data = '{"status":"signed"}' where id = NR; get diagnostics n = row_count; ok := n = 0;
  out := out || format(E'\n%s 08 stranger cannot sign the request (%s rows)', ok, n); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A, true);
  begin update public.exitos_offers set data = data || '{"amountUsd":1}' where id = O2; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 09 owner cannot rewrite an offer amount', ok); fails := fails + (not ok)::int;
  begin update public.exitos_offers set data = jsonb_set(data, '{terms,escrowPct}', '0.05') where id = O2; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 16 owner cannot rewrite the terms a bidder stated', ok); fails := fails + (not ok)::int;
  begin update public.exitos_offers set data = data || '{"status":"accepted"}' where id = O1; ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 10 owner can accept an offer', ok); fails := fails + (not ok)::int;
  begin update public.exitos_nda_requests set data = '{"status":"rejected"}' where id = NR; ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 11 owner can resolve (reject) the NDA request', ok); fails := fails + (not ok)::int;
  begin update public.exitos_nda_requests set data = '{"status":"requested"}' where id = NR; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 12 a resolved NDA request is final', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B, true);
  select count(*) into n from public.exitos_documents where id = D; ok := n = 0;
  out := out || format(E'\n%s 13 a resolved request alone opens no post-NDA document (%s)', ok, n); fails := fails + (not ok)::int;
  begin update public.exitos_offers set data = data || '{"amountUsd":1}' where id = O1; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 14 buyer cannot revise an accepted offer', ok); fails := fails + (not ok)::int;

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('request.jwt.claim.sub', '', true);
  begin select count(*) into n from public.exitos_nda_requests; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 15 anon cannot read NDA requests', ok); fails := fails + (not ok)::int;

  raise exception 'SELFTEST % (% failed of 16; all test rows rolled back)%', case when fails = 0 then 'PASS' else 'FAIL' end, fails, out;
end $$;
revoke all on function public.exitos_selftest_exchange_state() from public, anon, authenticated;
