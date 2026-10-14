#!/bin/bash
# NDA lifecycle and buyer data-room access: applies every exchange, data-room and NDA migration to a
# scratch database with Supabase stand-ins and runs exitos_selftest_nda_lifecycle() (32 checks).
#   PGHOST=/tmp/pgtest PGPORT=5433 PGUSER=postgres supabase/tests/nda/run.sh
set -euo pipefail
cd "$(dirname "$0")"
M=../../migrations; DB=exitos_nda_test; Q="psql -v ON_ERROR_STOP=1 -q"
$Q -c "drop database if exists $DB" >/dev/null 2>&1
$Q -c "create database $DB" >/dev/null
$Q -d $DB -f ../isolation/shim.sql >/dev/null 2>&1
$Q -d $DB >/dev/null <<'SQL'
create schema if not exists extensions; create schema if not exists storage; create table if not exists storage.buckets (id text primary key, name text, public boolean);
do $x$ begin if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if; end $x$;
create table if not exists auth.users (id uuid primary key, email text);
-- as on Supabase: storage.objects has RLS on, clients may select, and no policy covers the private data-room bucket
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated; grant select on storage.objects to anon, authenticated;
-- as on Supabase: signed-in clients may write objects wherever a storage policy allows; buckets carry upload limits
grant insert, update, delete on storage.objects to authenticated;
alter table storage.buckets add column if not exists file_size_limit bigint, add column if not exists allowed_mime_types text[];
insert into storage.objects (bucket_id, name) values ('exit-data-room', 'seller/financial/1_accounts.pdf');
alter default privileges in schema public grant all on tables to anon, authenticated;
SQL
for f in $M/0001_exitos_backend.sql $M/0002_exitos_ownership.sql $M/0003_exitos_network.sql \
         $M/20261013114038_exitos_isolation_read_policies.sql $M/20261013120536_exitos_isolation_listing_public_only.sql \
         $M/20261013121524_exitos_hide_isolation_test_rows.sql $M/20261013122417_exitos_owns_listing_no_anon.sql \
         $M/20261013130000_exitos_auth_roles.sql $M/20261014100000_exitos_exchange_state_integrity.sql \
         ../../../supabase_migration_0027_exit_data_room.sql $M/20261014110000_exit_data_room_tagging.sql \
         $M/20261014120000_exitos_nda_lifecycle.sql $M/20261014120100_exitos_nda_lifecycle_selftest.sql \
         $M/20261014100100_exitos_exchange_state_selftest.sql $M/20261014110100_exit_data_room_selftest.sql \
         $M/20261014130000_exitos_offer_terms_guard.sql $M/20261014140000_exitos_transactions.sql $M/20261014140100_exitos_transactions_selftest.sql \
         $M/20261014150000_exitos_deal_end_to_end_selftest.sql \
         $M/20261014160000_exitos_identity_verification.sql $M/20261014160100_exitos_identity_verification_selftest.sql \
         $M/20261014170000_exitos_ad_campaigns.sql $M/20261014170100_exitos_ad_campaigns_selftest.sql \
         $M/20261014180000_exitos_ad_video.sql $M/20261014180100_exitos_ad_video_selftest.sql \
         $M/20261014200000_exitos_ad_placements.sql $M/20261014200100_exitos_ad_placements_selftest.sql \
         $M/20261014190000_exitos_buyer_workspace.sql $M/20261014190100_exitos_buyer_workspace_selftest.sql; do
  $Q -d $DB -f "$f" >/dev/null 2>/tmp/nda-mig.err || { echo "migration failed: $f"; cat /tmp/nda-mig.err; exit 1; }
done
status=0
for fn in exitos_selftest_nda_lifecycle exitos_selftest_exchange_state exit_selftest_data_room exitos_selftest_transaction_lifecycle exitos_selftest_deal_end_to_end exitos_selftest_identity_gate exitos_selftest_ad_campaigns exitos_selftest_ad_video exitos_selftest_buyer_workspace exitos_selftest_ad_placements; do
  res=$(psql -d $DB -tA -c "select public.$fn()" 2>&1 || true)
  echo "$res" | sed 's/^ERROR: *//' | grep -v '^CONTEXT' | grep -E "^SELFTEST|^f " || echo "$fn did not complete: $(echo "$res" | head -3)"
  echo "$res" | grep -q "SELFTEST PASS" || status=1
done
terms=$(psql -d $DB -tA -f offer_terms.sql 2>&1 | grep -o "owner rewrites.*" || true); echo "$terms"
echo "$terms" | grep -q "owner rewrites terms refused=t; owner accepts=t; bidder revises after acceptance refused=t" || status=1
# O-17: what a party may do is decided by identity, membership, NDA, disclosure and transaction stage only;
# no ExitOS function or policy may consult a plan or subscription (a counterparty never pays to meet its obligations)
plan=$(psql -d $DB -tA -c "select (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname ~ '^exit' and p.prosrc ~* 'subscription|\\mplan\\M') + (select count(*) from pg_policy where polrelid::regclass::text ~ 'exit' and (coalesce(pg_get_expr(polqual, polrelid), '') || coalesce(pg_get_expr(polwithcheck, polrelid), '')) ~* 'subscription|\\mplan\\M')")
echo "plan-independent authorization: $plan functions or policies consult a plan"; [ "$plan" = "0" ] || status=1
$Q -c "drop database $DB" >/dev/null
[ $status -eq 0 ] && echo "nda: pass" || { echo "nda: FAIL"; exit 1; }
