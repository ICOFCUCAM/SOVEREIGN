-- Add 'university' as an organization type (academic institutions / colleges).
alter table polished.organizations drop constraint if exists organizations_type_check;
alter table polished.organizations add constraint organizations_type_check
  check (type = any (array['publisher','school','ngo','ministry','company','university']));
