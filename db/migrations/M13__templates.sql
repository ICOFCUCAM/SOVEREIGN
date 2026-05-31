-- M13 — tenant document templates (scaffolds).
--
-- The built-in scaffolds (packages/ddm-schema/schemas/scaffolds.v1.0.json)
-- define, per docType, the required section ROLES a document must contain to be
-- publishable. Institutions need their own report formats without code changes,
-- so this table lets a tenant_admin override a built-in docType or add a new
-- one. The API overlays active tenant templates onto the built-in defaults at
-- validate time (resolveScaffolds); the worker is unaffected (it renders the
-- already-validated immutable DDM). Forward-only, additive.

create table dispatch.templates (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references dispatch.tenants(id) on delete cascade,
  doc_type       text not null,
  title          text not null default '',
  required_roles text[] not null default '{}',
  optional_roles text[] not null default '{}',
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, doc_type)
);
create index on dispatch.templates (tenant_id, active);

create trigger templates_touch before update on dispatch.templates
  for each row execute function dispatch.touch_updated_at();

-- RLS: any in-tenant principal may READ templates (validate/submit needs the
-- effective scaffolds); only tenant_admin may write.
alter table dispatch.templates enable row level security;
alter table dispatch.templates force row level security;

create policy templates_read on dispatch.templates for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy templates_insert on dispatch.templates for insert
  with check (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() in ('tenant_admin'));
create policy templates_update on dispatch.templates for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() in ('tenant_admin'))
  with check (tenant_id = dispatch.current_tenant());
create policy templates_delete on dispatch.templates for delete
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() in ('tenant_admin'));

grant select, insert, update, delete on dispatch.templates to dispatch_app;
