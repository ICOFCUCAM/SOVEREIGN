-- owner A writes and reads their story; stranger C reads nothing and cannot overwrite; nobody self-verifies
\set ON_ERROR_STOP 0
create or replace function as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true),
         set_config('request.jwt.claim.sub', uid, true); $$;
begin; set local role authenticated; select as_user('aaaa0000-0000-4000-8000-00000000000a');
insert into exitos_company_stories (company_id, data) values ('co-11111111-1111-4111-8111-111111111111', '{"version":"1","sources":[],"history":{"origin":"two analysts","milestones":[],"ownershipChanges":[]}}');
select 'A reads own', count(*) from exitos_company_stories;
update exitos_company_stories set data = data || '{"growth":{"opportunities":[]}}' where company_id = 'co-11111111-1111-4111-8111-111111111111';
select 'A revision after update', revision from exitos_company_stories;
commit;
begin; set local role authenticated; select as_user('aaaa0000-0000-4000-8000-00000000000a');
update exitos_company_stories set data = data || '{"headline":{"arrUsd":{"provenance":"verified"}}}';
rollback;
begin; set local role authenticated; select as_user('cccc0000-0000-4000-8000-00000000000c');
select 'C reads A', count(*) from exitos_company_stories;
update exitos_company_stories set data = '{"version":"1","sources":[]}';
select 'C updated rows (0 expected)', count(*) from exitos_company_stories;
insert into exitos_company_stories (owner_account_id, company_id, data) values ('aaaa0000-0000-4000-8000-00000000000a', 'co-22222222-2222-4222-8222-222222222222', '{"version":"1","sources":[]}');
rollback;
begin; set local role anon;
select 'anon reads', count(*) from exitos_company_stories;
rollback;
reset role;
select 'A story intact', data->'history'->>'origin', revision from exitos_company_stories;
