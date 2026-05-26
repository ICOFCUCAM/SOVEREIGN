-- 0017 — Deepen content for operationally thin systems.
update ecosystem_products set
  description='The operations command layer — unified monitoring, incident orchestration and cross-system coordination across the sovereign ecosystem in real time.',
  capabilities='["Unified system monitoring","Incident orchestration","Cross-system coordination","Real-time operational telemetry","Automated response runbooks","Operational governance"]'::jsonb
where slug='veritas-operations';
