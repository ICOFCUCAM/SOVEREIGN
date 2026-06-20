-- Plan ranking so studios can require a minimum tier. Used by the generation
-- functions (service role) to gate Professional+ studios server-side.
create or replace function polished.plan_rank(p_plan text) returns int language sql immutable as $$
  select case p_plan
    when 'creator' then 1
    when 'professional' then 2
    when 'pro' then 2
    when 'publisher' then 3
    when 'business' then 4
    when 'school' then 5
    when 'enterprise' then 6
    else 0 end;
$$;

create or replace function public.polished_plan_allows(p_user_id uuid, p_min_plan text)
returns boolean language sql security definer set search_path = public, polished as $$
  select polished.plan_rank(coalesce((select plan from polished.entitlements where user_id = p_user_id), 'free'))
       >= polished.plan_rank(p_min_plan);
$$;

revoke all on function public.polished_plan_allows(uuid, text) from public, anon;
grant execute on function public.polished_plan_allows(uuid, text) to service_role;
