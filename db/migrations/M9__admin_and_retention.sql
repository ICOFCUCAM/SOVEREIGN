-- M9 — Admin surface write paths + retention purge role.
--
-- Two gaps from Sprint 3 close here:
--  1. Admin management: M2 left memberships + service_clients READ-only (service
--     clients were provisioned out-of-band). The Admin console needs a
--     tenant-scoped, tenant_admin-gated write path for both, plus the existing
--     approval_policies writes (already present from M7).
--  2. Retention: the dispatch_purge role gets BYPASSRLS so a cross-tenant
--     retention sweep can archive documents and expire artifacts. Purge is the
--     documented privileged-retention role; this is its first real use.
-- Forward-only, additive.

-- ---- 1. memberships: tenant_admin insert/update within tenant ----
create policy memberships_insert on dispatch.memberships for insert
  with check (dispatch.current_tenant() is not null
              and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() in ('tenant_admin'));
create policy memberships_update on dispatch.memberships for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() in ('tenant_admin'))
  with check (tenant_id = dispatch.current_tenant());

-- ---- 2. service_clients: tenant_admin insert/update within tenant ----
-- (Secrets are hashed in the app before insert; the client_id is globally
-- unique. A tenant_admin can only ever touch its own tenant's clients.)
create policy svc_insert on dispatch.service_clients for insert
  with check (dispatch.current_tenant() is not null
              and tenant_id = dispatch.current_tenant()
              and dispatch.current_role() in ('tenant_admin'));
create policy svc_update on dispatch.service_clients for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() in ('tenant_admin'))
  with check (tenant_id = dispatch.current_tenant());

-- ---- 3. retention: privileged purge role can sweep across tenants ----
-- BYPASSRLS lets the retention worker archive documents and expire artifacts
-- regardless of tenant claim (a cross-tenant background job, like the worker's
-- SECURITY DEFINER claim). The block_mutation trigger already exempts
-- dispatch_purge, so it may also mutate the otherwise-immutable artifact rows.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'dispatch_purge') then
    alter role dispatch_purge bypassrls;
  end if;
end $$;

-- purge needs to read + update documents (lifecycle → archived) and artifacts
-- (expires_at → now, integrity_status), and join document_versions. M5 granted
-- select/delete on artifacts + document_versions + jobs; add the rest here.
grant select, update on dispatch.documents to dispatch_purge;
grant update on dispatch.artifacts to dispatch_purge;
grant insert on dispatch.audit_events to dispatch_purge;
