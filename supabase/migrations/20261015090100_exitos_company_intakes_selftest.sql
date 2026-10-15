-- ExitOS · post-deployment self-test for 20261015090000_exitos_company_intakes.sql.
--
-- select public.exitos_selftest_company_intakes();
--
-- ALWAYS ends by raising, so nothing it wrote survives: the message begins SELFTEST PASS or
-- SELFTEST FAIL and lists each check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_company_intakes();

create or replace function public.exitos_selftest_company_intakes() returns void
language plpgsql set search_path = public as $$
declare
  A uuid := gen_random_uuid(); B uuid := gen_random_uuid();
  out text := ''; fails int := 0; n int; ok boolean; t text;
begin
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A::text, true);
  begin insert into public.exitos_company_intakes (company_id, inputs, provided) values ('co-zzselftest-one', '{"name":"One"}', array['name']); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 01 a founder saves a company', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_company_intakes (company_id, inputs) values ('co-zzselftest-two', '{"name":"Two"}'); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 02 and a second company', ok); fails := fails + (not ok)::int;
  insert into public.exitos_company_intakes (owner_account_id, company_id, inputs) values (B::text, 'co-zzselftest-three', '{}');
  select owner_account_id into t from public.exitos_company_intakes where company_id = 'co-zzselftest-three'; ok := t = A::text;
  out := out || format(E'\n%s 03 the server makes the caller the owner; a client cannot write into another account', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_company_intakes (company_id, inputs) values ('../etc', '{}'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 04 a company id outside the generated pattern is refused', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_company_intakes (company_id, inputs) values ('co-zzselftest-big', jsonb_build_object('x', repeat('y', 9000))); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 oversized figures are refused', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  select count(*) into n from public.exitos_company_intakes; ok := n = 0;
  out := out || format(E'\n%s 06 another account sees none of them (%s)', ok, n); fails := fails + (not ok)::int;
  update public.exitos_company_intakes set inputs = '{"name":"hijacked"}' where company_id = 'co-zzselftest-one'; get diagnostics n = row_count; ok := n = 0;
  out := out || format(E'\n%s 07 nor change them', ok); fails := fails + (not ok)::int;
  delete from public.exitos_company_intakes where company_id = 'co-zzselftest-two'; get diagnostics n = row_count; ok := n = 0;
  out := out || format(E'\n%s 08 nor delete them', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A::text, true);
  select inputs->>'name' into t from public.exitos_company_intakes where company_id = 'co-zzselftest-one'; ok := t = 'One';
  out := out || format(E'\n%s 09 the owner''s figures are untouched', ok); fails := fails + (not ok)::int;
  delete from public.exitos_company_intakes where company_id = 'co-zzselftest-two'; get diagnostics n = row_count; ok := n = 1;
  out := out || format(E'\n%s 10 the owner removes a company', ok); fails := fails + (not ok)::int;

  execute 'reset role';
  execute 'set local role anon';
  begin perform 1 from public.exitos_company_intakes; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 11 a visitor who is not signed in reads nothing', ok); fails := fails + (not ok)::int;
  execute 'reset role';
  raise exception '%', format('SELFTEST %s (%s failed of 11; all test rows rolled back)', case when fails = 0 then 'PASS' else 'FAIL' end, fails) || out;
end $$;
revoke all on function public.exitos_selftest_company_intakes() from public, anon, authenticated;
