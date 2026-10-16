-- M26 — The Evaluation is 30 days and 10 records; a subscription names its plan.
--
--   • doc_quota: the free Evaluation creates up to 10 records (was 3). Existing free tenants still on the
--     old default move to 10.
--   • trial_ends_at: the Evaluation lasts 30 days. New tenants get 30 days from sign-up (column default);
--     tenants that exist when this migration runs get 30 days from now, so no evaluation ends abruptly.
--     The API refuses new records once the date has passed, whichever limit comes first.
--   • tier: the paid plan a subscription is for — the plans on the pricing page. `plan` stays free|paid
--     (it chooses the EVAL- or SD- record namespace, M25); `tier` says which paid plan.
--   • requested_tier / requested_at: a plan the institution asked for that is not yet paid for. A request
--     never activates anything; only set_subscription_tier (the payment provider, or the API's stub when it
--     is explicitly enabled) does.

alter table dispatch.tenants
  alter column doc_quota set default 10,
  add column if not exists trial_ends_at  timestamptz default (now() + interval '30 days'),
  add column if not exists tier           text check (tier in ('institutional','institutional_plus','enterprise','sovereign')),
  add column if not exists requested_tier text check (requested_tier in ('institutional','institutional_plus','enterprise','sovereign')),
  add column if not exists requested_at   timestamptz;

update dispatch.tenants set doc_quota = 10 where plan = 'free' and doc_quota = 3;

-- ---- ask for a plan (no activation) ------------------------------------------
-- Records the CURRENT tenant's request (the JWT claim bounds it) and audits it.
create or replace function dispatch.request_plan(p_tier text)
returns void
language plpgsql security definer set search_path = dispatch as $$
declare tid uuid := dispatch.current_tenant();
begin
  if tid is null then raise exception 'no tenant in context'; end if;
  if p_tier not in ('institutional','institutional_plus','enterprise','sovereign') then raise exception 'unknown plan %', p_tier; end if;
  update dispatch.tenants set requested_tier = p_tier, requested_at = now(), updated_at = now() where id = tid;
  insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
    values (tid, 'billing', 'system', 'subscription.requested.' || p_tier, 'tenant', tid);
end $$;

-- ---- subscription state change, with its plan ------------------------------------
-- As set_subscription (M10), and records which paid plan is active. Flips ONLY the caller's own tenant.
create or replace function dispatch.set_subscription_tier(p_status text, p_ref text, p_tier text)
returns void
language plpgsql security definer set search_path = dispatch as $$
declare tid uuid := dispatch.current_tenant();
begin
  if tid is null then raise exception 'no tenant in context'; end if;
  if p_tier not in ('institutional','institutional_plus','enterprise','sovereign') then raise exception 'unknown plan %', p_tier; end if;
  update dispatch.tenants
     set subscription_status = p_status,
         plan = case when p_status = 'active' then 'paid' else 'free' end,
         tier = case when p_status = 'active' then p_tier else tier end,
         requested_tier = case when p_status = 'active' then null else requested_tier end,
         subscription_ref = coalesce(p_ref, subscription_ref),
         updated_at = now()
   where id = tid;
  insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
    values (tid, 'billing', 'system', 'subscription.' || p_status || '.' || p_tier, 'tenant', tid);
end $$;

grant execute on function dispatch.request_plan(text) to dispatch_app;
grant execute on function dispatch.set_subscription_tier(text,text,text) to dispatch_app;
