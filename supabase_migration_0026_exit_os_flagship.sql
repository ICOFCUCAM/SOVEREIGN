-- Register ExitOS as a Sovereign flagship.
--
-- ExitOS is the founder-acquisition operating system. Ten modules:
-- acquisition intelligence, virtual data room, buyer marketplace,
-- investor CRM, AI deal negotiator, document generator, NDA automation,
-- acquisition pipeline, founder dashboard, deal closing center.
--
-- Subdomain: exit.sovereigndo.com
-- Console: services/exit-web

insert into public.ecosystem_products (
  slug, name, category, tagline, description,
  accent, status, is_featured, sort_order, url,
  capabilities, metrics
) values (
  'exit-os',
  'ExitOS',
  'Founder Acquisition Infrastructure',
  'The operating system founders interact with to run an exit — from sourcing to closed deal, on one console.',
  'ExitOS is the substrate founders run an exit on. Acquisition intelligence, virtual data room, buyer marketplace, investor CRM, AI deal negotiator, document generator, NDA automation, acquisition pipeline, founder dashboard and the closing center — one console, one audit trail, one source of truth.',
  '#10b981',
  'deployable',
  true,
  9,
  'https://exit.sovereigndo.com',
  '[
    "Acquisition Intelligence Engine — buyer ranking and appetite signals",
    "Virtual Data Room — watermarked, audit-trail per artifact",
    "Buyer Marketplace — curated strategic + financial mandates",
    "Investor CRM — cap-table-aware stakeholder graph",
    "AI Deal Negotiator — playbook-driven counters under founder reservation lines",
    "Document Generator — term sheets, LOIs, SPAs, disclosure schedules, side letters",
    "NDA Automation — bilateral + one-way, breach and revocation tracked",
    "Acquisition Pipeline — sourcing → engaged → diligence → LOI → signed → closed",
    "Founder Dashboard — one screen the founder opens at 8am",
    "Deal Closing Center — signature, escrow, regulatory filings, share-transfer mechanics"
  ]'::jsonb,
  '[
    {"label": "Modules",                          "value": "10"},
    {"label": "Estimated Infrastructure Value",   "value": "$4M–$8M"},
    {"label": "Status",                           "value": "Deployable"},
    {"label": "Operational posture",              "value": "Sovereign-grade"}
  ]'::jsonb
)
on conflict (slug) do update set
  name         = excluded.name,
  category     = excluded.category,
  tagline      = excluded.tagline,
  description  = excluded.description,
  accent       = excluded.accent,
  status       = excluded.status,
  is_featured  = excluded.is_featured,
  sort_order   = excluded.sort_order,
  url          = excluded.url,
  capabilities = excluded.capabilities,
  metrics      = excluded.metrics,
  updated_at   = now();
