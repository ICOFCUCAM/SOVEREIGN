-- 0013 — CIVICOS sovereign acquisition tiers.
-- Adds a tiers column and populates CIVICOS deployment tiers (Core -> Prime)
-- and per-ministry tier pricing, so the marketplace can present sovereign
-- capability acquisition rather than flat domain listings.

alter table ecosystem_products add column if not exists tiers jsonb default '[]'::jsonb;

update ecosystem_products set tiers='[
 {"tier":"Core","price":"$8M","label":"Foundational Government Stack","scope":"Foundational","timeline":"3–6 months"},
 {"tier":"Professional","price":"$35M","label":"National Operational Runtime","scope":"National Operations","timeline":"6–14 months"},
 {"tier":"Elite","price":"$120M","label":"Sovereign Execution Infrastructure","scope":"Whole-of-Government","timeline":"12–24 months"},
 {"tier":"Strategic","price":"$500M","label":"National Digital Twin Infrastructure","scope":"National Strategic Runtime","timeline":"24–48 months"},
 {"tier":"Prime","price":"$1B+","label":"Civilization Operating Infrastructure","scope":"Civilization Scale","timeline":"Multi-Year"}
]'::jsonb where slug='civicos';

update ecosystem_products set tiers='[{"tier":"Core","price":"$5M"},{"tier":"Professional","price":"$15M"},{"tier":"Elite","price":"$40M"},{"tier":"Strategic","price":"$80M+"}]'::jsonb where slug='civicos-health';
update ecosystem_products set tiers='[{"tier":"Core","price":"$5M"},{"tier":"Professional","price":"$12M"},{"tier":"Elite","price":"$30M"},{"tier":"Strategic","price":"$70M+"}]'::jsonb where slug='civicos-justice';
update ecosystem_products set tiers='[{"tier":"Core","price":"$8M"},{"tier":"Professional","price":"$20M"},{"tier":"Elite","price":"$50M"},{"tier":"Strategic","price":"$120M+"}]'::jsonb where slug='civicos-treasury';
update ecosystem_products set tiers='[{"tier":"Core","price":"$5M"},{"tier":"Professional","price":"$15M"},{"tier":"Elite","price":"$35M"},{"tier":"Strategic","price":"$60M+"}]'::jsonb where slug='civicos-education';
update ecosystem_products set tiers='[{"tier":"Core","price":"$8M"},{"tier":"Professional","price":"$18M"},{"tier":"Elite","price":"$45M"},{"tier":"Strategic","price":"$100M+"}]'::jsonb where slug='civicos-transport';
update ecosystem_products set tiers='[{"tier":"Core","price":"$10M"},{"tier":"Professional","price":"$25M"},{"tier":"Elite","price":"$70M"},{"tier":"Strategic","price":"$200M+"}]'::jsonb where slug='civicos-emergency';
update ecosystem_products set tiers='[{"tier":"Professional","price":"$30M"},{"tier":"Elite","price":"$100M"},{"tier":"Strategic","price":"$300M+"}]'::jsonb where slug='civicos-coordination-engine';
update ecosystem_products set tiers='[{"tier":"Core","price":"$10M"},{"tier":"Professional","price":"$25M"},{"tier":"Elite","price":"$80M"},{"tier":"Strategic","price":"$250M+"}]'::jsonb where slug='civicos-anti-corruption';
update ecosystem_products set tiers='[{"tier":"Core","price":"$8M"},{"tier":"Professional","price":"$20M"},{"tier":"Elite","price":"$60M"},{"tier":"Strategic","price":"$180M+"}]'::jsonb where slug='civicos-police';
