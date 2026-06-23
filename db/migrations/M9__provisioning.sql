-- M9 — Provisioning: tenant self-service for service-client credentials.
--
-- Two-layer onboarding model:
--   • Operators bootstrap a tenant + its first credential out-of-band, as a
--     superuser (BYPASSRLS), via the db/provision.mjs CLI. Cross-tenant.
--   • A tenant_admin then manages service clients WITHIN ITS OWN TENANT through
--     the unprivileged app role (dispatch_app), under RLS — backing the admin
--     HTTP API (POST /v1/admin/clients …).
--
-- Secrets are never written raw: the app generates a high-entropy secret and
-- stores only its scrypt hash (auth.mjs hashSecretScrypt). The secret is
-- returned to the caller exactly once, at issue/rotation.
--
-- Applies after M2 (RLS enabled/forced) and M5 (grants already allow
-- dispatch_app to insert/update service_clients — RLS is the only gate).

-- provenance — who issued the credential, and when it was last rotated.
alter table dispatch.service_clients
  add column if not exists created_by      text,
  add column if not exists last_rotated_at timestamptz;

-- A tenant_admin may ISSUE (insert) a service client in its own tenant.
create policy svc_admin_insert on dispatch.service_clients for insert
  with check (dispatch.current_tenant() is not null
              and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() = 'tenant_admin');

-- A tenant_admin may ROTATE / REVOKE (update) a client in its own tenant.
-- WITH CHECK pins tenant_id so a client can never be re-homed to another tenant.
create policy svc_admin_update on dispatch.service_clients for update
  using (dispatch.current_tenant() is not null
         and tenant_id = dispatch.current_tenant()
         and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());
-- No DELETE policy: revocation sets active=false, preserving the credential's
-- identity and audit history (a deleted client_id could later be reissued).
