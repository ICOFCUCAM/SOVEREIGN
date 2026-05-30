-- M10 — membership lookup for human SSO.
--
-- Human SSO: the console obtains a Supabase user JWT (verified by the API via
-- SUPABASE_JWT_SECRET). But ROLE and CLEARANCE are Dispatch's authority, not the
-- identity provider's — a Supabase token must never be able to self-assert
-- 'tenant_admin' or a clearance. So the auth layer resolves them from the
-- membership row, keyed by (tenant_id, user_id), via a SECURITY DEFINER lookup
-- that runs before the tenant claim is established (mirrors lookup_service_client).
-- Forward-only, additive.

create or replace function dispatch.lookup_membership(p_tenant_id uuid, p_user_id uuid)
returns table (role text, clearance text, status text)
language sql security definer stable
set search_path = dispatch as $$
  select role, clearance, status
    from dispatch.memberships
   where tenant_id = p_tenant_id and user_id = p_user_id
$$;

grant execute on function dispatch.lookup_membership(uuid, uuid) to dispatch_app;
