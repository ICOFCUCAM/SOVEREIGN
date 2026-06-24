-- M18 — Platform Operator domain (dispatch:platform).
--
-- A privileged, CONTENT-BLIND analytics domain. A platform operator must be able
-- to answer "how is the platform performing?" while remaining structurally unable
-- to answer "what is institution X publishing?". The ONLY way any platform query
-- crosses the tenant-isolation boundary is through the SECURITY DEFINER aggregate
-- functions below — and they return COUNTS, RATES and DISTRIBUTIONS only: never a
-- row body, rendered output, certificate, governance decision, audit event,
-- credential, secret, or any tenant-owned content. There is no path from the
-- platform domain into tenant content, by construction.
--
-- These functions are owned by the migration superuser, so they bypass RLS to
-- compute aggregates; every other principal remains fully tenant-isolated. The
-- dispatch:platform scope is NOT issuable through any tenant or admin API
-- (provisioning.mjs) — a platform operator credential is minted only out-of-band.

-- ---- guard: the platform claim must be present (defence in depth) -----------
-- The API also requires the dispatch:platform scope; this ensures a function can
-- never be reached except inside an explicitly platform-claimed transaction.
create or replace function dispatch.assert_platform() returns void
language plpgsql stable as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'platform', '') <> 'true' then
    raise exception 'platform scope required' using errcode = '42501';
  end if;
end $$;

-- ---- platform query audit (rule 5: every platform query is auditable) -------
-- Locked table: FORCE RLS with NO policies, no grants to dispatch_app. Reachable
-- ONLY through the SECURITY DEFINER functions, so the platform audit trail cannot
-- be tampered with, scraped, or bypassed.
create table if not exists dispatch.platform_audit (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor       text not null,
  action      text not null,
  params      jsonb not null default '{}'::jsonb
);
create index if not exists platform_audit_time_idx on dispatch.platform_audit (occurred_at desc);
alter table dispatch.platform_audit enable row level security;
alter table dispatch.platform_audit force  row level security;

create or replace function dispatch.platform_audit_log(p_actor text, p_action text, p_params jsonb)
returns void language plpgsql security definer set search_path = dispatch as $$
begin
  perform dispatch.assert_platform();
  insert into dispatch.platform_audit (actor, action, params)
  values (coalesce(p_actor, 'unknown'), p_action, coalesce(p_params, '{}'::jsonb));
end $$;
grant execute on function dispatch.platform_audit_log(text, text, jsonb) to dispatch_app;

-- ---- the metric surface (counts, rates, distributions — NEVER content) ------
-- Replaces M17's platform_overview with the full platform-operator metric set.
create or replace function dispatch.platform_overview()
returns jsonb language plpgsql security definer set search_path = dispatch stable as $$
declare result jsonb;
begin
  perform dispatch.assert_platform();
  select jsonb_build_object(
    -- institutions
    'institutions',        (select count(*) from dispatch.tenants),
    'activeInstitutions',  (select count(distinct tenant_id) from dispatch.documents where deleted_at is null),
    'activeSubscriptions', (select count(*) from dispatch.tenants where subscription_status = 'active'),
    -- records (lifecycle counts only)
    'records',             (select count(*) from dispatch.documents where deleted_at is null),
    'published',           (select count(*) from dispatch.documents where lifecycle_state = 'published'),
    'preserved',           (select count(*) from dispatch.documents where lifecycle_state = 'archived'),
    -- governance policy adoption: institutions that have configured a named policy
    'policyInstitutions',  (select count(distinct tenant_id) from dispatch.approval_policies where name is not null),
    -- deployment / edition distribution (institutional class — real per-tenant)
    'editionDistribution', (select coalesce(jsonb_object_agg(edition, n), '{}'::jsonb)
                            from (select edition, count(*) n from dispatch.tenants group by edition) e),
    -- behavioural funnel/friction (anonymous beacons; counts by event name)
    'events',              (select coalesce(jsonb_object_agg(event, n), '{}'::jsonb)
                            from (select event, count(*) n from dispatch.analytics_events group by event) a)
  ) into result;
  return result;
end $$;
grant execute on function dispatch.platform_overview() to dispatch_app;

-- ---- daily trend buckets (counts only; no identifiers, no content) ----------
create or replace function dispatch.platform_trends(p_days int default 30)
returns jsonb language plpgsql security definer set search_path = dispatch stable as $$
declare result jsonb; n int;
begin
  perform dispatch.assert_platform();
  n := least(greatest(coalesce(p_days, 30), 1), 90);
  select jsonb_build_object(
    'days', n,
    'institutions', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'n', c) order by d), '[]'::jsonb)
      from (select date_trunc('day', created_at) d, count(*) c
            from dispatch.tenants
            where created_at >= now() - (n || ' days')::interval
            group by 1) t),
    'records', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'n', c) order by d), '[]'::jsonb)
      from (select date_trunc('day', created_at) d, count(*) c
            from dispatch.documents
            where deleted_at is null and created_at >= now() - (n || ' days')::interval
            group by 1) r)
  ) into result;
  return result;
end $$;
grant execute on function dispatch.platform_trends(int) to dispatch_app;
