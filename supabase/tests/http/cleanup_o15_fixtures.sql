-- Removes the O-15 HTTP-test fixtures created on 13 October 2026 (run once, as the database owner, in the
-- Supabase SQL editor; the deployment tools here cannot run DELETE without a confirmation they cannot show).
-- Until it runs the fixtures are inert: the three accounts are banned with unknown passwords and revoked refresh
-- tokens, the listings sit in the policy-hidden zz-isotest- range, every NDA and transaction is terminated and the
-- three data-room rows are seller-only and rejected. Every statement is scoped to the fixtures' own ids.
begin;
delete from public.exitos_transaction_events where transaction_id::text like 'feed0000-%';
delete from public.exitos_transaction_confirmations where transaction_id::text like 'feed0000-%';
delete from public.exitos_transaction_items where transaction_id::text like 'feed0000-%';
update public.exitos_nda_agreements set transaction_id = null where id::text like 'feed0000-%';
delete from public.exitos_transactions where id::text like 'feed0000-%';
delete from public.exitos_nda_events where agreement_id::text like 'feed0000-%';
delete from public.exitos_nda_signatures where agreement_id::text like 'feed0000-%';
delete from public.exitos_nda_agreements where id::text like 'feed0000-%';
delete from public.exitos_nda_requests where id like 'zz-httptest-%';
delete from public.exitos_offers where id like 'zz-httptest-%';
delete from public.exitos_listings where id like 'zz-isotest-httptest-%';
-- the disclosed row pointed at the existing isotest fixture object; no storage object was created, none is deleted here
delete from public.exit_data_room_documents where id::text like 'feed0000-%';
delete from auth.refresh_tokens where user_id::text like 'feed0000-%';
delete from auth.sessions where user_id::text like 'feed0000-%';
delete from auth.identities where user_id::text like 'feed0000-%';
delete from auth.users where id::text like 'feed0000-%' and email like 'zz-httptest-%@exitos.invalid';
-- the test's pg_net responses (already scrubbed of tokens and links); 8738 and 8739 belong to another job
delete from net._http_response where id between 8713 and 8752 and id not in (8738, 8739);
-- every count below must be 0
select (select count(*) from auth.users where id::text like 'feed0000-%') users, (select count(*) from public.exitos_listings where id like 'zz-isotest-httptest-%') listings,
       (select count(*) from public.exitos_nda_agreements where id::text like 'feed0000-%') ndas, (select count(*) from public.exitos_transactions where id::text like 'feed0000-%') txns,
       (select count(*) from public.exit_data_room_documents where id::text like 'feed0000-%') files;
commit;
