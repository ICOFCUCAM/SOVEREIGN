\set A '00000000-0000-0000-0000-00000000000a'
\set C '00000000-0000-0000-0000-00000000000c'
insert into exit_data_room_documents (id, tenant_id, room_kind, filename, mime, bytes, storage_path) values
  ('11111111-0000-4000-8000-000000000001', :'A', 'financial', 'accounts.pdf', 'application/pdf', 10, 'a/financial/1_accounts.pdf'),
  ('11111111-0000-4000-8000-000000000002', :'C', 'legal', 'charter.pdf', 'application/pdf', 10, 'c/legal/1_charter.pdf');
create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); end $$;
set role authenticated;
select pg_temp.as_user(:'A');
select '01 owner sees own files only', count(*) from exit_data_room_documents;
select exit_data_room_review('11111111-0000-4000-8000-000000000001', 'accepted', null);
select exit_data_room_tag('11111111-0000-4000-8000-000000000001', 'Not An Id', null);
select exit_data_room_tag('11111111-0000-4000-8000-000000000001', 'financial.audited_accounts', 'co-00000000-0000-4000-8000-000000000001');
select '02 tagged, awaiting review', artifact_id, review_state from exit_data_room_documents;
select exit_data_room_review('11111111-0000-4000-8000-000000000001', 'approved', null);
select exit_data_room_review('11111111-0000-4000-8000-000000000001', 'accepted', 'FY2023-FY2025 audited accounts, signed');
select '03 accepted by the owner', review_state, reviewed_by = :'A'::uuid, review_note from exit_data_room_documents;
select exit_data_room_tag('11111111-0000-4000-8000-000000000001', 'financial.management_accounts', 'co-00000000-0000-4000-8000-000000000001');
select '04 re-tagging clears the review', artifact_id, review_state, reviewed_at is null from exit_data_room_documents;
update exit_data_room_documents set review_state = 'accepted';
delete from exit_data_room_documents;
truncate exit_data_room_documents;
select exit_data_room_tag('11111111-0000-4000-8000-000000000002', 'legal.charter', null);
select exit_data_room_review('11111111-0000-4000-8000-000000000002', 'accepted', null);
select pg_temp.as_user(:'C');
select '05 other tenant sees one file, untouched', count(*), max(review_state) from exit_data_room_documents;
reset role;
set role anon;
select count(*) from exit_data_room_documents;
select exit_data_room_tag('11111111-0000-4000-8000-000000000001', 'legal.charter', null);
reset role;
select '06 final state', filename, artifact_id, review_state from exit_data_room_documents order by filename;
