-- ExitOS · post-deployment self-test for 20261014110000_exit_data_room_tagging.sql.
--
-- select public.exit_selftest_data_room();
--
-- Creates two throwaway files for two random tenants, then acts as each tenant and as anon.
-- ALWAYS ends by raising, so every row it wrote is rolled back. Every write is scoped to the
-- test's own rows. Only the database owner can execute it.
--
-- Rollback: drop function public.exit_selftest_data_room();

create or replace function public.exit_selftest_data_room() returns void
language plpgsql set search_path = public as $$
declare
  A uuid := gen_random_uuid(); C uuid := gen_random_uuid();
  FA uuid := gen_random_uuid(); FC uuid := gen_random_uuid();
  CO text := 'co-' || gen_random_uuid()::text;
  out text := ''; fails int := 0; n int; ok boolean; st text;
begin
  insert into public.exit_data_room_documents (id, tenant_id, room_kind, filename, mime, bytes, storage_path)
    values (FA, A, 'financial', 'selftest-a.pdf', 'application/pdf', 1, 'selftest/a'),
           (FC, C, 'legal', 'selftest-c.pdf', 'application/pdf', 1, 'selftest/c');
  execute 'set local role authenticated';

  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A::text, true);
  select count(*) into n from public.exit_data_room_documents where id in (FA, FC); ok := n = 1;
  out := out || format(E'\n%s 01 owner reads only their own file (%s)', ok, n); fails := fails + (not ok)::int;
  begin perform public.exit_data_room_review(FA, 'accepted', null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 02 an untagged file cannot be accepted', ok); fails := fails + (not ok)::int;
  begin perform public.exit_data_room_tag(FA, 'financial.audited_accounts', CO); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 03 owner tags their file', ok); fails := fails + (not ok)::int;
  begin perform public.exit_data_room_review(FA, 'accepted', 'selftest'); ok := true; exception when others then ok := false; end;
  select review_state into st from public.exit_data_room_documents where id = FA; ok := ok and st = 'accepted';
  out := out || format(E'\n%s 04 owner accepts the tagged file (%s)', ok, st); fails := fails + (not ok)::int;
  perform public.exit_data_room_tag(FA, 'financial.management_accounts', CO);
  select review_state into st from public.exit_data_room_documents where id = FA; ok := st = 'submitted';
  out := out || format(E'\n%s 05 re-tagging returns the file to review (%s)', ok, st); fails := fails + (not ok)::int;
  begin update public.exit_data_room_documents set review_state = 'accepted' where id = FA; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 06 no direct write to the review state', ok); fails := fails + (not ok)::int;
  begin perform public.exit_data_room_tag(FC, 'legal.charter', null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 07 owner cannot tag another tenant''s file', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C::text, true);
  begin perform public.exit_data_room_review(FA, 'rejected', null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 08 another tenant cannot review the file', ok); fails := fails + (not ok)::int;
  select count(*) into n from public.exit_data_room_documents where id = FA; ok := n = 0;
  out := out || format(E'\n%s 09 another tenant cannot read the file (%s)', ok, n); fails := fails + (not ok)::int;

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('request.jwt.claim.sub', '', true);
  begin select count(*) into n from public.exit_data_room_documents where id = FA; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 10 anon cannot read data-room files', ok); fails := fails + (not ok)::int;
  begin perform public.exit_data_room_tag(FA, 'financial.cap_table', null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 11 anon cannot tag', ok); fails := fails + (not ok)::int;

  raise exception 'SELFTEST % (% failed of 11; all test rows rolled back)%', case when fails = 0 then 'PASS' else 'FAIL' end, fails, out;
end $$;
revoke all on function public.exit_selftest_data_room() from public, anon, authenticated;
