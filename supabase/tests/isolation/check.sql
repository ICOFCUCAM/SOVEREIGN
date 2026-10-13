\set QUIET on
create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); end $$;
set role authenticated;
-- C, unrelated
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select 'C offers', count(*) from exitos_offers union all select 'C ndas', count(*) from exitos_nda_requests
 union all select 'C deals', count(*) from exitos_deals union all select 'C docs', count(*) from exitos_documents
 union all select 'C events', count(*) from exitos_deal_events union all select 'C listings', count(*) from exitos_listings;
-- B, the buyer (NDA not signed yet)
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select 'B offers', count(*) from exitos_offers union all select 'B ndas', count(*) from exitos_nda_requests
 union all select 'B docs', count(*) from exitos_documents union all select 'B events', count(*) from exitos_deal_events;
-- A, the owner
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select 'A offers', count(*) from exitos_offers union all select 'A ndas', count(*) from exitos_nda_requests
 union all select 'A deals', count(*) from exitos_deals union all select 'A docs', count(*) from exitos_documents union all select 'A events', count(*) from exitos_deal_events;
reset role;
-- B's NDA signed -> post_nda doc visible to B
update exitos_nda_requests set data = '{"status":"signed"}' where id = 'n1';
set role authenticated; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select 'B docs after signed NDA', count(*) from exitos_documents;
reset role;
select 'listing rows with profile', count(*) from exitos_listings where data ? 'profile' or data->'publicView' ? 'revenueUsd';
select id, data->'publicView' from exitos_listings order by id;
-- a listing written after the migration, profile and all, is stored without them
insert into exitos_listings (id, data, owner_account_id) values ('lst-late', '{"id":"lst-late","code":"Project Orion","listedAt":"t","profile":{"name":"Late Secret Co"},"publicView":{"sector":"AI","region":"Europe","revenueUsd":120000000,"growthPct":-0.1,"ebitdaMarginPct":0.3}}', 'x');
select 'late write', data::text like '%Late Secret%' as leaked, data->'publicView'->'revenueBand'->>'label', data->'publicView'->'growthBand'->>'label' from exitos_listings where id = 'lst-late';
-- roles: a user cannot grant themselves a privileged role, nor claim one on their account
set role authenticated; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  begin insert into exitos_role_grants (account_id, role, granted_by) values ('00000000-0000-0000-0000-00000000000a', 'approver', 'me');
        raise notice 'self-grant: ALLOWED'; exception when others then raise notice 'self-grant: denied'; end;
  begin insert into exitos_accounts (id, role, data) values ('00000000-0000-0000-0000-00000000000a', 'advisor', '{}');
        raise notice 'claim advisor: ALLOWED'; exception when others then raise notice 'claim advisor: denied'; end;
end $$;
insert into exitos_accounts (id, role, data) values ('00000000-0000-0000-0000-00000000000a', 'founder', '{}');
select 'claim founder', count(*) from exitos_accounts;
do $$ begin
  begin update exitos_accounts set role = 'advisor' where id = '00000000-0000-0000-0000-00000000000a';
        raise notice 'promote to advisor: ALLOWED'; exception when others then raise notice 'promote to advisor: denied'; end;
end $$;
select 'has approver (before grant)', exitos_has_role('approver');
reset role;
insert into exitos_role_grants (account_id, role, granted_by) values ('00000000-0000-0000-0000-00000000000a', 'approver', 'sql');
set role authenticated; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select 'has approver (after server grant)', exitos_has_role('approver');
select 'sees own grants', count(*) from exitos_role_grants;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select 'C has approver', exitos_has_role('approver');
select 'C sees grants', count(*) from exitos_role_grants;
reset role;
-- state integrity (20261014100000): a buyer cannot sign their own NDA request or accept their own offer
set role authenticated; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$
  declare n int;
  procedure_note text;
begin
  begin insert into exitos_nda_requests values ('n-forged','lst-a','00000000-0000-0000-0000-00000000000b','{"status":"signed"}');
        raise notice 'buyer inserts signed NDA: ALLOWED'; exception when others then raise notice 'buyer inserts signed NDA: denied'; end;
  insert into exitos_nda_requests values ('n2','lst-a','00000000-0000-0000-0000-00000000000b','{"status":"requested"}');
  raise notice 'buyer requests NDA: ok';
  begin update exitos_nda_requests set data = '{"status":"signed"}' where id = 'n2';
        raise notice 'buyer signs own NDA: ALLOWED'; exception when others then raise notice 'buyer signs own NDA: denied'; end;
  begin update exitos_nda_requests set listing_id = 'lst-demo-helios' where id = 'n2';
        raise notice 'buyer moves NDA to another listing: ALLOWED'; exception when others then raise notice 'buyer moves NDA to another listing: denied'; end;
  begin insert into exitos_offers values ('o-forged','lst-a','00000000-0000-0000-0000-00000000000b','{"amountUsd":1,"status":"accepted"}');
        raise notice 'buyer inserts accepted offer: ALLOWED'; exception when others then raise notice 'buyer inserts accepted offer: denied'; end;
  insert into exitos_offers values ('o2','lst-a','00000000-0000-0000-0000-00000000000b','{"amountUsd":40000000,"status":"submitted"}');
  insert into exitos_offers values ('o3','lst-a','00000000-0000-0000-0000-00000000000b','{"amountUsd":42000000,"status":"submitted"}');
  begin update exitos_offers set data = data || '{"status":"accepted"}' where id = 'o2';
        raise notice 'buyer accepts own offer: ALLOWED'; exception when others then raise notice 'buyer accepts own offer: denied'; end;
  update exitos_offers set data = data || '{"amountUsd":41000000}' where id = 'o2';
  raise notice 'buyer revises a submitted offer: ok';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
update exitos_nda_requests set data = '{"status":"signed"}' where id = 'n2';
select 'C signs B''s NDA (rows)', count(*) from exitos_nda_requests where id = 'n2' and data->>'status' = 'signed';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  update exitos_nda_requests set data = '{"status":"signed"}' where id = 'n2';
  raise notice 'owner signs the NDA request: ok';
  begin update exitos_nda_requests set data = '{"status":"requested"}' where id = 'n2';
        raise notice 'owner reopens a resolved NDA: ALLOWED'; exception when others then raise notice 'owner reopens a resolved NDA: denied'; end;
  begin update exitos_offers set data = data || '{"amountUsd":1}' where id = 'o3';
        raise notice 'owner rewrites an offer amount: ALLOWED'; exception when others then raise notice 'owner rewrites an offer amount: denied'; end;
  update exitos_offers set data = data || '{"status":"accepted"}' where id = 'o2';
  raise notice 'owner accepts an offer: ok';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin
  begin update exitos_offers set data = data || '{"amountUsd":1}' where id = 'o2';
        raise notice 'buyer revises an accepted offer: ALLOWED'; exception when others then raise notice 'buyer revises an accepted offer: denied'; end;
  update exitos_offers set data = data || '{"status":"withdrawn"}' where id = 'o3';
  raise notice 'buyer withdraws a submitted offer: ok';
end $$;
reset role;
set role anon;
do $$ begin
  begin perform count(*) from exitos_nda_requests; raise notice 'anon reads NDA requests: ALLOWED'; exception when others then raise notice 'anon reads NDA requests: denied'; end;
end $$;
reset role;
