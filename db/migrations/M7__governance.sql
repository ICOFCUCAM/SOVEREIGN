-- M7 — Publication governance (Sprint 3 / lifecycle).
-- Adds the governance layer ABOVE the render job: an explicit document
-- lifecycle_state, approval policies (N-eyes / clearance / auto-approve lane),
-- an immutable approvals ledger, and an auditor read path over audit_events.
--
-- Design: the worker-owned `documents.status` (draft|rendering|complete|failed)
-- is the RENDER status and is left untouched. `lifecycle_state` is the
-- GOVERNANCE state (draft → submitted → in_review → approved → rendered →
-- published → archived, with rejected/withdrawn branches). Render is gated on
-- `approved`; machine/service submissions may auto-approve via policy so the
-- Emergency-AI path is unchanged. Forward-only, additive.

-- ---- 1. lifecycle_state on documents (governance state machine) ----
alter table dispatch.documents
  add column lifecycle_state text not null default 'draft'
    check (lifecycle_state in
      ('draft','submitted','in_review','approved','rejected',
       'rendered','published','withdrawn','archived')),
  add column submitted_at   timestamptz,
  add column submitted_by   text,
  add column decided_at     timestamptz,
  add column published_at    timestamptz,
  add column withdrawn_at    timestamptz,
  add column retention_until timestamptz;

create index on dispatch.documents (tenant_id, lifecycle_state);

-- ---- 2. approval_policies: per (tenant, doc_type, classification level) ----
-- Resolution is most-specific-wins; NULL doc_type / level = wildcard. When no
-- row matches, the application default applies (service lane auto-approves,
-- user lane requires 1 approval) — so this table is purely opt-in tightening.
create table dispatch.approval_policies (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references dispatch.tenants(id) on delete cascade,
  doc_type        text,                      -- NULL = any doc type
  classification_level text,                 -- NULL = any level (normalized lower)
  required_approvals  int not null default 1 check (required_approvals between 0 and 5),
  min_approver_clearance text,               -- NULL = no clearance floor beyond doc classification
  auto_approve_service boolean not null default true,  -- machine lane auto-approves
  auto_approve_user    boolean not null default false, -- human lane requires review
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, doc_type, classification_level)
);
create index on dispatch.approval_policies (tenant_id);

-- ---- 3. approvals: immutable decision ledger (N-eyes, separation of duties) ----
create table dispatch.approvals (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references dispatch.tenants(id) on delete cascade,
  document_id   uuid not null references dispatch.documents(id) on delete cascade,
  version_no    int not null,                -- approvals are bound to a version
  decision      text not null check (decision in ('approve','reject','return')),
  actor         text not null,               -- principal actor string
  actor_clearance text,
  comment       text,
  created_at    timestamptz not null default now(),
  -- a given actor may record at most one ACTIVE decision per (document, version)
  unique (document_id, version_no, actor)
);
create index on dispatch.approvals (tenant_id, document_id, version_no);

-- updated_at maintenance on approval_policies
create trigger approval_policies_touch before update on dispatch.approval_policies
  for each row execute function dispatch.touch_updated_at();

-- approvals are an immutable ledger: block UPDATE/DELETE (a changed mind = a new
-- decision row only after a fresh submission/version). Reuses the M3 block fn.
create trigger approvals_immutable
  before update or delete on dispatch.approvals
  for each row execute function dispatch.block_mutation();

-- ---- 4. RLS on the new tables + governance role gating ----
do $$
declare t text;
begin
  foreach t in array array['approval_policies','approvals'] loop
    execute format('alter table dispatch.%I enable row level security;', t);
    execute format('alter table dispatch.%I force row level security;', t);
  end loop;
end $$;

-- approval_policies: read in-tenant; write tenant_admin only.
create policy appol_read on dispatch.approval_policies for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy appol_write on dispatch.approval_policies for insert
  with check (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() in ('tenant_admin'));
create policy appol_update on dispatch.approval_policies for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() in ('tenant_admin'))
  with check (tenant_id = dispatch.current_tenant());

-- approvals: read in-tenant; insert by reviewer/approver/tenant_admin only.
create policy appr_read on dispatch.approvals for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy appr_insert on dispatch.approvals for insert
  with check (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() in ('reviewer','approver','tenant_admin'));
-- no update/delete policy (+ immutability trigger above).

-- ---- 5. documents lifecycle transitions: widen the update role gate ----
-- M2 allowed author/tenant_admin/service to update documents. Governance adds
-- reviewer/approver (decisions) and lets those roles drive lifecycle_state.
-- Drop + recreate the update policy with the broader role set.
drop policy if exists documents_update on dispatch.documents;
create policy documents_update on dispatch.documents for update
  using (tenant_id = dispatch.current_tenant()
         and dispatch.current_role() in ('author','reviewer','approver','publisher','tenant_admin','service'))
  with check (tenant_id = dispatch.current_tenant());

-- ---- 6. audit_events read path (auditor / compliance) ----
-- P1 deliberately had no select policy on audit_events. Governance introduces a
-- tenant-scoped read for the auditor + tenant_admin roles only (append-only
-- trigger from M4 still blocks any mutation).
create policy audit_read on dispatch.audit_events for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant()
         and dispatch.current_role() in ('auditor','tenant_admin'));

-- ---- 7. grants for the new tables ----
grant select, insert, update on dispatch.approval_policies to dispatch_app;
grant select, insert on dispatch.approvals to dispatch_app;
grant delete on dispatch.approval_policies, dispatch.approvals to dispatch_purge;

-- ---- 8. governance roles: extend the memberships role vocabulary ----
-- M1 allowed (viewer, author, reviewer, approver, template_admin, tenant_admin).
-- Governance adds 'publisher' (release/withdraw) and 'auditor' (read-only audit).
alter table dispatch.memberships drop constraint if exists memberships_role_check;
alter table dispatch.memberships add constraint memberships_role_check
  check (role in ('viewer','author','reviewer','approver','publisher',
                  'auditor','template_admin','tenant_admin'));
