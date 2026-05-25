-- SOVEREIGN migration 0010 — FlyttGo global logistics marketplace profile
-- Applied to project qvjdivcdefuprnenedje (via execute_sql).
-- Updates the FlyttGo ecosystem system + its marketplace institution to the
-- acquisition brief: asset-light global logistics marketplace, 6 live markets
-- (US/Norway/Canada/UK/Germany/France) + 11 autonomous-launch queue,
-- subscription-driven driver ecosystem, $10,000,000 valuation.
UPDATE public.ecosystem_products SET
  name = 'FlyttGo', category = 'Global Logistics & Transport Marketplace',
  tagline = 'The global logistics & transport marketplace.',
  capabilities = '["Customer-to-driver job matching","Subscription-based driver ecosystem","Automated country-launch infrastructure","Real-time job distribution","Cross-border logistics","Multi-country operational architecture","Enterprise logistics integration","Marketplace monetization"]'::jsonb,
  metrics = '[{"label":"Live markets","value":"6"},{"label":"Auto-launch queue","value":"11"},{"label":"Valuation","value":"$10M"}]'::jsonb
WHERE slug = 'flyttgo';
UPDATE public.domains SET price_usd = 10000000, valuation_score = 93, is_featured = true
WHERE domain_name = 'flyttgo.no';
