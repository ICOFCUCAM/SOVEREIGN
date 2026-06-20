-- Fix: school/enterprise had no case in plan_image_limit and fell through to
-- the free default of 15 images. These are custom-priced institutional tiers;
-- give them a high sentinel so metering never wrongly caps them. This is a
-- metering-correctness fix, not a billing or seat change.
CREATE OR REPLACE FUNCTION polished.plan_image_limit(p_plan text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case p_plan
    when 'creator' then 250 when 'professional' then 800 when 'pro' then 800
    when 'publisher' then 1500 when 'business' then 4000
    when 'school' then 100000 when 'enterprise' then 1000000
    else 15 end;
$function$;
