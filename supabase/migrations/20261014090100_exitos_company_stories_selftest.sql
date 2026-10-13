-- ExitOS · post-deployment self-test for the company story and verification model.
--
-- select public.exitos_selftest_company_stories();
--
-- Run by the database owner after deploying 20261014090000_exitos_company_stories.sql
-- (and after any later change to it). It acts as an owner, a stranger, an operator,
-- an engaged reviewer, an authorised but unengaged reviewer and anon, against two
-- companies, and ALWAYS ends by raising an exception, so every row it wrote is
-- rolled back: the message begins SELFTEST PASS or SELFTEST FAIL and lists each check.
-- Every write is scoped to the test's own rows. Nobody but the owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_company_stories();

create or replace function public.exitos_selftest_company_stories() returns void
language plpgsql set search_path = public as $$
declare
  A text := gen_random_uuid()::text; C text := gen_random_uuid()::text; O text := gen_random_uuid()::text;
  R text := gen_random_uuid()::text; Q text := gen_random_uuid()::text;
  CO1 text := 'co-' || gen_random_uuid()::text; CO2 text := 'co-' || gen_random_uuid()::text;
  out text := ''; fails int := 0; n int; vid uuid; ok boolean;
begin
  insert into public.exitos_role_grants (account_id, role, granted_by, note) values (O, 'operator', 'selftest', 'rolled back');
  execute 'set local role authenticated';

  -- as(uid): auth.uid() reads request.jwt.claims (and request.jwt.claim.sub)
  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A, true);
  insert into public.exitos_company_stories (company_id, data) values (CO1, jsonb_build_object('version', '1',
    'sources', '[{"id":"s1","title":"FY2025 statutory accounts","kind":"statutory_accounts","date":"2026-03-01"}]'::jsonb,
    'figures', '{"arrUsd":21800000}'::jsonb));
  insert into public.exitos_company_stories (company_id, data) values (CO2, '{"version":"1","sources":[],"figures":{"arrUsd":5000000}}');
  select count(*) into n from public.exitos_company_stories; ok := n = 2; out := out || format(E'\n%s 01 owner reads own two stories (%s)', ok, n); fails := fails + (not ok)::int;
  begin update public.exitos_company_stories set data = data || '{"figures":{"arrUsd":{"provenance":"verified"}}}' where company_id = CO1; ok := false;
  exception when others then ok := true; end; out := out || format(E'\n%s 02 owner cannot mark a figure verified', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', O, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', O, true);
  perform public.exitos_authorize_reviewer(R, 'financial', null, 'J. Moreau|Chartered accountant');
  perform public.exitos_authorize_reviewer(Q, 'financial', null, 'K. Lin|Chartered accountant');
  begin perform public.exitos_authorize_reviewer(O, 'financial', null, 'Op|Operator'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 03 operator cannot authorise themselves', ok); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_company_stories; ok := n = 0; out := out || format(E'\n%s 04 operator reads no stories (%s)', ok, n); fails := fails + (not ok)::int;
  begin perform public.exitos_record_verification(A, CO1, 'figure:arrUsd', 'financial', 's', '[{"description":"x"}]', null, null, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 operator cannot verify', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C, true);
  select count(*) into n from public.exitos_company_stories; ok := n = 0; out := out || format(E'\n%s 06 stranger reads no stories (%s)', ok, n); fails := fails + (not ok)::int;
  update public.exitos_company_stories set data = '{"version":"1","sources":[]}' where company_id in (CO1, CO2); get diagnostics n = row_count; ok := n = 0;
  out := out || format(E'\n%s 07 stranger updates no stories (%s)', ok, n); fails := fails + (not ok)::int;
  begin perform public.exitos_authorize_reviewer(C, 'financial', null, 'X|Y'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 08 non-operator cannot authorise reviewers', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', R, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', R, true);
  select count(*) into n from public.exitos_company_stories; ok := n = 0; out := out || format(E'\n%s 09 reviewer reads nothing before engagement (%s)', ok, n); fails := fails + (not ok)::int;
  begin perform public.exitos_record_verification(A, CO1, 'figure:arrUsd', 'financial', 's', '[{"description":"x"}]', null, null, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 10 unengaged reviewer cannot verify', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A, true);
  insert into public.exitos_review_engagements (company_id, reviewer_account_id, competence) values (CO1, R, 'financial');
  begin perform public.exitos_record_verification(A, CO1, 'figure:arrUsd', 'financial', 's', '[{"description":"x"}]', null, null, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 11 owner cannot verify own claims', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_verifications (owner_account_id, company_id, claim, claim_value, reviewer_account_id, reviewer_name, reviewer_role, competence, evidence, scope)
          values (A, CO1, 'figure:arrUsd', '21800000', C, 'x', 'y', 'financial', '[{"description":"z"}]', 's'); ok := false;
  exception when others then ok := true; end;
  out := out || format(E'\n%s 12 nobody writes verification records directly', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', R, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', R, true);
  select count(*) into n from public.exitos_company_stories where company_id = CO1; ok := n = 1;
  select count(*) into n from public.exitos_company_stories where company_id = CO2; ok := ok and n = 0;
  out := out || format(E'\n%s 13 engaged reviewer reads the engaged company only', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_record_verification(A, CO1, 'figure:arrUsd', 'financial', 's', '[]', null, null, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 14 verification without evidence refused', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_record_verification(A, CO1, 'figure:arrUsd', 'legal', 's', '[{"description":"x"}]', null, null, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 15 verification outside competence refused', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_record_verification(A, CO2, 'figure:arrUsd', 'financial', 's', '[{"description":"x"}]', null, null, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 16 verification of a company not engaging the reviewer refused', ok); fails := fails + (not ok)::int;
  vid := public.exitos_record_verification(A, CO1, 'figure:arrUsd', 'financial', 'ARR at 30 Sep 2026',
    '[{"description":"FY2025 statutory accounts","sourceId":"s1"}]', 'Sampled contracts', 'on restatement', now() + interval '6 months');
  select coalesce(bool_and(reviewer_name = 'J. Moreau' and reviewer_role = 'Chartered accountant' and claim_value = '21800000'::jsonb
      and evidence->0->'source'->>'title' = 'FY2025 statutory accounts' and limitations is not null and expires_at is not null and revalidate_when is not null), false)
    into ok from public.exitos_verifications where id = vid;
  out := out || format(E'\n%s 17 verification records claim, value, reviewer, role, evidence, scope, limitations, expiry, revalidation', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', Q, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', Q, true);
  select count(*) into n from public.exitos_company_stories; ok := n = 0;
  select count(*) into n from public.exitos_verifications; ok := ok and n = 0;
  out := out || format(E'\n%s 18 authorised but unengaged reviewer reads no story or verification', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C, true);
  select count(*) into n from public.exitos_verifications; ok := n = 0;
  select count(*) into n from public.exitos_review_engagements; ok := ok and n = 0;
  select count(*) into n from public.exitos_reviewer_authorizations; ok := ok and n = 0;
  out := out || format(E'\n%s 19 stranger reads no verifications, engagements or authorisations', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A, true);
  select stale_at is null into ok from public.exitos_verifications where id = vid; ok := coalesce(ok, false);
  out := out || format(E'\n%s 20 owner sees the verification, current', ok); fails := fails + (not ok)::int;
  update public.exitos_company_stories set data = jsonb_set(data, '{sources,0,date}', '"2026-06-30"') where company_id = CO1;
  select stale_at is not null into ok from public.exitos_verifications where id = vid; ok := coalesce(ok, false);
  out := out || format(E'\n%s 21 verification stale once its evidence document changed', ok); fails := fails + (not ok)::int;
  begin update public.exitos_review_engagements set reviewer_account_id = Q where company_id = CO1; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 22 owner cannot reassign an engagement', ok); fails := fails + (not ok)::int;
  update public.exitos_review_engagements set revoked_at = now() where company_id = CO1;

  perform set_config('request.jwt.claims', json_build_object('sub', R, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', R, true);
  select count(*) into n from public.exitos_company_stories; ok := n = 0; out := out || format(E'\n%s 23 reviewer reads nothing once the engagement ends (%s)', ok, n); fails := fails + (not ok)::int;

  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('request.jwt.claim.sub', '', true);
  begin select count(*) into n from public.exitos_company_stories; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 24 anon cannot read stories', ok); fails := fails + (not ok)::int;
  begin perform public.exitos_record_verification(A, CO1, 'figure:arrUsd', 'financial', 's', '[{"description":"x"}]', null, null, null); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 25 anon cannot record verifications', ok); fails := fails + (not ok)::int;

  raise exception 'SELFTEST % (% failed of 25; all test rows rolled back)%', case when fails = 0 then 'PASS' else 'FAIL' end, fails, out;
end $$;
revoke all on function public.exitos_selftest_company_stories() from public, anon, authenticated;
