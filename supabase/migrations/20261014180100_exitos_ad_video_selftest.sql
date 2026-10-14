-- ExitOS · post-deployment self-test for 20261014180000_exitos_ad_video.sql.
--
-- select public.exitos_selftest_ad_video();
--
-- ALWAYS ends by raising, so nothing it wrote survives: the message begins SELFTEST PASS or
-- SELFTEST FAIL and lists each check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_ad_video();

create or replace function public.exitos_selftest_ad_video() returns void
language plpgsql set search_path = public as $$
declare
  OP uuid := gen_random_uuid(); F uuid := gen_random_uuid();
  vl text := gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.mp4';
  vd text := gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.webm';
  out text := ''; fails int := 0; n int; ok boolean;
begin
  insert into public.exitos_role_grants (account_id, role, granted_by, note) values (OP::text, 'operator', 'zz-selftest', 'zz-selftest-ad-video');
  insert into public.exitos_ad_campaigns (name, headline, status, video_path) values ('zz-selftest live video', 'Live', 'published', vl);
  insert into public.exitos_ad_campaigns (name, headline, status, video_path) values ('zz-selftest draft video', 'Draft', 'draft', vd);
  insert into storage.objects (bucket_id, name) values ('exitos-ads', vl), ('exitos-ads', vd);
  execute 'set local role authenticated';

  perform set_config('request.jwt.claims', json_build_object('sub', F, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', F::text, true);
  select count(*) into n from storage.objects where bucket_id = 'exitos-ads' and name = vl; ok := n = 1;
  out := out || format(E'\n%s 01 a founder may be given the video of a live campaign', ok); fails := fails + (not ok)::int;
  select count(*) into n from storage.objects where bucket_id = 'exitos-ads' and name = vd; ok := n = 0;
  out := out || format(E'\n%s 02 a founder cannot reach the video of a draft campaign', ok); fails := fails + (not ok)::int;
  begin insert into storage.objects (bucket_id, name) values ('exitos-ads', gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.mp4'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 03 a founder cannot upload a video', ok); fails := fails + (not ok)::int;

  perform set_config('request.jwt.claims', json_build_object('sub', OP, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', OP::text, true);
  begin insert into storage.objects (bucket_id, name) values ('exitos-ads', gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.webm'); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 04 the operator uploads a video', ok); fails := fails + (not ok)::int;
  begin insert into storage.objects (bucket_id, name) values ('exitos-ads', gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.mov'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 05 a video in another format is refused', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, video_path) values ('zz-selftest bad video', 'X', '../x.mp4'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 06 a video path outside the generated pattern is refused', ok); fails := fails + (not ok)::int;

  execute 'reset role';
  raise exception '%', format('SELFTEST %s (%s failed of 6; all test rows rolled back)', case when fails = 0 then 'PASS' else 'FAIL' end, fails) || out;
end $$;
revoke all on function public.exitos_selftest_ad_video() from public, anon, authenticated;
