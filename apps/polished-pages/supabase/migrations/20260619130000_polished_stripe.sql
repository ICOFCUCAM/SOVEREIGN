-- Stripe linkage for Polished Pages entitlements. The webhook (service role)
-- calls polished_apply_subscription to flip a user between 'free' and 'pro'.

alter table polished.entitlements
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text;

create or replace function public.polished_apply_subscription(
  p_user_id uuid, p_plan text, p_customer text, p_subscription text
) returns void language plpgsql security definer set search_path = public, polished as $$
begin
  if p_plan not in ('free','pro') then raise exception 'invalid plan %', p_plan; end if;
  insert into polished.entitlements(user_id, plan, stripe_customer_id, stripe_subscription_id, updated_at)
    values (p_user_id, p_plan, p_customer, p_subscription, now())
  on conflict (user_id) do update set
    plan                   = excluded.plan,
    stripe_customer_id     = coalesce(excluded.stripe_customer_id, polished.entitlements.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, polished.entitlements.stripe_subscription_id),
    updated_at             = now();
end; $$;

revoke all on function public.polished_apply_subscription(uuid, text, text, text) from public, anon;
grant execute on function public.polished_apply_subscription(uuid, text, text, text) to service_role;
