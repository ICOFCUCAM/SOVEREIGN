-- M12: Governance policies as a first-class, institution-defined object.
--
-- Sovereign Dispatch does not sell record creation; it sells GOVERNANCE — the
-- institution's control over how official records are created, reviewed,
-- approved, published and retained. This migration elevates the internal
-- approval_policies table (N-eyes / auto-approve lanes) into a named policy a
-- tenant admin defines and binds to a record type:
--
--   name                    "Ministerial Briefing Policy"
--   review_chain            [{label:"Director"},{label:"Secretary General"}]
--   approval_authority      "Chief Secretary"
--   publication_authority   "Ministry Communications Office"
--   retention_days          3650
--
-- Records inherit governance from the policy that matches their type/level
-- (resolvePolicy, most-specific wins). Humans do not assemble a workflow each
-- time — the policy drives behaviour.

alter table dispatch.approval_policies
  add column if not exists name                  text,
  add column if not exists review_chain          jsonb not null default '[]'::jsonb,
  add column if not exists approval_authority     text,
  add column if not exists publication_authority  text,
  add column if not exists retention_days         int,
  add column if not exists active                 boolean not null default true;

-- A tenant admin manages their own governance policies. Mirrors the M9 model
-- for service_clients: writes require the elevated tenant_admin role in-claims,
-- scoped to the caller's own tenant. SELECT is already permitted to the app role
-- (resolvePolicy reads policies during submission under RLS).
drop policy if exists gov_admin_insert on dispatch.approval_policies;
create policy gov_admin_insert on dispatch.approval_policies
  for insert to dispatch_app
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');

drop policy if exists gov_admin_update on dispatch.approval_policies;
create policy gov_admin_update on dispatch.approval_policies
  for update to dispatch_app
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');

grant select, insert, update on dispatch.approval_policies to dispatch_app;
