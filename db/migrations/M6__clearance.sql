-- M6 — clearance enforcement support.
-- Extends the service-client lookup to return `clearance` so the auth layer can
-- build a Principal with a clearance and gate reads against document
-- classification (see services/shared/src/clearance.mjs). Forward-only,
-- additive: CREATE OR REPLACE on the SECURITY DEFINER function (same signature
-- shape, one extra returned column); the clearance columns themselves already
-- exist on memberships/service_clients (M1).

-- Postgres can't CREATE OR REPLACE a function whose OUT columns (return type)
-- change — drop then recreate. SECURITY DEFINER fn is owned by the migration
-- role; grants are re-applied below (mirrors M5's grant to dispatch_app).
drop function if exists dispatch.lookup_service_client(text);

create function dispatch.lookup_service_client(p_client_id text)
returns table (tenant_id uuid, secret_hash text, scopes text[], active boolean, clearance text)
language sql security definer stable
set search_path = dispatch as $$
  select tenant_id, secret_hash, scopes, active, clearance
    from dispatch.service_clients where client_id = p_client_id
$$;

grant execute on function dispatch.lookup_service_client(text) to dispatch_app;
