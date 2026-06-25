-- M19: Departments — the institutional grouping layer (CIRCLE: Institutional Operations).
--
-- An institution is not a flat list of offices. It is:
--   Tenant (the institution) → Departments → Offices (governance_roles) → Holders (grants).
-- A department groups the offices that belong to it (Policy Division holds the
-- Policy Officer and Director of Policy offices; Communications holds the
-- Communications Office). Offices remain the unit of AUTHORITY — departments are
-- the unit of ORGANISATION. Adding this layer changes no governance semantics:
-- policies still reference offices, enforcement is unchanged. It exists so the
-- institution can describe itself the way it actually exists.

create table if not exists dispatch.departments (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references dispatch.tenants(id) on delete cascade,
  key           text not null,                 -- "policy"
  name          text not null,                 -- "Policy Division"
  display_order int  not null default 100,
  created_at    timestamptz not null default now(),
  unique (tenant_id, key)
);

-- Offices belong to a department (nullable — an office may be unassigned). A
-- display_order lets an institution present its offices in protocol order
-- (Officer → Director → Permanent Secretary) rather than alphabetically.
alter table dispatch.governance_roles add column if not exists department_key text;
alter table dispatch.governance_roles add column if not exists display_order  int not null default 100;

alter table dispatch.departments enable row level security;
alter table dispatch.departments force  row level security;

-- Read: any principal in the tenant. Write: tenant_admin only, own tenant
-- (mirrors M14 governance_roles exactly).
create policy departments_read on dispatch.departments for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy departments_admin_ins on dispatch.departments for insert
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');
create policy departments_admin_upd on dispatch.departments for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());

grant select, insert, update on dispatch.departments to dispatch_app;
