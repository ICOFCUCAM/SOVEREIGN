#!/bin/bash
# Company stories and independent verification: owner-only stories, engaged reviewers,
# operator-managed reviewer authorisation, no self-verification, staleness on change.
#   PGHOST=/tmp/pgtest PGPORT=5433 PGUSER=postgres supabase/tests/stories/run.sh
set -euo pipefail
cd "$(dirname "$0")"
M=../../migrations; DB=exitos_stories_test; Q="psql -v ON_ERROR_STOP=1 -q"
$Q -c "drop database if exists $DB" >/dev/null 2>&1
$Q -c "create database $DB" >/dev/null
$Q -d $DB -f ../isolation/shim.sql >/dev/null 2>&1
$Q -d $DB -c "create table if not exists auth.users (id uuid primary key, email text); insert into auth.users values ('eeee0000-0000-4000-8000-0000000000e1', 'reviewer@example.test'), ('cccc0000-0000-4000-8000-00000000000c', 'stranger@example.test')" >/dev/null
# as on Supabase: new public tables are granted to anon and authenticated by default; the migration must narrow that
$Q -d $DB -c "alter default privileges in schema public grant all on tables to anon, authenticated" >/dev/null
for f in $M/0001_exitos_backend.sql $M/0002_exitos_ownership.sql $M/0003_exitos_network.sql \
         $M/20261013130000_exitos_auth_roles.sql $M/20261014090000_exitos_company_stories.sql; do $Q -d $DB -f "$f" >/dev/null 2>&1; done
psql -q -d $DB -tA -f scenario.sql > actual.txt 2>&1 || true
$Q -c "drop database $DB" >/dev/null
if diff -u expected.txt actual.txt; then echo "stories: pass"; rm -f actual.txt; else echo "stories: FAIL"; exit 1; fi
