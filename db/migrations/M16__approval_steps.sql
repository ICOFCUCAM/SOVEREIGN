-- M16: Step-bound approvals, delegation, expiration (CIRCLE 2, phase 2).
--
-- An approval is now bound to the chain step / role it satisfies, may be made
-- under a time-boxed delegation, and carries its own expiry. The existing unique
-- (tenant, document, version, actor) constraint already enforces a core SoD rule:
-- one principal can satisfy at most ONE step per record version.

alter table dispatch.approvals
  add column if not exists step_index   int,          -- which chain step this satisfies
  add column if not exists role_key     text,         -- governance role exercised
  add column if not exists on_behalf_of text,         -- delegation: role-holder acted for
  add column if not exists expires_at   timestamptz;  -- per-approval expiry

-- Time-boxed, logged delegation: a delegate may act for a role during a window.
create table if not exists dispatch.delegations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references dispatch.tenants(id) on delete cascade,
  role_key        text not null,
  delegate_subject text not null,      -- principal identity acting (principal.actor)
  grantor_subject  text,               -- role-holder delegating
  reason          text,
  starts_at       timestamptz not null default now(),
  ends_at         timestamptz not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists delegations_lookup_idx
  on dispatch.delegations (tenant_id, role_key, delegate_subject) where active;

alter table dispatch.delegations enable row level security;
alter table dispatch.delegations force  row level security;
create policy delegations_read on dispatch.delegations for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy delegations_admin_ins on dispatch.delegations for insert
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');
create policy delegations_admin_upd on dispatch.delegations for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());

grant select, insert, update on dispatch.delegations to dispatch_app;

-- The Governance Certificate sealed at publication (compliance proof), mirroring
-- the preservation certificate. Stored so it is immutable and re-derivable.
alter table dispatch.documents
  add column if not exists governance_sha256       text,
  add column if not exists governance_certificate  jsonb;

