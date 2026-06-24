-- M17 — Adoption & friction instrumentation (Launch Phase 1).
--
-- The platform now needs answers only real users can give: do evaluators
-- understand the homepage, can an operator create a first record unaided, do
-- people grasp the paywall, does procurement feel safer. None of that is in the
-- code — it is in behaviour. This adds a thin, append-only event log for the
-- BEHAVIOURAL signals that have no existing home (public page visits, the signup
-- funnel, paywall views, abandonment) and a single cross-tenant aggregation for
-- the platform operator. Authoritative lifecycle counts (records, governed,
-- published, archived, institutions, subscriptions) are read live from their own
-- tables — never duplicated here — so the dashboard cannot drift from reality.

-- ---- behavioural event log ------------------------------------------------
-- tenant_id is NULLABLE: anonymous public events (homepage/trust/procurement)
-- belong to no tenant. anon_id is a client-generated stable id (no PII); props
-- is a small, bounded json bag. This is signal, not a record of authority — it
-- is deliberately NOT in the audit trail.
create table if not exists dispatch.analytics_events (
  id          bigint generated always as identity primary key,
  event       text not null,
  occurred_at timestamptz not null default now(),
  tenant_id   uuid,
  anon_id     text,
  session_id  text,
  props       jsonb not null default '{}'::jsonb
);
create index if not exists analytics_events_event_idx on dispatch.analytics_events (event, occurred_at);

-- RLS: ingestion is public and untrusted (client-side beacons), so INSERT is
-- permissive. There is deliberately NO select policy for the app role — rows are
-- readable ONLY through the SECURITY DEFINER aggregation below, never directly,
-- so behavioural data can never leak per-row or across tenants via the API.
alter table dispatch.analytics_events enable row level security;
alter table dispatch.analytics_events force  row level security;
create policy analytics_ingest on dispatch.analytics_events for insert with check (true);
grant insert on dispatch.analytics_events to dispatch_app;

-- ---- platform operator aggregation (cross-tenant, counts only) -------------
-- This is the ONE function that crosses the tenant-isolation boundary the rest
-- of the platform enforces. It is gated two ways: the API only calls it for a
-- server-side allowlisted operator credential (DISPATCH_PLATFORM_OPERATORS), and
-- the function itself refuses unless a 'platform_operator' claim is present —
-- defence in depth, so it can never be reached through a normal tenant token.
-- It returns ONLY aggregate counts: no record contents, titles, or tenant rows.
create or replace function dispatch.platform_overview()
returns jsonb language plpgsql security definer set search_path = dispatch stable as $$
declare result jsonb;
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'platform_operator', '') <> 'true' then
    raise exception 'platform_operator claim required' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'institutions',         (select count(*) from dispatch.tenants),
    'activeSubscriptions',  (select count(*) from dispatch.tenants    where subscription_status = 'active'),
    'records',              (select count(*) from dispatch.documents  where deleted_at is null),
    'governed',             (select count(*) from dispatch.documents  where governance_certificate is not null),
    'published',            (select count(*) from dispatch.documents  where lifecycle_state = 'published'),
    'archived',             (select count(*) from dispatch.documents  where lifecycle_state = 'archived'),
    'events', (
      select coalesce(jsonb_object_agg(event, n), '{}'::jsonb)
      from (select event, count(*) n from dispatch.analytics_events group by event) e
    )
  ) into result;
  return result;
end $$;

grant execute on function dispatch.platform_overview() to dispatch_app;
