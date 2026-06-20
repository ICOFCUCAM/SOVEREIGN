-- Expand from free/pro to the full plan ladder. Text stays unlimited on every
-- paid tier; image credits scale per tier (the real cost lever). 'pro' is kept
-- as a legacy alias mapping to Professional-level limits.
alter table polished.entitlements drop constraint if exists entitlements_plan_check;
alter table polished.entitlements add constraint entitlements_plan_check
  check (plan in ('free','creator','professional','publisher','business','pro'));

create or replace function polished.plan_image_limit(p_plan text) returns int language sql immutable as $$
  select case p_plan
    when 'creator'      then 250
    when 'professional' then 800
    when 'pro'          then 800
    when 'publisher'    then 1500
    when 'business'     then 4000
    else 15 end;
$$;

create or replace function polished.plan_text_limit(p_plan text) returns int language sql immutable as $$
  select case when coalesce(p_plan,'free') = 'free' then 20 else 2147483647 end;
$$;

create or replace function public.polished_consume_generation(p_user_id uuid, p_kind text default 'text')
returns table (allowed boolean, plan text, used int, lim int)
language plpgsql security definer set search_path = public, polished as $$
declare
  v_plan text;
  v_period text := to_char(now(), 'YYYY-MM');
  v_used int; v_limit int; v_bonus int;
  v_is_image boolean := (p_kind = 'image');
begin
  insert into polished.entitlements(user_id) values (p_user_id) on conflict (user_id) do nothing;
  select e.plan, e.bonus_images into v_plan, v_bonus from polished.entitlements e where e.user_id = p_user_id for update;
  insert into polished.usage_counters(user_id, period) values (p_user_id, v_period) on conflict (user_id, period) do nothing;

  if v_is_image then
    v_limit := polished.plan_image_limit(v_plan);
    select images into v_used from polished.usage_counters where user_id = p_user_id and period = v_period for update;
    v_used := coalesce(v_used, 0);
    if v_used < v_limit then
      update polished.usage_counters set images = images + 1 where user_id = p_user_id and period = v_period;
      return query select true, v_plan, v_used + 1, v_limit; return;
    elsif coalesce(v_bonus, 0) > 0 then
      update polished.entitlements set bonus_images = bonus_images - 1, updated_at = now() where user_id = p_user_id;
      return query select true, v_plan, v_limit, v_limit; return;
    else
      return query select false, v_plan, v_used, v_limit; return;
    end if;
  else
    v_limit := polished.plan_text_limit(v_plan);
    select generations into v_used from polished.usage_counters where user_id = p_user_id and period = v_period for update;
    v_used := coalesce(v_used, 0);
    if v_used >= v_limit then
      return query select false, v_plan, v_used, v_limit; return;
    end if;
    update polished.usage_counters set generations = generations + 1 where user_id = p_user_id and period = v_period;
    return query select true, v_plan, v_used + 1, v_limit; return;
  end if;
end; $$;

drop function if exists public.polished_my_status();
create or replace function public.polished_my_status()
returns table (plan text, used int, lim int, images_used int, images_lim int, bonus_images int)
language plpgsql security definer set search_path = public, polished as $$
declare
  v_uid uuid := auth.uid();
  v_plan text; v_period text := to_char(now(), 'YYYY-MM');
  v_used int; v_img int; v_bonus int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into polished.entitlements(user_id) values (v_uid) on conflict (user_id) do nothing;
  select e.plan, e.bonus_images into v_plan, v_bonus from polished.entitlements e where e.user_id = v_uid;
  select coalesce(generations,0), coalesce(images,0) into v_used, v_img
    from polished.usage_counters where user_id = v_uid and period = v_period;
  v_used := coalesce(v_used,0); v_img := coalesce(v_img,0);
  return query select v_plan, v_used, polished.plan_text_limit(v_plan),
    v_img, polished.plan_image_limit(v_plan), coalesce(v_bonus, 0);
end; $$;

create or replace function public.polished_apply_subscription(p_user_id uuid, p_plan text, p_customer text, p_subscription text)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if p_plan not in ('free','creator','professional','publisher','business','pro') then
    raise exception 'invalid plan %', p_plan;
  end if;
  insert into polished.entitlements(user_id, plan, stripe_customer_id, stripe_subscription_id, updated_at)
    values (p_user_id, p_plan, p_customer, p_subscription, now())
  on conflict (user_id) do update set
    plan                   = excluded.plan,
    stripe_customer_id     = coalesce(excluded.stripe_customer_id, polished.entitlements.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, polished.entitlements.stripe_subscription_id),
    updated_at             = now();
end; $$;

create or replace function public.polished_publish(p_id uuid, p_listed boolean, p_category text, p_price_cents integer, p_author text default null, p_license text default null)
returns text language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_token uuid; v_plan text; v_price int := greatest(0, coalesce(p_price_cents, 0));
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_listed and v_price > 0 then
    select plan into v_plan from polished.entitlements where user_id = v_uid;
    if coalesce(v_plan, 'free') = 'free' then
      raise exception 'Listing paid items requires a paid plan (commercial rights). Upgrade to sell on the marketplace.';
    end if;
  end if;
  if p_listed then
    update polished.documents set
      listed = true, shared = true, share_token = coalesce(share_token, gen_random_uuid()),
      category = nullif(btrim(p_category), ''), price_cents = v_price,
      author_name = nullif(btrim(p_author), ''), license = nullif(btrim(p_license), ''), updated_at = now()
      where id = p_id and user_id = v_uid;
  else
    update polished.documents set listed = false, updated_at = now() where id = p_id and user_id = v_uid;
  end if;
  select share_token into v_token from polished.documents where id = p_id and user_id = v_uid;
  return v_token::text;
end; $$;

revoke all on function public.polished_consume_generation(uuid, text) from public, anon;
grant execute on function public.polished_consume_generation(uuid, text) to service_role;
grant execute on function public.polished_my_status() to authenticated;
