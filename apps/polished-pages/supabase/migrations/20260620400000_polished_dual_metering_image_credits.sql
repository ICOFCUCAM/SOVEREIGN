-- Phase A pricing: meter text and image generations separately. Text stays
-- generous (free 15 / pro unlimited); images run on a credit pool (free 10 /
-- pro 300) because each image is a real gpt-image-1 cost. Paid marketplace
-- listings require Pro (commercial rights).
alter table polished.usage_counters add column if not exists images int not null default 0;

drop function if exists public.polished_consume_generation(uuid);
create or replace function public.polished_consume_generation(p_user_id uuid, p_kind text default 'text')
returns table (allowed boolean, plan text, used int, lim int)
language plpgsql security definer set search_path = public, polished as $$
declare
  v_plan text;
  v_period text := to_char(now(), 'YYYY-MM');
  v_used int; v_limit int;
  v_is_image boolean := (p_kind = 'image');
begin
  insert into polished.entitlements(user_id) values (p_user_id) on conflict (user_id) do nothing;
  select e.plan into v_plan from polished.entitlements e where e.user_id = p_user_id;
  insert into polished.usage_counters(user_id, period) values (p_user_id, v_period) on conflict (user_id, period) do nothing;

  if v_is_image then
    v_limit := case when v_plan = 'pro' then 300 else 10 end;
    select images into v_used from polished.usage_counters where user_id = p_user_id and period = v_period for update;
  else
    v_limit := case when v_plan = 'pro' then 2147483647 else 15 end;
    select generations into v_used from polished.usage_counters where user_id = p_user_id and period = v_period for update;
  end if;
  v_used := coalesce(v_used, 0);

  if v_used >= v_limit then
    return query select false, v_plan, v_used, v_limit; return;
  end if;

  if v_is_image then
    update polished.usage_counters set images = images + 1 where user_id = p_user_id and period = v_period;
  else
    update polished.usage_counters set generations = generations + 1 where user_id = p_user_id and period = v_period;
  end if;
  return query select true, v_plan, v_used + 1, v_limit;
end; $$;

drop function if exists public.polished_my_status();
create or replace function public.polished_my_status()
returns table (plan text, used int, lim int, images_used int, images_lim int)
language plpgsql security definer set search_path = public, polished as $$
declare
  v_uid uuid := auth.uid();
  v_plan text; v_period text := to_char(now(), 'YYYY-MM');
  v_used int; v_img int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into polished.entitlements(user_id) values (v_uid) on conflict (user_id) do nothing;
  select e.plan into v_plan from polished.entitlements e where e.user_id = v_uid;
  select coalesce(generations,0), coalesce(images,0) into v_used, v_img
    from polished.usage_counters where user_id = v_uid and period = v_period;
  v_used := coalesce(v_used,0); v_img := coalesce(v_img,0);
  return query select v_plan,
    v_used, case when v_plan='pro' then 2147483647 else 15 end,
    v_img,  case when v_plan='pro' then 300 else 10 end;
end; $$;

create or replace function public.polished_publish(p_id uuid, p_listed boolean, p_category text, p_price_cents integer, p_author text default null, p_license text default null)
returns text language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_token uuid; v_plan text; v_price int := greatest(0, coalesce(p_price_cents, 0));
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_listed and v_price > 0 then
    select plan into v_plan from polished.entitlements where user_id = v_uid;
    if coalesce(v_plan, 'free') <> 'pro' then
      raise exception 'Listing paid items requires Pro (commercial rights). Upgrade to sell on the marketplace.';
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
