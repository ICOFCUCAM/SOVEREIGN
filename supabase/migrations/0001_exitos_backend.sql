-- ExitOS backend — the first production schema behind ExitApiClient.
-- Tables are namespaced exitos_* to sit cleanly alongside the existing
-- exit_* schema in this project. Every table is { id, <filter columns…>,
-- data jsonb, created_at }: the full typed record lives in `data`, scalar
-- columns exist to filter and to drive row-level security. SupabaseExitApi
-- reads/writes exactly these tables.
--
-- Multi-tenancy is RLS. The policies below assume an account's id equals its
-- Supabase Auth user id (auth.uid()) — that alignment is the auth task.
-- Shared surfaces (the listings pool, deal events) are readable by any
-- authenticated user so the two-sided exchange works; writes are scoped.

-- ── accounts ────────────────────────────────────────────────────────
create table if not exists public.exitos_accounts (
  id          text primary key,
  role        text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.exitos_accounts enable row level security;
drop policy if exists exitos_accounts_self_read  on public.exitos_accounts;
drop policy if exists exitos_accounts_self_write on public.exitos_accounts;
drop policy if exists exitos_accounts_self_upd   on public.exitos_accounts;
create policy exitos_accounts_self_read  on public.exitos_accounts for select to authenticated using (id = auth.uid()::text);
create policy exitos_accounts_self_write on public.exitos_accounts for insert to authenticated with check (id = auth.uid()::text);
create policy exitos_accounts_self_upd   on public.exitos_accounts for update to authenticated using (id = auth.uid()::text);

-- ── organizations ───────────────────────────────────────────────────
create table if not exists public.exitos_organizations (
  id                text primary key,
  owner_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
alter table public.exitos_organizations enable row level security;
drop policy if exists exitos_orgs_read  on public.exitos_organizations;
drop policy if exists exitos_orgs_owner on public.exitos_organizations;
create policy exitos_orgs_read  on public.exitos_organizations for select to authenticated using (true);
create policy exitos_orgs_owner on public.exitos_organizations for all   to authenticated using (owner_account_id = auth.uid()::text) with check (owner_account_id = auth.uid()::text);

-- ── listings (the shared marketplace pool) ──────────────────────────
create table if not exists public.exitos_listings (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.exitos_listings enable row level security;
drop policy if exists exitos_listings_read  on public.exitos_listings;
drop policy if exists exitos_listings_write on public.exitos_listings;
create policy exitos_listings_read  on public.exitos_listings for select to authenticated using (true);
create policy exitos_listings_write on public.exitos_listings for all   to authenticated using (true) with check (true);

-- ── deal events (telemetry — the behavioral moat) ───────────────────
create table if not exists public.exitos_deal_events (
  id          text primary key,
  account_id  text not null,
  subject_id  text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists exitos_deal_events_subject_idx on public.exitos_deal_events (subject_id);
create index if not exists exitos_deal_events_account_idx on public.exitos_deal_events (account_id);
alter table public.exitos_deal_events enable row level security;
drop policy if exists exitos_events_read  on public.exitos_deal_events;
drop policy if exists exitos_events_write on public.exitos_deal_events;
drop policy if exists exitos_events_del   on public.exitos_deal_events;
create policy exitos_events_read  on public.exitos_deal_events for select to authenticated using (true);
create policy exitos_events_write on public.exitos_deal_events for insert to authenticated with check (account_id = auth.uid()::text);
create policy exitos_events_del   on public.exitos_deal_events for delete to authenticated using (account_id = auth.uid()::text);

-- ── NDA requests ────────────────────────────────────────────────────
create table if not exists public.exitos_nda_requests (
  id                text primary key,
  listing_id        text not null,
  buyer_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
create index if not exists exitos_nda_listing_idx on public.exitos_nda_requests (listing_id);
alter table public.exitos_nda_requests enable row level security;
drop policy if exists exitos_nda_read  on public.exitos_nda_requests;
drop policy if exists exitos_nda_write on public.exitos_nda_requests;
create policy exitos_nda_read  on public.exitos_nda_requests for select to authenticated using (true);
create policy exitos_nda_write on public.exitos_nda_requests for all    to authenticated using (true) with check (true);

-- ── offers ──────────────────────────────────────────────────────────
create table if not exists public.exitos_offers (
  id                text primary key,
  listing_id        text not null,
  buyer_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
create index if not exists exitos_offers_listing_idx on public.exitos_offers (listing_id);
alter table public.exitos_offers enable row level security;
drop policy if exists exitos_offers_read  on public.exitos_offers;
drop policy if exists exitos_offers_write on public.exitos_offers;
create policy exitos_offers_read  on public.exitos_offers for select to authenticated using (true);
create policy exitos_offers_write on public.exitos_offers for all    to authenticated using (true) with check (true);

-- ── documents (audit trail rides on deal_events) ────────────────────
create table if not exists public.exitos_documents (
  id          text primary key,
  listing_id  text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists exitos_documents_listing_idx on public.exitos_documents (listing_id);
alter table public.exitos_documents enable row level security;
drop policy if exists exitos_docs_read  on public.exitos_documents;
drop policy if exists exitos_docs_write on public.exitos_documents;
create policy exitos_docs_read  on public.exitos_documents for select to authenticated using (true);
create policy exitos_docs_write on public.exitos_documents for all    to authenticated using (true) with check (true);

-- ── notifications (per recipient) ───────────────────────────────────
create table if not exists public.exitos_notifications (
  id          text primary key,
  account_id  text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists exitos_notifications_account_idx on public.exitos_notifications (account_id);
alter table public.exitos_notifications enable row level security;
drop policy if exists exitos_ntf_read  on public.exitos_notifications;
drop policy if exists exitos_ntf_write on public.exitos_notifications;
create policy exitos_ntf_read  on public.exitos_notifications for select to authenticated using (account_id = auth.uid()::text);
create policy exitos_ntf_write on public.exitos_notifications for all    to authenticated using (account_id = auth.uid()::text) with check (account_id = auth.uid()::text);
