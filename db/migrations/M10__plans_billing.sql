-- M10 — Plans, subscriptions & self-serve signup.
--
-- The "taste the system" model: an institution can self-serve a FREE account,
-- generate a credential, create a few records, and must SUBSCRIBE before it can
-- download them.
--   • plan / subscription_status / doc_quota on the tenant.
--   • signup_tenant()  — SECURITY DEFINER so the unprivileged app role can create
--     a free tenant + its owner credential atomically (tenants has no INSERT RLS).
--   • set_subscription() — SECURITY DEFINER; flips the CURRENT tenant's status
--     (the JWT claim bounds it). The payment provider (or the stub) calls this.
--
-- `plan` (free|paid) is the billing tier, distinct from `edition` (the
-- institutional class). Downloads are gated on subscription_status='active'.

alter table dispatch.tenants
  add column if not exists plan                text    not null default 'free'
        check (plan in ('free','paid')),
  add column if not exists subscription_status text    not null default 'inactive'
        check (subscription_status in ('inactive','active','past_due','canceled')),
  add column if not exists subscription_ref    text,                       -- external billing id (e.g. Stripe sub)
  add column if not exists doc_quota           int     not null default 3; -- free-tier create cap

-- ---- self-serve signup -----------------------------------------------------
-- Creates a FREE tenant and its first owner credential in one privileged step.
-- The app generates client_id + a scrypt secret hash and passes them in; the raw
-- secret never reaches the database. Returns the new tenant + client_id.
create or replace function dispatch.signup_tenant(
  p_name text, p_slug text, p_client_id text, p_secret_hash text, p_scopes text[]
) returns table (tenant_id uuid, client_id text)
language plpgsql security definer set search_path = dispatch as $$
declare tid uuid;
begin
  insert into dispatch.tenants (slug, name, plan, subscription_status)
    values (p_slug, p_name, 'free', 'inactive')
    returning id into tid;
  insert into dispatch.service_clients (tenant_id, name, client_id, secret_hash, scopes, created_by)
    values (tid, 'Owner', p_client_id, p_secret_hash, p_scopes, 'signup');
  insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
    values (tid, 'signup', 'system', 'tenant.signup', 'tenant', tid);
  return query select tid, p_client_id;
end $$;

-- ---- subscription state change --------------------------------------------
-- Flips ONLY the caller's own tenant (dispatch.current_tenant() from the JWT),
-- so a principal can never change another tenant's billing. Sets plan to match.
create or replace function dispatch.set_subscription(p_status text, p_ref text)
returns void
language plpgsql security definer set search_path = dispatch as $$
declare tid uuid := dispatch.current_tenant();
begin
  if tid is null then raise exception 'no tenant in context'; end if;
  update dispatch.tenants
     set subscription_status = p_status,
         plan = case when p_status = 'active' then 'paid' else 'free' end,
         subscription_ref = coalesce(p_ref, subscription_ref),
         updated_at = now()
   where id = tid;
  insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
    values (tid, 'billing', 'system', 'subscription.' || p_status, 'tenant', tid);
end $$;

grant execute on function dispatch.signup_tenant(text,text,text,text,text[]) to dispatch_app;
grant execute on function dispatch.set_subscription(text,text) to dispatch_app;
