-- Enterprise Plus: the top tier (rank 7, above Enterprise). Audiobooks, Wankong
-- distribution and institutional localization controls live here.
create or replace function polished.plan_rank(p_plan text)
returns integer language sql immutable set search_path to '' as $function$
  select case p_plan
    when 'creator' then 1 when 'professional' then 2 when 'pro' then 2
    when 'publisher' then 3 when 'business' then 4 when 'school' then 5
    when 'enterprise' then 6 when 'enterprise-plus' then 7 else 0 end;
$function$;

create or replace function polished.plan_image_limit(p_plan text)
returns integer language sql immutable set search_path to '' as $function$
  select case p_plan
    when 'creator' then 250 when 'professional' then 800 when 'pro' then 800
    when 'publisher' then 1500 when 'business' then 4000
    when 'school' then 100000 when 'enterprise' then 1000000
    when 'enterprise-plus' then 1000000
    else 15 end;
$function$;

create or replace function polished.localization_limit(p_plan text)
returns integer language sql immutable set search_path to '' as $function$
  select case p_plan
    when 'creator' then 1
    when 'professional' then 2 when 'pro' then 2
    when 'publisher' then 5
    when 'business' then 10
    when 'school' then -1
    when 'enterprise' then -1
    when 'enterprise-plus' then -1
    else 0 end;
$function$;
