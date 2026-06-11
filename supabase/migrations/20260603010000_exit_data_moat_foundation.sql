-- ExitOS data moat foundation. Six tables capturing the telemetry the
-- Acquisition Intelligence Engine eventually calibrates against:
--   exit_tenants            — one row per company using ExitOS
--   exit_runs               — every One-Click Exit invocation
--   exit_run_steps          — per-step telemetry inside a run
--   exit_offer_events       — every offer the negotiator scores
--   exit_close_events       — terminal outcomes (close / walk away)
--   exit_telemetry_events   — generic catch-all event log
--
-- Auth model: RLS enabled on every table; only service-role bypasses.
-- Public ingestion happens via the exit-telemetry edge function which
-- authorizes at the function boundary, mirroring the existing data
-- room pattern (exit-doc-upload).
--
-- The exit_calibration view is the first analytical surface — it
-- JOINs predictions (exit_runs.valuation_mid_usd) against realized
-- outcomes (exit_close_events.final_price_usd) so the spread can be
-- aggregated by sector / buyer type / readiness band as transactions
-- accrue. Defended by security_invoker so RLS on the underlying
-- tables governs row visibility.

-- ── exit_tenants ───────────────────────────────────────────────────
create table if not exists public.exit_tenants (
  id              uuid primary key,
  company_name    text not null,
  company_sector  text not null,
  jurisdiction    text not null,
  founded_year    integer,
  arr_usd         numeric,
  profile_snapshot jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.exit_tenants is 'ExitOS multi-tenant root. One row per founder/company workspace.';

-- ── exit_runs ──────────────────────────────────────────────────────
create table if not exists public.exit_runs (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.exit_tenants(id) on delete cascade,
  client_run_id       text not null,
  status              text not null check (status in ('running','complete','errored')),
  started_at          timestamptz not null,
  finished_at         timestamptz,
  duration_ms         integer,
  steps_completed     integer not null default 0,
  steps_total         integer not null default 10,
  valuation_low_usd   numeric,
  valuation_mid_usd   numeric,
  valuation_high_usd  numeric,
  readiness_score     numeric,
  readiness_band      text,
  qualified_buyers    integer,
  buyers_by_type      jsonb,
  artifacts_summary   jsonb not null default '{}'::jsonb,
  app_version         text,
  created_at          timestamptz not null default now()
);
create index if not exists exit_runs_tenant_idx     on public.exit_runs (tenant_id, started_at desc);
create index if not exists exit_runs_client_run_idx on public.exit_runs (client_run_id);
comment on table public.exit_runs is 'One row per One-Click Exit invocation. Valuation snapshot is the prediction-side anchor of the predicted-vs-realized calibration model.';

-- ── exit_run_steps ─────────────────────────────────────────────────
create table if not exists public.exit_run_steps (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.exit_runs(id) on delete cascade,
  tenant_id     uuid not null references public.exit_tenants(id) on delete cascade,
  step_id       text not null,
  step_index    integer not null,
  status        text not null check (status in ('pending','running','done','error')),
  started_at    timestamptz,
  finished_at   timestamptz,
  duration_ms   integer,
  summary       text,
  error         text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists exit_run_steps_run_idx    on public.exit_run_steps (run_id, step_index);
create index if not exists exit_run_steps_tenant_idx on public.exit_run_steps (tenant_id, created_at desc);
comment on table public.exit_run_steps is 'Per-step telemetry inside a One-Click Exit run. Drives the duration / failure-rate analytics.';

-- ── exit_offer_events ──────────────────────────────────────────────
create table if not exists public.exit_offer_events (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.exit_tenants(id) on delete cascade,
  run_id                uuid references public.exit_runs(id) on delete set null,
  offer_id              text not null,
  buyer_name            text not null,
  buyer_type            text not null,
  stage                 text not null,
  occurred_at           timestamptz not null,
  headline_price_usd    numeric not null,
  cash_pct              numeric,
  stock_pct             numeric,
  earnout_pct           numeric,
  terms                 jsonb,
  evaluation_score      numeric,
  reservation_violated  boolean,
  net_npv_usd           numeric,
  metadata              jsonb,
  created_at            timestamptz not null default now()
);
create index if not exists exit_offer_events_tenant_idx on public.exit_offer_events (tenant_id, occurred_at desc);
create index if not exists exit_offer_events_buyer_idx  on public.exit_offer_events (buyer_name, occurred_at desc);
comment on table public.exit_offer_events is 'Every offer the negotiator sees. Stage transitions roll up into buyer response rates and win-rate-by-template analytics.';

-- ── exit_close_events ──────────────────────────────────────────────
create table if not exists public.exit_close_events (
  id                            uuid primary key default gen_random_uuid(),
  tenant_id                     uuid not null references public.exit_tenants(id) on delete cascade,
  run_id                        uuid references public.exit_runs(id) on delete set null,
  outcome                       text not null check (outcome in ('closed_strategic','closed_pe','closed_vc_secondary','closed_family_office','walked_away','expired','no_deal')),
  closed_at                     timestamptz not null,
  buyer_name                    text,
  buyer_type                    text,
  final_price_usd               numeric,
  final_cash_pct                numeric,
  final_stock_pct               numeric,
  final_earnout_pct             numeric,
  predicted_valuation_mid_usd   numeric,
  predicted_vs_realized_pct     numeric,
  days_from_run_start           integer,
  metadata                      jsonb,
  created_at                    timestamptz not null default now()
);
create index if not exists exit_close_events_tenant_idx on public.exit_close_events (tenant_id, closed_at desc);
create index if not exists exit_close_events_outcome_idx on public.exit_close_events (outcome, closed_at desc);
comment on table public.exit_close_events is 'Terminal outcomes. JOIN against exit_runs.valuation_mid_usd to compute the predicted-vs-realized spread that powers calibration.';

-- ── exit_telemetry_events ──────────────────────────────────────────
create table if not exists public.exit_telemetry_events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.exit_tenants(id) on delete cascade,
  event_type  text not null,
  occurred_at timestamptz not null default now(),
  session_id  text,
  page        text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists exit_telemetry_events_tenant_idx on public.exit_telemetry_events (tenant_id, occurred_at desc);
create index if not exists exit_telemetry_events_type_idx   on public.exit_telemetry_events (event_type, occurred_at desc);
comment on table public.exit_telemetry_events is 'Generic catch-all event log for client-side activity that does not warrant its own table.';

-- ── RLS — locked down. Edge functions use service-role and bypass. ─
alter table public.exit_tenants         enable row level security;
alter table public.exit_runs            enable row level security;
alter table public.exit_run_steps       enable row level security;
alter table public.exit_offer_events    enable row level security;
alter table public.exit_close_events    enable row level security;
alter table public.exit_telemetry_events enable row level security;

-- Default-deny: no policies created → anon/authenticated roles cannot
-- select or write. Ingestion goes through exit-telemetry edge fn which
-- authorizes by tenant_id at the function boundary.

-- ── Demo tenant seed ───────────────────────────────────────────────
insert into public.exit_tenants (id, company_name, company_sector, jurisdiction, founded_year, arr_usd, profile_snapshot)
values (
  '00000000-0000-0000-0000-000000000099',
  'Helios Freight',
  'logistics_freight',
  'US',
  2017,
  18000000,
  '{"businessModel":"logistics","note":"Demo tenant for ExitOS console"}'::jsonb
)
on conflict (id) do nothing;

-- ── Predicted-vs-realized calibration view ─────────────────────────
create or replace view public.exit_calibration as
  select
    r.tenant_id,
    r.id                                  as run_id,
    r.started_at                          as predicted_at,
    r.valuation_mid_usd                   as predicted_mid_usd,
    r.readiness_score,
    c.closed_at                           as realized_at,
    c.outcome,
    c.buyer_type,
    c.final_price_usd                     as realized_price_usd,
    c.predicted_vs_realized_pct,
    c.days_from_run_start
  from public.exit_runs r
  left join public.exit_close_events c on c.run_id = r.id
  where r.status = 'complete';

-- security_invoker pins the view to the caller's RLS context so the
-- underlying table policies govern row visibility.
alter view public.exit_calibration set (security_invoker = true);

comment on view public.exit_calibration is 'First analytical surface — predicted-vs-realized spread by tenant. Empty until close events accrue.';
