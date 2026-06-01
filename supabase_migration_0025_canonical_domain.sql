-- Sovereign canonical domain migration.
--
-- The platform's registered apex domain is now sovereigndo.com (the
-- prior 'sovereign.so' references were placeholder). This migration
-- sweeps live data so the marketplace, ecosystem and any rendered
-- product URLs point at the registered domain.
--
-- Scope: ecosystem_products.url + tagline + description.
-- Idempotent: replace() is a no-op when the pattern is absent.

update public.ecosystem_products
   set url         = replace(url,         'sovereign.so', 'sovereigndo.com'),
       tagline     = replace(tagline,     'sovereign.so', 'sovereigndo.com'),
       description = replace(description, 'sovereign.so', 'sovereigndo.com'),
       updated_at  = now()
 where url         ilike '%sovereign.so%'
    or tagline     ilike '%sovereign.so%'
    or description ilike '%sovereign.so%';
