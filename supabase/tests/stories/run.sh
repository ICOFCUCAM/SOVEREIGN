#!/bin/bash
# Company stories: owner-only, revisioned, and no self-verification.
#   PGHOST=/tmp/pgtest PGPORT=5433 PGUSER=postgres supabase/tests/stories/run.sh
set -euo pipefail
cd "$(dirname "$0")"
M=../../migrations; DB=exitos_stories_test; Q="psql -v ON_ERROR_STOP=1 -q"
$Q -c "drop database if exists $DB" >/dev/null 2>&1
$Q -c "create database $DB" >/dev/null
for f in ../isolation/shim.sql $M/0001_exitos_backend.sql $M/0002_exitos_ownership.sql $M/0003_exitos_network.sql \
         $M/20261013130000_exitos_auth_roles.sql $M/20261014090000_exitos_company_stories.sql; do $Q -d $DB -f "$f" >/dev/null 2>&1; done
$Q -d $DB -c "grant select, insert, update, delete on exitos_company_stories to authenticated" >/dev/null
psql -q -d $DB -tA -f scenario.sql > actual.txt 2>&1 || true
$Q -c "drop database $DB" >/dev/null
if diff -u expected.txt actual.txt; then echo "stories: pass"; rm -f actual.txt; else echo "stories: FAIL"; exit 1; fi
