-- ExitOS · post-deployment self-test for 20261014170000_exitos_ad_campaigns.sql.
--
-- select public.exitos_selftest_ad_campaigns();
--
-- Acts as an operator and as an ordinary founder on throwaway campaigns and ALWAYS ends by raising,
-- so nothing it wrote survives: the message begins SELFTEST PASS or SELFTEST FAIL and lists each
-- check. Only the database owner can execute it.
--
-- Rollback: drop function public.exitos_selftest_ad_campaigns();

create or replace function public.exitos_selftest_ad_campaigns() returns void
language plpgsql set search_path = public as $$
declare
  OP uuid := gen_random_uuid(); F uuid := gen_random_uuid();
  live uuid; draft uuid; later uuid; gone uuid; paused uuid; mine uuid;
  pl text := gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.webp';
  pd text := gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.webp';
  out text := ''; fails int := 0; n int; ok boolean; t text;
begin
  insert into public.exitos_role_grants (account_id, role, granted_by, note) values (OP::text, 'operator', 'zz-selftest', 'zz-selftest-ads');
  insert into public.exitos_ad_campaigns (name, headline, status, image_path) values ('zz-selftest live', 'Live', 'published', pl) returning id into live;
  insert into public.exitos_ad_campaigns (name, headline, status, image_path) values ('zz-selftest draft', 'Draft', 'draft', pd) returning id into draft;
  insert into public.exitos_ad_campaigns (name, headline, status, starts_at) values ('zz-selftest later', 'Later', 'published', now() + interval '1 day') returning id into later;
  insert into public.exitos_ad_campaigns (name, headline, status, starts_at, ends_at) values ('zz-selftest gone', 'Gone', 'published', now() - interval '2 days', now() - interval '1 day') returning id into gone;
  insert into public.exitos_ad_campaigns (name, headline, status) values ('zz-selftest paused', 'Paused', 'paused') returning id into paused;
  insert into storage.objects (bucket_id, name) values ('exitos-ads', pl), ('exitos-ads', pd);
  execute 'set local role authenticated';

  -- an ordinary signed-in founder
  perform set_config('request.jwt.claims', json_build_object('sub', F, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', F::text, true);
  select count(*) into n from public.exitos_ad_campaigns where name like 'zz-selftest%'; ok := n = 1;
  out := out || format(E'\n%s 01 a founder sees only the live campaign, not draft, scheduled, expired or paused ones (%s)', ok, n); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, status) values ('zz-selftest founder', 'Mine', 'published'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 02 a founder cannot create a campaign', ok); fails := fails + (not ok)::int;
  update public.exitos_ad_campaigns set headline = 'Hijacked' where id = live;
  execute 'reset role'; select headline into t from public.exitos_ad_campaigns where id = live; execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', F, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', F::text, true);
  ok := t = 'Live';
  out := out || format(E'\n%s 03 a founder cannot edit a live campaign', ok); fails := fails + (not ok)::int;
  begin update public.exitos_ad_settings set rotation_seconds = 4; get diagnostics n = row_count; ok := n = 0; exception when others then ok := true; end;
  out := out || format(E'\n%s 04 a founder cannot change the slideshow settings', ok); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_ad_stats; ok := n = 0;
  out := out || format(E'\n%s 05 a founder cannot read the counts', ok); fails := fails + (not ok)::int;
  perform public.exitos_ad_record(live, 'impression'); perform public.exitos_ad_record(live, 'click');
  perform public.exitos_ad_record(draft, 'impression'); perform public.exitos_ad_record(live, 'hover');
  execute 'reset role';
  select coalesce(sum(impressions), 0) * 10 + coalesce(sum(clicks), 0) into n from public.exitos_ad_stats where campaign_id = live; ok := n = 11;
  out := out || format(E'\n%s 06 a viewer counts one impression and one click on a live campaign (%s)', ok, n); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_ad_stats where campaign_id = draft; ok := n = 0;
  out := out || format(E'\n%s 07 nothing is counted for a campaign that is not live, nor for an unknown kind', ok); fails := fails + (not ok)::int;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', F, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', F::text, true);
  select count(*) into n from storage.objects where bucket_id = 'exitos-ads' and name = pl; ok := n = 1;
  out := out || format(E'\n%s 08 a founder may be given the image of a live campaign', ok); fails := fails + (not ok)::int;
  select count(*) into n from storage.objects where bucket_id = 'exitos-ads' and name = pd; ok := n = 0;
  out := out || format(E'\n%s 09 a founder cannot reach the image of a draft campaign', ok); fails := fails + (not ok)::int;
  begin insert into storage.objects (bucket_id, name) values ('exitos-ads', gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.webp'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 10 a founder cannot upload an advertising image', ok); fails := fails + (not ok)::int;

  -- the operator
  perform set_config('request.jwt.claims', json_build_object('sub', OP, 'role', 'authenticated')::text, true); perform set_config('request.jwt.claim.sub', OP::text, true);
  select count(*) into n from public.exitos_ad_campaigns where name like 'zz-selftest%'; ok := n = 5;
  out := out || format(E'\n%s 11 the operator sees every campaign, in every state (%s)', ok, n); fails := fails + (not ok)::int;
  insert into public.exitos_ad_campaigns (name, headline, created_by, created_at) values ('zz-selftest op', 'Op', 'someone-else', now() - interval '1 year') returning id into mine;
  select created_by into t from public.exitos_ad_campaigns where id = mine; ok := t = OP::text;
  out := out || format(E'\n%s 12 the server stamps the author; a client cannot name another', ok); fails := fails + (not ok)::int;
  begin update public.exitos_ad_campaigns set status = 'published' where id = mine; get diagnostics n = row_count; ok := n = 1; exception when others then ok := false; end;
  out := out || format(E'\n%s 13 the operator publishes, pauses and archives by changing the status', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, cta_label, cta_url) values ('zz-selftest js', 'X', 'Go', 'javascript:alert(1)'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 14 a destination that is not an https address is refused', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, cta_label) values ('zz-selftest half', 'X', 'Go'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 15 a call to action needs a destination', ok); fails := fails + (not ok)::int;
  begin insert into public.exitos_ad_campaigns (name, headline, image_path) values ('zz-selftest path', 'X', '../other-bucket/x.svg'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 16 an image path outside the generated pattern (or an SVG) is refused', ok); fails := fails + (not ok)::int;
  begin delete from public.exitos_ad_campaigns where id = mine; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 17 campaigns are archived, never deleted', ok); fails := fails + (not ok)::int;
  begin update public.exitos_ad_settings set rotation_seconds = 9; get diagnostics n = row_count; ok := n = 1; exception when others then ok := false; end;
  out := out || format(E'\n%s 18 the operator changes the slideshow settings', ok); fails := fails + (not ok)::int;
  begin update public.exitos_ad_settings set rotation_seconds = 1; ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 19 a rotation faster than four seconds is refused', ok); fails := fails + (not ok)::int;
  select count(*) into n from public.exitos_ad_stats where campaign_id = live; ok := n = 1;
  out := out || format(E'\n%s 20 the operator reads the counts', ok); fails := fails + (not ok)::int;
  select count(*) into n from storage.objects where bucket_id = 'exitos-ads' and name = pd; ok := n = 1;
  out := out || format(E'\n%s 21 the operator reaches a draft image to preview it', ok); fails := fails + (not ok)::int;
  begin insert into storage.objects (bucket_id, name) values ('exitos-ads', gen_random_uuid()::text || '/' || gen_random_uuid()::text || '.webp'); ok := true; exception when others then ok := false; end;
  out := out || format(E'\n%s 22 the operator uploads an image', ok); fails := fails + (not ok)::int;
  begin insert into storage.objects (bucket_id, name) values ('exitos-ads', 'loose/name.html'); ok := false; exception when others then ok := true; end;
  out := out || format(E'\n%s 23 even the operator cannot upload outside the generated path pattern', ok); fails := fails + (not ok)::int;

  execute 'reset role';
  raise exception '%', format('SELFTEST %s (%s failed of 23; all test rows rolled back)', case when fails = 0 then 'PASS' else 'FAIL' end, fails) || out;
end $$;
revoke all on function public.exitos_selftest_ad_campaigns() from public, anon, authenticated;
