#!/bin/bash
# Exchange-table isolation test: applies the exitos_* migrations to a scratch
# Postgres database with minimal Supabase stand-ins (shim.sql), seeds an owner
# (A), a buyer (B) and an unrelated user (C), and compares what each can read
# with expected.txt. Needs a local Postgres; set PGHOST/PGPORT/PGUSER as usual.
#   PGHOST=/tmp/pgtest PGPORT=5433 PGUSER=postgres supabase/tests/isolation/run.sh
set -euo pipefail
cd "$(dirname "$0")"
M=../../migrations
DB=exitos_isolation_test
Q="psql -v ON_ERROR_STOP=1 -q"
$Q -c "drop database if exists $DB" >/dev/null 2>&1
$Q -c "create database $DB" >/dev/null
for f in shim.sql $M/0001_exitos_backend.sql $M/0002_exitos_ownership.sql $M/0003_exitos_network.sql; do $Q -d $DB -f "$f" >/dev/null 2>&1; done
$Q -d $DB -c "grant select, insert, update, delete on all tables in schema public to authenticated" >/dev/null
$Q -d $DB -f seed.sql >/dev/null
$Q -d $DB -f $M/20261013010000_exitos_isolation.sql >/dev/null 2>&1
$Q -d $DB -tA -f check.sql > actual.txt 2>&1
$Q -c "drop database $DB" >/dev/null
if diff -u expected.txt actual.txt; then echo "isolation: pass"; rm -f actual.txt; else echo "isolation: FAIL"; exit 1; fi
