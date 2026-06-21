-- Align the entitlements plan check with the plan_rank / plan_*_limit functions.
-- Those functions already define the 'school' and 'enterprise' tiers (ranks 5
-- and 6, with their own image limits), but entitlements_plan_check was left
-- behind them and still rejected those values — so a top-tier grant or a
-- school/enterprise subscription could not be written to the table.
--
-- Widen the constraint to match the functions. This only *adds* allowed values;
-- no existing row is affected.

alter table polished.entitlements drop constraint if exists entitlements_plan_check;

alter table polished.entitlements add constraint entitlements_plan_check
  check (plan = any (array[
    'free'::text, 'creator'::text, 'professional'::text, 'pro'::text,
    'publisher'::text, 'business'::text, 'school'::text, 'enterprise'::text
  ]));
