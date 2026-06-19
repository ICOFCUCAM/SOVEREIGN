-- M12 — per-tenant (and per-classification) retention policy.
--
-- Sprint 3 used one tenants.retention_days + a global DISPATCH_PURGE_GRACE_DAYS
-- env. Institutions need retention to vary by classification (e.g. a SECRET
-- record retained far longer than UNCLASSIFIED) and the grace window set per
-- tenant. This adds an admin-editable policy table resolved most-specific-wins,
-- exactly like approval_policies.
--
-- To keep the cross-tenant purge sweeper a PURE timestamp comparison (it runs as
-- dispatch_purge with no per-tenant policy context), both timestamps are
-- computed at PUBLISH time (under the user's claim, where classification +
-- tenant are known) and stored on the document:
--   retention_until : published → archived boundary
--   purge_after     : archived → bytes-purged boundary
-- Forward-only, additive.

alter table dispatch.documents
  add column purge_after timestamptz;

create table dispatch.retention_policies (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references dispatch.tenants(id) on delete cascade,
  classification_level text,                       -- NULL = any level (normalized lower)
  retention_days       int not null default 365 check (retention_days between 0 and 36500),
  purge_grace_days     int not null default 30 check (purge_grace_days between 0 and 36500),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (tenant_id, classification_level)
);
create index on dispatch.retention_policies (tenant_id);

create trigger retention_policies_touch before update on dispatch.retention_policies
  for each row execute function dispatch.touch_updated_at();

-- RLS: read in-tenant; write tenant_admin only (mirrors approval_policies).
alter table dispatch.retention_policies enable row level security;
alter table dispatch.retention_policies force row level security;

create policy retpol_read on dispatch.retention_policies for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy retpol_write on dispatch.retention_policies for insert
  with check (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() in ('tenant_admin'));
create policy retpol_update on dispatch.retention_policies for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() in ('tenant_admin'))
  with check (tenant_id = dispatch.current_tenant());

grant select, insert, update on dispatch.retention_policies to dispatch_app;
grant select, delete on dispatch.retention_policies to dispatch_purge;
