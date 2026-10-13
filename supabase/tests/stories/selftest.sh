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
for f in $M/0001_exitos_backend.sql $M/0002_exitos_ownership.sql $M/0003_exitos_network.sql $M/20261013130000_exitos_auth_roles.sql \
         $M/20261014090000_exitos_company_stories.sql $M/20261014090100_exitos_company_stories_selftest.sql; do $Q -d $DB -f "$f" >/dev/null 2>&1; done
res=$(psql -d $DB -tA -c "select public.exitos_selftest_company_stories()" 2>&1 || true)
$Q -c "drop database $DB" >/dev/null
echo "$res" | sed 's/^ERROR: *//'
echo "$res" | grep -q "SELFTEST PASS" && echo "selftest: pass" || { echo "selftest: FAIL"; exit 1; }
