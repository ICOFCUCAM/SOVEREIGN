-- M14: Governance role identity (CIRCLE 2, phase 1).
--
-- Enforcement needs to know WHO may act as a chain role ("Director"). Functional
-- scopes (dispatch:approve) say a principal CAN approve; a governance-role grant
-- says a principal may approve AS Director, for this tenant. Roles are the
-- vocabulary; grants bind a principal identity (its actor string, e.g.
-- "svc:<clientId>") to a role. Eligibility for a chain step = an active grant for
-- that step's role AND clearance for the document's classification.

create table if not exists dispatch.governance_roles (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references dispatch.tenants(id) on delete cascade,
  key         text not null,                 -- "director"
  label       text not null,                 -- "Director"
  created_at  timestamptz not null default now(),
  unique (tenant_id, key)
);

create table if not exists dispatch.governance_role_grants (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references dispatch.tenants(id) on delete cascade,
  subject     text not null,                 -- principal identity (principal.actor)
  role_key    text not null,                 -- governance_roles.key in this tenant
  granted_by  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (tenant_id, subject, role_key)
);
create index if not exists gov_role_grants_lookup_idx
  on dispatch.governance_role_grants (tenant_id, role_key) where active;

alter table dispatch.governance_roles       enable row level security;
alter table dispatch.governance_roles       force  row level security;
alter table dispatch.governance_role_grants enable row level security;
alter table dispatch.governance_role_grants force  row level security;

-- Read: any principal in the tenant (the evaluator reads grants under app RLS).
create policy gov_roles_read  on dispatch.governance_roles       for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy gov_grants_read on dispatch.governance_role_grants for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());

-- Write: tenant_admin only, own tenant (mirrors M9 service_clients).
create policy gov_roles_admin_ins  on dispatch.governance_roles for insert
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');
create policy gov_roles_admin_upd  on dispatch.governance_roles for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());
create policy gov_grants_admin_ins on dispatch.governance_role_grants for insert
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');
create policy gov_grants_admin_upd on dispatch.governance_role_grants for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());

grant select, insert, update on dispatch.governance_roles       to dispatch_app;
grant select, insert, update on dispatch.governance_role_grants to dispatch_app;
