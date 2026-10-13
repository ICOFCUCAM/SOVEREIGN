-- run by tests/nda/run.sh after the migrations: an owner cannot rewrite a bidder's terms
do $$
declare A text := gen_random_uuid()::text; B text := gen_random_uuid()::text; L text := 'zz-t-l'; O text := 'zz-t-o'; ok boolean; out text := '';
begin
  insert into public.exitos_listings (id, owner_account_id, data) values (L, A, '{"id":"zz-t-l","code":"T","listedAt":"t","publicView":{}}');
  insert into public.exitos_offers values (O, L, B, '{"amountUsd":40000000,"status":"submitted","terms":{"cashPct":0.8,"escrowPct":0.1}}');
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', A, true);
  begin update public.exitos_offers set data = jsonb_set(data, '{terms,escrowPct}', '0.05') where id = O; ok := false; exception when others then ok := true; end;
  out := out || format('owner rewrites terms refused=%s; ', ok);
  begin update public.exitos_offers set data = data || '{"status":"accepted"}' where id = O; ok := true; exception when others then ok := false; end;
  out := out || format('owner accepts=%s; ', ok);
  perform set_config('request.jwt.claim.sub', B, true);
  begin update public.exitos_offers set data = jsonb_set(data, '{terms,cashPct}', '0.9') where id = O; ok := false; exception when others then ok := true; end;
  out := out || format('bidder revises after acceptance refused=%s', ok);
  raise notice '%', out;
  raise exception 'rollback';
exception when others then if sqlerrm <> 'rollback' then raise; end if;
end $$;
