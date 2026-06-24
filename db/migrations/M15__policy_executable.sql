-- M15: Make the policy executable (CIRCLE 2, phase 2).
--
-- The review_chain (jsonb) gains executable semantics per step:
--   [{ index, role, label, quorum }]
-- where `role` is a governance_roles.key and `quorum` is the distinct eligible
-- approvals that step needs (default 1). approval_authority / publication_authority
-- (already present) now hold ROLE KEYS. policy_version is pinned into every
-- Governance Certificate so a certificate always proves compliance against the
-- exact policy in force at decision time.

alter table dispatch.approval_policies
  add column if not exists policy_version    int     not null default 1,
  add column if not exists sequential        boolean not null default true,  -- ordered vs parallel chain
  add column if not exists approval_ttl_days  int;                            -- null = approvals never expire
