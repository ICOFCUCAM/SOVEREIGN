#!/bin/bash
# Runs the post-deployment self-test against a fresh local database.
#   PGHOST=/tmp/pgtest PGPORT=5433 PGUSER=postgres supabase/tests/stories/selftest.sh
set -euo pipefail
cd "$(dirname "$0")"
M=../../migrations; DB=exitos_selftest_test; Q="psql -v ON_ERROR_STOP=1 -q"
$Q -c "drop database if exists $DB" >/dev/null 2>&1
$Q -c "create database $DB" >/dev/null
$Q -d $DB -f ../isolation/shim.sql >/dev/null 2>&1
$Q -d $DB -c "create table if not exists auth.users (id uuid primary key, email text)" >/dev/null
$Q -d $DB -c "alter default privileges in schema public grant all on tables to anon, authenticated" >/dev/null
for f in $M/0001_exitos_backend.sql $M/0002_exitos_ownership.sql $M/0003_exitos_network.sql \
         $M/20261013114038_exitos_isolation_read_policies.sql $M/20261013120536_exitos_isolation_listing_public_only.sql \
         $M/20261013121524_exitos_hide_isolation_test_rows.sql $M/20261013122417_exitos_owns_listing_no_anon.sql \
         $M/20261013130000_exitos_auth_roles.sql $M/20261014090000_exitos_company_stories.sql \
         $M/20261014090100_exitos_company_stories_selftest.sql $M/20261014100000_exitos_exchange_state_integrity.sql \
         $M/20261014100100_exitos_exchange_state_selftest.sql $M/20261014130000_exitos_offer_terms_guard.sql; do $Q -d $DB -f "$f" >/dev/null 2>/tmp/selftest-mig.err || { echo "migration failed: $f"; cat /tmp/selftest-mig.err; exit 1; }; done
status=0
for fn in exitos_selftest_company_stories exitos_selftest_exchange_state; do
  res=$(psql -d $DB -tA -c "select public.$fn()" 2>&1 || true)
  echo "$res" | sed 's/^ERROR: *//'
  echo "$res" | grep -q "SELFTEST PASS" || status=1
done
$Q -c "drop database $DB" >/dev/null
[ $status -eq 0 ] && echo "selftest: pass" || { echo "selftest: FAIL"; exit 1; }
