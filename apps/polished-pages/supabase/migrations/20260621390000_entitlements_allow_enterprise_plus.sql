-- Allow the enterprise-plus plan value in the entitlements check constraint.
alter table polished.entitlements drop constraint if exists entitlements_plan_check;
alter table polished.entitlements add constraint entitlements_plan_check
  check (plan = any (array['free','creator','professional','pro','publisher','business','school','enterprise','enterprise-plus']));
