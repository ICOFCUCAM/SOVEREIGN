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
