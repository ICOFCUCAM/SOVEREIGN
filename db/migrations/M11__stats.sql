-- M11 — Institutional outcome counters for the console dashboard.
--
-- Real counts (never fabricated), scoped to the CALLER's tenant via the JWT
-- claim. SECURITY DEFINER because audit_events has no app SELECT policy (M2) —
-- this exposes only aggregate counts for the caller's own tenant, nothing else.
create or replace function dispatch.tenant_stats()
returns table (records bigint, artifacts bigint, approvals bigint, audit_events bigint, published bigint)
language sql security definer set search_path = dispatch stable as $$
  select
    (select count(*) from dispatch.documents     where tenant_id = dispatch.current_tenant() and deleted_at is null),
    (select count(*) from dispatch.artifacts      where tenant_id = dispatch.current_tenant()),
    (select count(*) from dispatch.approvals      where tenant_id = dispatch.current_tenant()),
    (select count(*) from dispatch.audit_events   where tenant_id = dispatch.current_tenant()),
    (select count(*) from dispatch.documents      where tenant_id = dispatch.current_tenant() and lifecycle_state = 'published')
$$;

grant execute on function dispatch.tenant_stats() to dispatch_app;
