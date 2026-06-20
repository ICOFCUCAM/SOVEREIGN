-- Purchasable image-credit packs: a persistent bonus balance that image
-- generation draws on AFTER the monthly pool is spent. Granted by the Stripe
-- webhook on a successful one-time pack purchase.
alter table polished.entitlements add column if not exists bonus_images int not null default 0;

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
    v_limit := case when v_plan = 'pro' then 300 else 10 end;
    select images into v_used from polished.usage_counters where user_id = p_user_id and period = v_period for update;
    v_used := coalesce(v_used, 0);
    if v_used < v_limit then
      update polished.usage_counters set images = images + 1 where user_id = p_user_id and period = v_period;
      return query select true, v_plan, v_used + 1, v_limit; return;
    elsif coalesce(v_bonus, 0) > 0 then
      update polished.entitlements set bonus_images = bonus_images - 1, updated_at = now() where user_id = p_user_id;
      return query select true, v_plan, v_limit, v_limit; return; -- monthly maxed; a purchased credit covered it
    else
      return query select false, v_plan, v_used, v_limit; return;
    end if;
  else
    v_limit := case when v_plan = 'pro' then 2147483647 else 15 end;
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
  return query select v_plan,
    v_used, case when v_plan='pro' then 2147483647 else 15 end,
    v_img,  case when v_plan='pro' then 300 else 10 end,
    coalesce(v_bonus, 0);
end; $$;

create or replace function public.polished_grant_image_credits(p_user_id uuid, p_n int)
returns int language plpgsql security definer set search_path = public, polished as $$
declare v_bal int;
begin
  if coalesce(p_n, 0) <= 0 then raise exception 'invalid credit amount'; end if;
  insert into polished.entitlements(user_id) values (p_user_id) on conflict (user_id) do nothing;
  update polished.entitlements set bonus_images = bonus_images + p_n, updated_at = now()
    where user_id = p_user_id returning bonus_images into v_bal;
  return v_bal;
end; $$;

revoke all on function public.polished_consume_generation(uuid, text) from public, anon;
revoke all on function public.polished_grant_image_credits(uuid, int) from public, anon;
grant execute on function public.polished_consume_generation(uuid, text) to service_role;
grant execute on function public.polished_grant_image_credits(uuid, int) to service_role;
grant execute on function public.polished_my_status() to authenticated;
