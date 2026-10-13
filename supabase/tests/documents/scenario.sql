-- O owner, A approver (granted), K counsel (granted), X stranger, Z approver-less user
\set QUIET on
create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, false); perform set_config('request.jwt.claim.sub', u, false); end $$;
create or replace function pg_temp.try(sql text) returns text language plpgsql as $$ begin execute sql; return 'ok'; exception when others then return 'refused: ' || sqlerrm; end $$;
insert into exitos_role_grants (account_id, role, granted_by) values
  ('00000000-0000-0000-0000-0000000000aa', 'approver', 'sql'), ('00000000-0000-0000-0000-0000000000cc', 'counsel', 'sql');
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ee');
select 'O insert v1', pg_temp.try($$insert into exitos_document_versions (id, company_id, type_id, version, classification, content_hash, source_hash, data) values ('v1','co','exitos.cim',1,'confidential_nda', repeat('a',64), repeat('b',64), '{}')$$);
select 'O insert as approved', pg_temp.try($$insert into exitos_document_versions (id, company_id, type_id, version, status, classification, content_hash, source_hash, data) values ('vx','co','exitos.cim',9,'approved','x', repeat('a',64), repeat('b',64), '{}')$$);
select 'O insert v2', pg_temp.try($$insert into exitos_document_versions (id, company_id, type_id, version, classification, content_hash, source_hash, data) values ('v2','co','exitos.cim',2,'confidential_nda', repeat('c',64), repeat('b',64), '{}')$$);
select 'statuses', string_agg(id||'='||status, ' ' order by id) from exitos_document_versions;
select 'O update directly', pg_temp.try($$update exitos_document_versions set status='approved' where id='v2'$$);
select 'O delete', pg_temp.try($$delete from exitos_document_versions where id='v2'$$);
select 'O forge approve event', pg_temp.try($$insert into exitos_document_events (version_id, action) values ('v2','approve')$$);
select 'O log download', pg_temp.try($$insert into exitos_document_events (version_id, action) values ('v2','downloaded')$$);
select 'O approve own (not submitted)', pg_temp.try($$select exitos_document_action('v2','approve')$$);
select 'O submit', pg_temp.try($$select exitos_document_action('v2','submit')$$);
select 'O approve own', pg_temp.try($$select exitos_document_action('v2','approve')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ff');
select 'X reads', count(*) from exitos_document_versions;
select 'X approves', pg_temp.try($$select exitos_document_action('v2','approve')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000cc');
select 'K counsel-reviews (not with counsel)', pg_temp.try($$select exitos_document_action('v2','counsel_reviewed')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000aa');
select 'A reads (in review)', count(*) from exitos_document_versions;
select 'A approves', pg_temp.try($$select exitos_document_action('v2','approve')$$);
-- a version that needs counsel
reset role;
insert into exitos_document_versions (id, owner_account_id, company_id, type_id, version, requires_counsel, classification, content_hash, source_hash, data)
values ('n1','00000000-0000-0000-0000-0000000000ee','co','exitos.nda',1,true,'restricted_parties', repeat('d',64), repeat('b',64), '{}');
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ee');
select 'O submit nda', pg_temp.try($$select exitos_document_action('n1','submit')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000aa');
select 'A approves nda before counsel', pg_temp.try($$select exitos_document_action('n1','approve')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ee');
select 'O sends to counsel', pg_temp.try($$select exitos_document_action('n1','send_to_counsel')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ff');
select 'X counsel-reviews', pg_temp.try($$select exitos_document_action('n1','counsel_reviewed')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000cc');
select 'K reads (with counsel)', count(*) from exitos_document_versions;
select 'K counsel-reviews', pg_temp.try($$select exitos_document_action('n1','counsel_reviewed')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000aa');
select 'A approves nda', pg_temp.try($$select exitos_document_action('n1','approve')$$);
reset role;
insert into exitos_role_grants (account_id, role, granted_by) values ('00000000-0000-0000-0000-0000000000ee', 'approver', 'sql');
insert into exitos_document_versions (id, owner_account_id, company_id, type_id, version, status, classification, content_hash, source_hash, data)
values ('s1','00000000-0000-0000-0000-0000000000ee','co','exitos.teaser',1,'in_review','pre_nda', repeat('e',64), repeat('b',64), '{}');
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ee');
select 'O (also approver) approves own', pg_temp.try($$select exitos_document_action('s1','approve')$$);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ee');
select 'O event trail', string_agg(version_id||':'||action, ' ' order by id) from exitos_document_events;
select 'final', string_agg(id||'='||status, ' ' order by id) from exitos_document_versions;
reset role;
