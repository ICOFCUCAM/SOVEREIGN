-- 0017 — Deepen content for operationally thin systems.
update ecosystem_products set
  description='The operations command layer — unified monitoring, incident orchestration and cross-system coordination across the sovereign ecosystem in real time.',
  capabilities='["Unified system monitoring","Incident orchestration","Cross-system coordination","Real-time operational telemetry","Automated response runbooks","Operational governance"]'::jsonb
where slug='veritas-operations';
update ecosystem_products set
  description='Sovereign provisioning infrastructure — from acquisition to live institution across a global edge mesh, with DNS orchestration, sovereign data residency and AI provisioning in seconds.',
  capabilities='["DNS orchestration","Sovereign data residency","AI provisioning","Global edge deployment","CI/CD pipelines","Rollback & governance"]'::jsonb
where slug='deployment-engine';
