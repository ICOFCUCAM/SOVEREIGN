-- company stories and independent verification, as owner A, stranger C, operator O,
-- engaged reviewer R and authorised-but-not-engaged reviewer Q
\set ON_ERROR_STOP 0
\set A 'aaaa0000-0000-4000-8000-00000000000a'
\set C 'cccc0000-0000-4000-8000-00000000000c'
\set O '00000000-0000-4000-8000-0000000000f0'
\set R 'eeee0000-0000-4000-8000-0000000000e1'
\set Q 'eeee0000-0000-4000-8000-0000000000e2'
\set CO 'co-11111111-1111-4111-8111-111111111111'
create or replace function as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false),
         set_config('request.jwt.claim.sub', uid, false); $$;
insert into exitos_role_grants (account_id, role, granted_by) values (:'O', 'operator', 'sql');
set role authenticated;

select as_user(:'A');
insert into exitos_company_stories (company_id, data) values (:'CO', '{"version":"1","sources":[],"figures":{"arrUsd":21800000},"financials":{"annual":[{"period":"FY2025","revenueUsd":20900000,"meta":{"provenance":"founder"}}],"forecasts":[]}}');
select '01 A reads own story', count(*) from exitos_company_stories;
update exitos_company_stories set data = data || '{"headline":{"arrUsd":{"provenance":"verified"}}}';
select '02 A revision unchanged after refused self-verification', revision from exitos_company_stories;
select exitos_authorize_reviewer(:'R', 'financial', null, 'J. Moreau|Chartered accountant');

select as_user(:'O');
select '03 operator authorises R';
select exitos_authorize_reviewer(:'R', 'financial', null, 'J. Moreau|Chartered accountant');
select exitos_authorize_reviewer(:'Q', 'financial', null, 'K. Lin|Chartered accountant');
select exitos_authorize_reviewer(:'O', 'financial', null, 'Op|Operator');
select '04 operator reads the owner story', count(*) from exitos_company_stories;
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', 'ARR at 30 Sep 2026', '[{"description":"x"}]', null, null, null);

select as_user(:'R');
select '05 R before engagement reads story', count(*) from exitos_company_stories;
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', 'ARR at 30 Sep 2026', '[{"description":"contract register"}]', null, null, null);

select as_user(:'A');
select '05b A finds the reviewer by e-mail', reviewer_name, competence from exitos_reviewer_by_email('Reviewer@Example.test');
select '05c a non-reviewer is not found', count(*) from exitos_reviewer_by_email('stranger@example.test');
insert into exitos_review_engagements (company_id, reviewer_account_id, competence) values (:'CO', :'R', 'financial');
select '06 A engaged R', count(*) from exitos_review_engagements;
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', 'own claim', '[{"description":"me"}]', null, null, null);
insert into exitos_verifications (owner_account_id, company_id, claim, claim_value, reviewer_account_id, reviewer_name, reviewer_role, competence, evidence, scope)
  values (:'A', :'CO', 'figure:arrUsd', '21800000', :'C', 'x', 'y', 'financial', '[{"description":"z"}]', 's');

select as_user(:'R');
select '07 R after engagement reads story', count(*) from exitos_company_stories;
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', 'ARR at 30 Sep 2026', '[]', null, null, null);
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', '', '[{"description":"contract register"}]', null, null, null);
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'legal', 'ARR', '[{"description":"contract register"}]', null, null, null);
select '08 R records a valid verification', exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', 'ARR at 30 Sep 2026',
  '[{"description":"Contract register reconciled to the September management accounts"}]', 'Sampled contracts only', 'on any change of ARR', '2027-04-01') is not null;
select '09 R records the FY2025 revenue', exitos_record_verification(:'A', :'CO', 'annual:FY2025', 'financial', 'FY2025 revenue',
  '[{"description":"FY2025 statutory accounts"}]', null, null, null) is not null;

select as_user(:'Q');
select '10 Q (authorised, not engaged) reads story', count(*) from exitos_company_stories;
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', 'ARR', '[{"description":"x"}]', null, null, null);

select as_user(:'C');
select '11 stranger reads story / verifications / engagements', (select count(*) from exitos_company_stories), (select count(*) from exitos_verifications), (select count(*) from exitos_review_engagements);
update exitos_company_stories set data = '{"version":"1","sources":[]}';

select as_user(:'A');
select '12 A reads verifications', count(*), bool_and(stale_at is null) from exitos_verifications;
select as_user(:'R');
select '12b R reads the verifications it recorded', count(*) from exitos_verifications;
select as_user(:'A');
update exitos_company_stories set data = jsonb_set(data, '{figures,arrUsd}', '23000000');
select '13 after ARR changed: stale ARR, FY2025 still current', claim, stale_at is not null from exitos_verifications order by claim;
select exitos_revoke_verification((select id from exitos_verifications where claim = 'annual:FY2025'), 'owner tries');
update exitos_review_engagements set revoked_at = now();

select as_user(:'R');
select '14 R after engagement revoked reads story', count(*) from exitos_company_stories;
select exitos_revoke_verification((select id from exitos_verifications where claim = 'annual:FY2025'), 'superseded by audited accounts');
select '15 R revoked FY2025', count(*) from exitos_verifications where revoked_at is not null;

reset role;
set role anon;
select '16 anon reads stories', count(*) from exitos_company_stories;
select exitos_record_verification(:'A', :'CO', 'figure:arrUsd', 'financial', 'x', '[{"description":"x"}]', null, null, null);
reset role;
