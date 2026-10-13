-- Temporary, live project only: hides the deployment-verification test listing (id prefix zz-isotest-)
-- from the marketplace until the verification rows are deleted (deletion needs the owner's confirmation).
-- Restore once they are gone:
--   alter policy exitos_listings_read on public.exitos_listings using (true);
alter policy exitos_listings_read on public.exitos_listings using (id not like 'zz-isotest-%');
