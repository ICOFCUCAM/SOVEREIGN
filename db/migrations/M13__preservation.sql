-- M13: Archive as PRESERVATION (not storage).
--
-- The publication lifecycle ends in a preserved institutional artifact, not a
-- row with status='archived'. Archiving captures a preservation timestamp and a
-- tamper-evident integrity proof over the canonical record (its immutable DDM
-- version, publication time, governing policy and approval chain). Once archived
-- the record is terminal: the lifecycle state machine forbids any further
-- transition (approve / publish / withdraw all 409), so an archived record can
-- never be modified, re-approved, withdrawn or republished.

alter table dispatch.documents
  add column if not exists archived_at          timestamptz,
  add column if not exists preservation_sha256   text;

-- Fast lookup of records due for retention-driven preservation.
create index if not exists documents_retention_due_idx
  on dispatch.documents (retention_until)
  where lifecycle_state = 'published';
