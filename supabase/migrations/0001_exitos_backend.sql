-- ExitOS backend — the first production schema behind ExitApiClient.
-- Every table is { id, <filter columns…>, data jsonb, created_at }: the full
-- typed record lives in `data`, scalar columns exist to filter and to drive
-- row-level security. SupabaseExitApi reads/writes exactly these tables.
--
-- Multi-tenancy is RLS. The policies below assume an account's id equals its
-- Supabase Auth user id (auth.uid()) — that alignment is the Phase 6.1 auth
-- task. Shared surfaces (the listings pool, deal events) are readable by any
-- authenticated user so the two-sided exchange works; writes are scoped.

-- ── accounts ────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id          text primary key,
  role        text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.accounts enable row level security;
create policy accounts_self_read  on public.accounts for select to authenticated using (id = auth.uid()::text);
create policy accounts_self_write on public.accounts for insert to authenticated with check (id = auth.uid()::text);
create policy accounts_self_upd   on public.accounts for update to authenticated using (id = auth.uid()::text);

-- ── organizations ───────────────────────────────────────────────────
create table if not exists public.organizations (
  id                text primary key,
  owner_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
alter table public.organizations enable row level security;
create policy orgs_read  on public.organizations for select to authenticated using (true);
create policy orgs_owner on public.organizations for all   to authenticated using (owner_account_id = auth.uid()::text) with check (owner_account_id = auth.uid()::text);

-- ── listings (the shared marketplace pool) ──────────────────────────
create table if not exists public.listings (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
alter table public.listings enable row level security;
-- any authenticated buyer can browse the pool; founders write their listings
create policy listings_read  on public.listings for select to authenticated using (true);
create policy listings_write on public.listings for all   to authenticated using (true) with check (true);

-- ── deal events (telemetry — the behavioral moat) ───────────────────
create table if not exists public.deal_events (
  id          text primary key,
  account_id  text not null,
  subject_id  text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists deal_events_subject_idx on public.deal_events (subject_id);
create index if not exists deal_events_account_idx on public.deal_events (account_id);
alter table public.deal_events enable row level security;
-- readable by any authenticated user (a founder must see buyer interest on
-- their listing — cross-actor subject scan); an actor writes only their stream
create policy events_read  on public.deal_events for select to authenticated using (true);
create policy events_write on public.deal_events for insert to authenticated with check (account_id = auth.uid()::text);
create policy events_del   on public.deal_events for delete to authenticated using (account_id = auth.uid()::text);

-- ── NDA requests ────────────────────────────────────────────────────
create table if not exists public.nda_requests (
  id                text primary key,
  listing_id        text not null,
  buyer_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
create index if not exists nda_listing_idx on public.nda_requests (listing_id);
alter table public.nda_requests enable row level security;
create policy nda_read  on public.nda_requests for select to authenticated using (true);
create policy nda_write on public.nda_requests for all    to authenticated using (true) with check (true);

-- ── offers ──────────────────────────────────────────────────────────
create table if not exists public.offers (
  id                text primary key,
  listing_id        text not null,
  buyer_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
create index if not exists offers_listing_idx on public.offers (listing_id);
alter table public.offers enable row level security;
create policy offers_read  on public.offers for select to authenticated using (true);
create policy offers_write on public.offers for all    to authenticated using (true) with check (true);

-- ── documents (audit trail rides on deal_events) ────────────────────
create table if not exists public.documents (
  id          text primary key,
  listing_id  text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists documents_listing_idx on public.documents (listing_id);
alter table public.documents enable row level security;
create policy docs_read  on public.documents for select to authenticated using (true);
create policy docs_write on public.documents for all    to authenticated using (true) with check (true);

-- ── notifications (per recipient) ───────────────────────────────────
create table if not exists public.notifications (
  id          text primary key,
  account_id  text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_account_idx on public.notifications (account_id);
alter table public.notifications enable row level security;
create policy ntf_read  on public.notifications for select to authenticated using (account_id = auth.uid()::text);
create policy ntf_write on public.notifications for all    to authenticated using (account_id = auth.uid()::text) with check (account_id = auth.uid()::text);
