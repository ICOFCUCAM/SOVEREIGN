-- Security hardening: pin search_path on the pure helper functions (they
-- reference no objects, so an empty search_path is safe) to clear the
-- "function_search_path_mutable" advisory.
create or replace function polished.free_limit() returns int language sql immutable set search_path = '' as $$ select 5 $$;

create or replace function polished.plan_rank(p_plan text) returns int language sql immutable set search_path = '' as $$
  select case p_plan
    when 'creator' then 1 when 'professional' then 2 when 'pro' then 2
    when 'publisher' then 3 when 'business' then 4 when 'school' then 5
    when 'enterprise' then 6 else 0 end;
$$;

create or replace function polished.plan_image_limit(p_plan text) returns int language sql immutable set search_path = '' as $$
  select case p_plan
    when 'creator' then 250 when 'professional' then 800 when 'pro' then 800
    when 'publisher' then 1500 when 'business' then 4000 else 15 end;
$$;

create or replace function polished.plan_text_limit(p_plan text) returns int language sql immutable set search_path = '' as $$
  select case when coalesce(p_plan,'free') = 'free' then 20 else 2147483647 end;
$$;
