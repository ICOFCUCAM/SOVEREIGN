-- ExitOS · post-deployment self-test for 20261014200000_exitos_ad_placements.sql.
--
-- select public.exitos_selftest_ad_placements();
--
-- ALWAYS ends by raising, so nothing it wrote survives: the message begins SELFTEST PASS or
-- SELFTEST FAIL and lists each check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_ad_placements();

create or replace function public.exitos_selftest_ad_placements() returns void
language plpgsql set search_path = public as $$
declare
  OP uuid := gen_random_uuid(); F uuid := gen_random_uuid();
  out text := ''; fails int := 0; n int; ok boolean;
begin
  insert into public.exitos_role_grants (account_id, role, granted_by, note) values (OP::text, 'operator', 'zz-selftest', 'zz-selftest-ad-placements');
  execute 'set local role authenticated';

  perform set_config('request.jwt.claims', json_build_object('sub', OP, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', OP::text, true);
  begin insert into public.exitos_ad_campaigns (name, headline, stages) values ('zz-selftest sidebar', 'S', array['sidebar','reports']); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 01 the operator runs a campaign in the sidebar and on the Report hub', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, stages) values ('zz-selftest all', 'A', array['identity','profile','review','sidebar','reports']); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 02 a campaign may run in every placement', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, stages) values ('zz-selftest bad', 'B', array['homepage']); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 03 a placement that does not exist (the homepage) is refused', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline) values ('zz-selftest default', 'D'); ok := true; exception when others then ok := false; end;
  select count(*) into n from public.exitos_ad_campaigns where name = 'zz-selftest default' and stages = array['identity','profile','review'];
  ok := ok and n = 1;
  out := out || format(E'\n%s 04 a new campaign still defaults to the listing desk only', ok); fails := fails + (not ok)::int;
  update public.exitos_ad_settings set off_placements = array['sidebar']; get diagnostics n = row_count; ok := n = 1;
  out := out || format(E'\n%s 05 the operator switches a placement off', ok); fails := fails + (not ok)::int;
  begin update public.exitos_ad_settings set off_placements = array['homepage']; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 06 an unknown placement cannot be switched', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', F, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', F::text, true);
  update public.exitos_ad_settings set off_placements = '{}'; get diagnostics n = row_count; ok := n = 0;
  out := out || format(E'\n%s 07 a founder cannot switch placements', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, stages) values ('zz-selftest founder', 'F', array['sidebar']); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 08 a founder cannot create a sidebar campaign', ok); fails := fails + (not ok)::int;

  execute 'reset role';
  raise exception '%', format('SELFTEST %s (%s failed of 8; all test rows rolled back)', case when fails = 0 then 'PASS' else 'FAIL' end, fails) || out;
end $$;
revoke all on function public.exitos_selftest_ad_placements() from public, anon, authenticated;
