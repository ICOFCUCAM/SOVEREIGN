-- M21: Institutional SSO connections (item 2, stage 2 — IdP federation).
--
-- An institution federates its OWN identity provider (Entra/Azure AD, Okta, a
-- national IdP). This table holds one OIDC connection per tenant, keyed for
-- routing by the institution's email domain. Dispatch is the relying party: it
-- redirects a person to their IdP and verifies the returned ID token (see
-- services/shared/src/oidc.mjs). It never stores a person's password.
--
-- NOTE (residual, like service-client secrets): client_secret is stored at rest;
-- a production deployment should hold it in a secret manager / KMS. Documented,
-- not hidden.

create table if not exists dispatch.tenant_sso_connections (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references dispatch.tenants(id) on delete cascade,
  provider      text not null default 'oidc',
  issuer        text not null,                 -- the IdP issuer (OIDC discovery base)
  client_id     text not null,
  client_secret text,
  email_domain  text not null,                 -- routes a work email to this connection
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id),
  unique (email_domain)
);

alter table dispatch.tenant_sso_connections enable row level security;
alter table dispatch.tenant_sso_connections force  row level security;

-- Read: any principal in the tenant (admin UI shows the connection, secret elided
-- by the API). Write: tenant_admin only, own tenant (mirrors M14/M19/M20).
create policy sso_read on dispatch.tenant_sso_connections for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy sso_admin_ins on dispatch.tenant_sso_connections for insert
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');
create policy sso_admin_upd on dispatch.tenant_sso_connections for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());

grant select, insert, update on dispatch.tenant_sso_connections to dispatch_app;

-- Pre-auth, cross-tenant lookup by email domain. The SSO handshake begins BEFORE
-- a session exists, so the connection must be resolvable outside tenant RLS —
-- exactly as service-client credentials are (M9 lookup_service_client). Read-only,
-- by domain, returns only what the handshake needs. SECURITY DEFINER.
create or replace function dispatch.lookup_sso_connection(p_domain text)
returns table (tenant_id uuid, issuer text, client_id text, client_secret text, enabled boolean)
language sql
security definer
set search_path = dispatch, pg_temp
as $$
  select tenant_id, issuer, client_id, client_secret, enabled
    from dispatch.tenant_sso_connections
   where lower(email_domain) = lower(p_domain) and enabled
   limit 1;
$$;
grant execute on function dispatch.lookup_sso_connection(text) to dispatch_app;
