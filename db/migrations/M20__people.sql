-- M20: People — human identities, distinct from service credentials (CIRCLE: Institutional Operations, identity).
--
-- Until now a "subject" was a service credential ("svc:<clientId>") — a machine.
-- An institution is run by PEOPLE. A person belongs to the tenant, sits in a
-- department, and OCCUPIES one or more offices (a governance_role_grant whose
-- subject is "user:<id>"). The office is the unit of authority; the person is
-- assigned to it over time. This table is the human directory; it does NOT yet
-- carry credentials — authentication (institutional SSO / IdP federation) is the
-- next stage and plugs in on top of this identity.
--
-- TWO DIMENSIONS OF PRIVILEGE, kept separate by design:
--   · system_admin  — IT permissions (manage users, integrations, deployment).
--   · offices (grants) — institutional AUTHORITY (review / approve / publish).
-- A System Administrator may hold no office; a Permanent Secretary may be no admin.

create table if not exists dispatch.users (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references dispatch.tenants(id) on delete cascade,
  email          text not null,
  full_name      text not null,
  department_key text,                         -- dispatch.departments.key in this tenant (nullable)
  system_admin   boolean not null default false,
  status         text not null default 'active', -- active | suspended
  created_at     timestamptz not null default now(),
  unique (tenant_id, email)
);
create index if not exists users_tenant_idx on dispatch.users (tenant_id) where status = 'active';

alter table dispatch.users enable row level security;
alter table dispatch.users force  row level security;

-- Read: any principal in the tenant (the org tree resolves holder names). Write:
-- tenant_admin only, own tenant (mirrors M14/M19).
create policy users_read on dispatch.users for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy users_admin_ins on dispatch.users for insert
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');
create policy users_admin_upd on dispatch.users for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());

grant select, insert, update on dispatch.users to dispatch_app;
