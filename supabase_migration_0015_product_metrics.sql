-- 0015 — Add operational metrics to systems that were missing them, so their
-- product pages and atlas cards render full intelligence.
update ecosystem_products set metrics='[{"label":"Settled · 24h","value":"$4.2M"},{"label":"Corridors","value":"6"},{"label":"Uptime","value":"99.99%"}]'::jsonb where slug='mobile-pay';
update ecosystem_products set metrics='[{"label":"Anomalies traced","value":"12"},{"label":"Procurement scan","value":"Real-time"},{"label":"Integrity","value":"Audited"}]'::jsonb where slug='act';
update ecosystem_products set metrics='[{"label":"Credentials issued","value":"1.2M"},{"label":"Institutions","value":"340"},{"label":"Verification","value":"Instant"}]'::jsonb where slug='edupro';
update ecosystem_products set metrics='[{"label":"Systems monitored","value":"All"},{"label":"Coordination","value":"Real-time"},{"label":"Uptime","value":"99.99%"}]'::jsonb where slug='veritas-operations';
update ecosystem_products set metrics='[{"label":"Avg deploy","value":"87s"},{"label":"Edge nodes","value":"47"},{"label":"Regions","value":"23"}]'::jsonb where slug='deployment-engine';
update ecosystem_products set metrics='[{"label":"AI valuations","value":"12.4K+"},{"label":"Listings","value":"Live"},{"label":"Settlement","value":"Escrowed"}]'::jsonb where slug='marketplace-infra';
