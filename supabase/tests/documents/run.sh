#!/bin/bash
# Document versions and review workflow: applies the exitos_* migrations to a scratch
# Postgres (with the isolation test's Supabase stand-ins) and plays owner, approver,
# counsel and stranger through scenario.sql; compares with expected.txt.
#   PGHOST=/tmp/pgtest PGPORT=5433 PGUSER=postgres supabase/tests/documents/run.sh
set -euo pipefail
cd "$(dirname "$0")"
M=../../migrations; DB=exitos_documents_test; Q="psql -v ON_ERROR_STOP=1 -q"
$Q -c "drop database if exists $DB" >/dev/null 2>&1
$Q -c "create database $DB" >/dev/null
for f in ../isolation/shim.sql $M/0001_exitos_backend.sql $M/0002_exitos_ownership.sql $M/0003_exitos_network.sql \
         $M/20261013114038_exitos_isolation_read_policies.sql $M/20261013120536_exitos_isolation_listing_public_only.sql \
         $M/20261013122417_exitos_owns_listing_no_anon.sql $M/20261013130000_exitos_auth_roles.sql \
         $M/20261013140000_exitos_document_versions.sql; do $Q -d $DB -f "$f" >/dev/null 2>&1; done
$Q -d $DB -c "grant select, insert, update, delete on all tables in schema public to authenticated" >/dev/null
$Q -d $DB -c "revoke update, delete on exitos_document_versions, exitos_document_events from authenticated; revoke insert, update, delete on exitos_role_grants from authenticated" >/dev/null
$Q -d $DB -tA -f scenario.sql > actual.txt 2>&1
$Q -c "drop database $DB" >/dev/null
if diff -u expected.txt actual.txt; then echo "documents: pass"; rm -f actual.txt; else echo "documents: FAIL"; exit 1; fi
