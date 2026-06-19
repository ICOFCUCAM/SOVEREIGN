-- Polished Pages entitlement + metering, isolated in its own schema.
-- The shared generation engine (edge functions) calls polished_consume_generation
-- with the service role before producing a document; the frontend reads
-- polished_my_status to show the user their plan and remaining free quota.

create schema if not exists polished;

create table if not exists polished.entitlements (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  plan       text not null default 'free' check (plan in ('free','pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists polished.usage_counters (
  user_id     uuid not null references auth.users(id) on delete cascade,
  period      text not null,                 -- 'YYYY-MM'
  generations int  not null default 0,
  primary key (user_id, period)
);

alter table polished.entitlements   enable row level security;
alter table polished.usage_counters enable row level security;

drop policy if exists "own entitlement" on polished.entitlements;
create policy "own entitlement" on polished.entitlements for select using (auth.uid() = user_id);
drop policy if exists "own usage" on polished.usage_counters;
create policy "own usage" on polished.usage_counters for select using (auth.uid() = user_id);

create or replace function polished.free_limit() returns int language sql immutable as $$ select 5 $$;

-- Atomic check-and-increment, called by the engine with the service role.
create or replace function public.polished_consume_generation(p_user_id uuid)
returns table (allowed boolean, plan text, used int, lim int)
language plpgsql security definer set search_path = public, polished as $$
declare
  v_plan   text;
  v_period text := to_char(now(), 'YYYY-MM');
  v_used   int;
  v_limit  int;
begin
  insert into polished.entitlements(user_id) values (p_user_id) on conflict (user_id) do nothing;
  select e.plan into v_plan from polished.entitlements e where e.user_id = p_user_id;

  v_limit := case when v_plan = 'pro' then 2147483647 else polished.free_limit() end;

  insert into polished.usage_counters(user_id, period, generations)
    values (p_user_id, v_period, 0) on conflict (user_id, period) do nothing;
  select generations into v_used from polished.usage_counters
    where user_id = p_user_id and period = v_period for update;

  if v_used >= v_limit then
    return query select false, v_plan, v_used, v_limit; return;
  end if;

  update polished.usage_counters set generations = generations + 1
    where user_id = p_user_id and period = v_period;
  return query select true, v_plan, v_used + 1, v_limit;
end; $$;

-- Read-only status for the signed-in user (frontend badge / paywall state).
create or replace function public.polished_my_status()
returns table (plan text, used int, lim int)
language plpgsql security definer set search_path = public, polished as $$
declare
  v_uid    uuid := auth.uid();
  v_plan   text;
  v_period text := to_char(now(), 'YYYY-MM');
  v_used   int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into polished.entitlements(user_id) values (v_uid) on conflict (user_id) do nothing;
  select e.plan into v_plan from polished.entitlements e where e.user_id = v_uid;
  select coalesce(generations, 0) into v_used from polished.usage_counters
    where user_id = v_uid and period = v_period;
  v_used := coalesce(v_used, 0);
  return query select v_plan, v_used, case when v_plan = 'pro' then 2147483647 else polished.free_limit() end;
end; $$;

revoke all on function public.polished_consume_generation(uuid) from public, anon;
grant execute on function public.polished_consume_generation(uuid) to service_role;
grant execute on function public.polished_my_status() to authenticated;
