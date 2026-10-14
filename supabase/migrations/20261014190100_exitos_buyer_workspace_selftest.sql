-- ExitOS · post-deployment self-test for 20261014190000_exitos_buyer_workspace.sql.
--
-- select public.exitos_selftest_buyer_workspace();
--
-- ALWAYS ends by raising, so nothing it wrote survives: the message begins SELFTEST PASS or
-- SELFTEST FAIL and lists each check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_buyer_workspace();

create or replace function public.exitos_selftest_buyer_workspace() returns void
language plpgsql set search_path = public as $$
declare
  A uuid := gen_random_uuid(); B uuid := gen_random_uuid();
  out text := ''; fails int := 0; n int; ok boolean; t text;
begin
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A::text, true);
  begin insert into public.exitos_buyer_shortlist (listing_id, note) values ('zz-selftest-l1', 'A''s note'); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 01 a buyer adds a listing to their shortlist with a note', ok); fails := fails + (not ok)::int;
  insert into public.exitos_buyer_shortlist (account_id, listing_id) values (B::text, 'zz-selftest-l2');
  select account_id into t from public.exitos_buyer_shortlist where listing_id = 'zz-selftest-l2'; ok := t = A::text;
  out := out || format(E'\n%s 02 the server makes the caller the owner; a client cannot write into another account', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_buyer_saved_views (name, config) values ('No demo, grid', '{"view":"grid","sort":"match"}'); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 03 a buyer saves a named view', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_buyer_shortlist (listing_id, note) values ('zz-selftest-l3', repeat('x', 601)); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 04 a note longer than 600 characters is refused', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_buyer_saved_views (name, config) values ('big', jsonb_build_object('x', repeat('y', 4000))); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 an oversized view is refused', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  select count(*) into n from public.exitos_buyer_shortlist; ok := n = 0;
  out := out || format(E'\n%s 06 another buyer sees none of it (%s)', ok, n); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_buyer_saved_views; ok := n = 0;
  out := out || format(E'\n%s 07 nor their saved views (%s)', ok, n); fails := fails + (not ok)::int;
  update public.exitos_buyer_shortlist set note = 'hijacked' where listing_id = 'zz-selftest-l1'; get diagnostics n = row_count; ok := n = 0;
  out := out || format(E'\n%s 08 nor change their notes', ok); fails := fails + (not ok)::int;
  delete from public.exitos_buyer_saved_views where name = 'No demo, grid'; get diagnostics n = row_count; ok := n = 0;
  out := out || format(E'\n%s 09 nor delete their views', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A::text, true);
  select note into t from public.exitos_buyer_shortlist where listing_id = 'zz-selftest-l1'; ok := t = 'A''s note';
  out := out || format(E'\n%s 10 the owner''s note is untouched', ok); fails := fails + (not ok)::int;
  delete from public.exitos_buyer_shortlist where listing_id = 'zz-selftest-l1'; get diagnostics n = row_count; ok := n = 1;
  out := out || format(E'\n%s 11 the owner removes a listing from their shortlist', ok); fails := fails + (not ok)::int;

  execute 'reset role';
  execute 'set local role anon';
  begin perform 1 from public.exitos_buyer_shortlist; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 12 a visitor who is not signed in reads nothing', ok); fails := fails + (not ok)::int;
  execute 'reset role';
  raise exception '%', format('SELFTEST %s (%s failed of 12; all test rows rolled back)', case when fails = 0 then 'PASS' else 'FAIL' end, fails) || out;
end $$;
revoke all on function public.exitos_selftest_buyer_workspace() from public, anon, authenticated;
