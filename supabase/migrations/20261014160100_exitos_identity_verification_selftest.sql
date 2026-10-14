-- ExitOS · post-deployment self-test for 20261014160000_exitos_identity_verification.sql.
--
-- select public.exitos_selftest_identity_gate();
--
-- Acts as an unverified founder, a verified founder and a stranger on throwaway rows and ALWAYS
-- ends by raising, so nothing it wrote survives: the message begins SELFTEST PASS or SELFTEST FAIL
-- and lists each check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_identity_gate();

create or replace function public.exitos_selftest_identity_gate() returns void
language plpgsql set search_path = public as $$
declare
  A uuid := gen_random_uuid(); B uuid := gen_random_uuid(); C uuid := gen_random_uuid();
  LA text := 'zz-selftest-idv-a-' || gen_random_uuid()::text; LB text := 'zz-selftest-idv-b-' || gen_random_uuid()::text;
  out text := ''; fails int := 0; n int; ok boolean; v jsonb; t text;
begin
  -- B holds a current BankID verification; C's has expired; A has only a pending one
  insert into public.exitos_identity_verifications (account_id, provider, status, provider_ref, country, verified_at, expires_at)
    values (B, 'no_bankid', 'verified', 'zz-selftest-' || gen_random_uuid()::text, 'NO', now(), now() + interval '2 years'),
           (C, 'stripe_identity', 'verified', 'zz-selftest-' || gen_random_uuid()::text, null, now() - interval '3 years', now() - interval '1 year');
  insert into public.exitos_identity_verifications (account_id, provider, status, provider_ref)
    values (A, 'stripe_identity', 'pending', 'zz-selftest-' || gen_random_uuid()::text);
  execute 'set local role authenticated';

  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A::text, true);
  begin insert into public.exitos_listings (id, owner_account_id, data) values (LA, A::text, jsonb_build_object('id', LA, 'code', 'T', 'listedAt', 't', 'publicView', '{}'::jsonb)); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 01 an unverified founder cannot list (a pending verification does not count)', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_identity_verifications (account_id, provider, status, verified_at, expires_at) values (A, 'no_bankid', 'verified', now(), now() + interval '2 years'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 02 a founder cannot record their own verification', ok); fails := fails + (not ok)::int;
  begin update public.exitos_identity_verifications set status = 'verified', verified_at = now(), expires_at = now() + interval '2 years' where account_id = A; get diagnostics n = row_count; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 03 a founder cannot mark a pending verification verified', ok); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_identity_verifications where account_id = A; ok := n = 1;
  out := out || format(E'\n%s 04 a founder reads their own verification rows (%s)', ok, n); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_identity_verifications where account_id <> A; ok := n = 0;
  out := out || format(E'\n%s 05 a founder cannot read anyone else''s verifications (%s)', ok, n); fails := fails + (not ok)::int;
  begin perform provider_ref from public.exitos_identity_verifications where account_id = A; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 06 the flow reference (Stripe session id / OIDC state) is not readable by clients', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', C, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', C::text, true);
  begin insert into public.exitos_listings (id, owner_account_id, data) values ('zz-selftest-idv-c-' || gen_random_uuid()::text, C::text, '{"code":"T","listedAt":"t","publicView":{}}'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 07 an expired verification does not allow listing', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  begin
    insert into public.exitos_listings (id, owner_account_id, data) values (LB, B::text,
      jsonb_build_object('id', LB, 'code', 'T', 'listedAt', 't', 'publicView', '{}'::jsonb, 'verification', jsonb_build_object('provider', 'se_bankid', 'verifiedAt', '2001-01-01')));
    ok := true;
  exception when others then ok := false; end;
  out := out || format(E'\n%s 08 a verified founder can list', ok); fails := fails + (not ok)::int;
  select data->'verification' into v from public.exitos_listings where id = LB;
  ok := v->>'provider' = 'no_bankid' and (v->>'verifiedAt')::timestamptz > now() - interval '1 minute';
  out := out || format(E'\n%s 09 the server stamps the real method and date over what the client sent (%s)', ok, v); fails := fails + (not ok)::int;
  update public.exitos_listings set data = data || '{"verification":{"provider":"stripe_identity"}}' where id = LB;
  select data->'verification'->>'provider' into t from public.exitos_listings where id = LB; ok := t = 'no_bankid';
  out := out || format(E'\n%s 10 an update cannot change the stamp either', ok); fails := fails + (not ok)::int;
  begin delete from public.exitos_listings where id = LB; get diagnostics n = row_count; ok := n = 1; exception when others then ok := false; end;
  out := out || format(E'\n%s 11 withdrawing a listing is never gated', ok); fails := fails + (not ok)::int;

  execute 'reset role';
  perform set_config('request.jwt.claims', '', true); perform set_config('request.jwt.claim.sub', '', true);
  begin insert into public.exitos_listings (id, owner_account_id, data) values ('zz-selftest-idv-s-' || gen_random_uuid()::text, null, '{"code":"T","listedAt":"t","publicView":{}}'); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 12 server-side writes (no signed-in account) are not gated', ok); fails := fails + (not ok)::int;

  raise exception '%', format('SELFTEST %s (%s failed of 12; all test rows rolled back)', case when fails = 0 then 'PASS' else 'FAIL' end, fails) || out;
end;
$$;
revoke all on function public.exitos_selftest_identity_gate() from public, anon, authenticated;
