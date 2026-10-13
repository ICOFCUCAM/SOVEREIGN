#!/bin/bash
# Data-room tagging and review (20261014110000): only the room's owner tags and reviews
# its files; review needs a tag; re-tagging clears a review; others and anon can do nothing.
#   PGHOST=/tmp/pgtest PGPORT=5433 PGUSER=postgres supabase/tests/dataroom/run.sh
set -euo pipefail
cd "$(dirname "$0")"
DB=exitos_dataroom_test; Q="psql -v ON_ERROR_STOP=1 -q"
$Q -c "drop database if exists $DB" >/dev/null 2>&1
$Q -c "create database $DB" >/dev/null
$Q -d $DB -f ../isolation/shim.sql >/dev/null 2>&1
$Q -d $DB >/dev/null <<'SQL'
create schema if not exists extensions; create schema if not exists storage; create table if not exists storage.buckets (id text primary key, name text, public boolean);
do $x$ begin if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if; end $x$;
alter default privileges in schema public grant all on tables to anon, authenticated;
SQL
for f in ../../../supabase_migration_0027_exit_data_room.sql ../../migrations/20261014110000_exit_data_room_tagging.sql; do
  $Q -d $DB -f "$f" >/dev/null 2>/tmp/dataroom-mig.err || { echo "migration failed: $f"; cat /tmp/dataroom-mig.err; exit 1; }
done
psql -q -d $DB -tA -f scenario.sql > actual.txt 2>&1 || true
$Q -c "drop database $DB" >/dev/null
if diff -u expected.txt actual.txt; then echo "dataroom: pass"; rm -f actual.txt; else echo "dataroom: FAIL"; exit 1; fi
