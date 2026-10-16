-- ExitOS · post-deployment self-test for 20261016150000_exitos_document_certificates.sql.
--
-- select public.exitos_selftest_document_certificates();
--
-- ALWAYS ends by raising, so nothing it wrote survives: the message begins SELFTEST PASS or
-- SELFTEST FAIL and lists each check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_document_certificates();

create or replace function public.exitos_selftest_document_certificates() returns void
language plpgsql set search_path = public as $$
declare
  A uuid := gen_random_uuid(); B uuid := gen_random_uuid();
  V text := 'zzselftest-cert-' || substr(md5(random()::text), 1, 8);
  H text := repeat('a', 64);
  out text := ''; fails int := 0; n int; ok boolean;
begin
  -- as the server: a version and its certificate
  insert into public.exitos_document_versions (id, owner_account_id, company_id, type_id, version, status, classification, content_hash, source_hash, data)
    values (V, A::text, 'co-zzselftest-0001', 'exitos.loi', 1, 'draft', 'restricted_parties', H, H, '{}');
  insert into public.exitos_document_certificates (version_id, owner_account_id, content_hash, state, dispatch_document_id)
    values (V, A::text, H, 'requested', 'doc-1');

  begin insert into public.exitos_document_certificates (version_id, owner_account_id, content_hash, state, dispatch_document_id) values (V || 'x', A::text, H, 'certified', 'doc-2'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 01 a certified row must name its record', ok); fails := fails + (not ok)::int;
  begin update public.exitos_document_certificates set record_id = 'NOT-A-RECORD' where version_id = V; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 02 a record number outside Dispatch''s pattern is refused', ok); fails := fails + (not ok)::int;
  begin update public.exitos_document_certificates set verify_url = 'javascript:alert(1)' where version_id = V; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 03 the verify link must be https', ok); fails := fails + (not ok)::int;

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', A, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', A::text, true);
  select count(*) into n from public.exitos_document_certificates where version_id = V; ok := n = 1;
  out := out || format(E'\n%s 04 the owner reads their certificate', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_document_certificates (version_id, owner_account_id, content_hash, state, dispatch_document_id) values (V, A::text, H, 'requested', 'doc-3'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 the owner cannot write a certificate (only the server can)', ok); fails := fails + (not ok)::int;
  begin update public.exitos_document_certificates set state = 'certified', record_id = 'SD-2026-00000001', certified_at = now() where version_id = V; get diagnostics n = row_count; ok := n = 0; exception when others then ok := true; end;
  out := out || format(E'\n%s 06 nor mark one certified', ok); fails := fails + (not ok)::int;
  begin delete from public.exitos_document_certificates where version_id = V; get diagnostics n = row_count; ok := n = 0; exception when others then ok := true; end;
  out := out || format(E'\n%s 07 nor delete one', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', B, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', B::text, true);
  select count(*) into n from public.exitos_document_certificates where version_id = V; ok := n = 0;
  out := out || format(E'\n%s 08 another account sees none of it', ok); fails := fails + (not ok)::int;

  execute 'reset role';
  execute 'set local role anon';
  begin select count(*) into n from public.exitos_document_certificates; ok := n = 0; exception when others then ok := true; end;
  out := out || format(E'\n%s 09 a visitor who is not signed in reads nothing', ok); fails := fails + (not ok)::int;
  execute 'reset role';
  raise exception '%', format('SELFTEST %s (%s failed of 9; all test rows rolled back)', case when fails = 0 then 'PASS' else 'FAIL' end, fails) || out;
end $$;
revoke all on function public.exitos_selftest_document_certificates() from public, anon, authenticated;
