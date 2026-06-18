-- ExitOS network activation — the transaction spine.
-- exitos_deals: one row per (listing × buyer), the full acquisition lifecycle.
-- exitos_mandates: the persisted buyer acquisition criteria (id == buyer).
-- Same { id, filter cols, data jsonb } shape as the rest of the schema.

-- ── deals ───────────────────────────────────────────────────────────
create table if not exists public.exitos_deals (
  id                text primary key,
  listing_id        text not null,
  buyer_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
create index if not exists exitos_deals_listing_idx on public.exitos_deals (listing_id);
create index if not exists exitos_deals_buyer_idx   on public.exitos_deals (buyer_account_id);
alter table public.exitos_deals enable row level security;
drop policy if exists exitos_deals_read on public.exitos_deals;
drop policy if exists exitos_deals_ins  on public.exitos_deals;
drop policy if exists exitos_deals_upd  on public.exitos_deals;
drop policy if exists exitos_deals_del  on public.exitos_deals;
create policy exitos_deals_read on public.exitos_deals for select to authenticated using (true);
-- the buyer opens the deal
create policy exitos_deals_ins on public.exitos_deals for insert to authenticated with check (buyer_account_id = auth.uid()::text);
-- the buyer OR the listing owner advances it
create policy exitos_deals_upd on public.exitos_deals for update to authenticated using (
  buyer_account_id = auth.uid()::text
  or exists (select 1 from public.exitos_listings l where l.id = exitos_deals.listing_id and l.owner_account_id = auth.uid()::text)
);
create policy exitos_deals_del on public.exitos_deals for delete to authenticated using (buyer_account_id = auth.uid()::text);

-- ── mandates ────────────────────────────────────────────────────────
create table if not exists public.exitos_mandates (
  id                text primary key,        -- == buyer_account_id (one live mandate per buyer)
  buyer_account_id  text not null,
  data              jsonb not null,
  created_at        timestamptz not null default now()
);
alter table public.exitos_mandates enable row level security;
drop policy if exists exitos_mandates_read on public.exitos_mandates;
drop policy if exists exitos_mandates_write on public.exitos_mandates;
-- mandates are readable by any authenticated user so founders can match against
-- them; only the owning buyer may write their own
create policy exitos_mandates_read  on public.exitos_mandates for select to authenticated using (true);
create policy exitos_mandates_write on public.exitos_mandates for all    to authenticated using (id = auth.uid()::text) with check (id = auth.uid()::text);
