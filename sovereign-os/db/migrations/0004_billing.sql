-- Sovereign OS — billing / plan management.
-- api_clients.plan already exists (0003); add billing linkage + an audit of plan changes.

alter table public.api_clients
  add column if not exists stripe_customer_id text,
  add column if not exists plan_renews_at timestamptz;

create index if not exists api_clients_stripe_idx on public.api_clients (stripe_customer_id);

-- Audit trail of plan transitions (from billing webhooks or admin actions).
create table if not exists public.plan_events (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.api_clients(id) on delete cascade,
  event      text not null,          -- e.g. subscription.created | subscription.updated | subscription.deleted
  plan       text,                   -- resulting plan
  source     text not null default 'stripe',
  raw        jsonb,
  at         timestamptz not null default now()
);
create index if not exists plan_events_client_idx on public.plan_events (client_id, at);
