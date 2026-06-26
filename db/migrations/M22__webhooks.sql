-- M22: Event webhooks — the "reverse API" (Dispatch → the customer's systems).
--
-- Today external systems CALL Dispatch (POST a record, poll its state). Webhooks
-- invert that: when a governed record crosses a lifecycle boundary (approved,
-- published, preserved…), Dispatch POSTs a signed event to endpoints the
-- institution registered, so their ERP / SharePoint / case system can REACT
-- without polling. This is distinct from a render job's per-artifact callbackUrl;
-- these are institution-level event subscriptions.
--
-- Two tables: the registered endpoints, and a durable delivery queue (so delivery
-- is at-least-once — pending rows are retried by a sweep rather than lost if a
-- receiver is briefly down). The endpoint `secret` signs each delivery
-- (HMAC-SHA256); stored at rest like service-client secrets (documented residual).

create table if not exists dispatch.webhook_endpoints (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references dispatch.tenants(id) on delete cascade,
  url             text not null,
  secret          text not null,                       -- signs deliveries (HMAC-SHA256)
  events          text[] not null default '{}',        -- empty = all events
  description     text,
  active          boolean not null default true,
  last_status     text,                                -- last delivery outcome
  last_delivery_at timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists dispatch.webhook_deliveries (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references dispatch.tenants(id) on delete cascade,
  endpoint_id  uuid not null references dispatch.webhook_endpoints(id) on delete cascade,
  event        text not null,
  payload      jsonb not null,
  status       text not null default 'pending',        -- pending | delivered | failed
  attempts     integer not null default 0,
  last_error   text,
  created_at   timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists webhook_deliveries_pending_idx
  on dispatch.webhook_deliveries (tenant_id, status) where status <> 'delivered';

alter table dispatch.webhook_endpoints  enable row level security;
alter table dispatch.webhook_endpoints  force  row level security;
alter table dispatch.webhook_deliveries enable row level security;
alter table dispatch.webhook_deliveries force  row level security;

-- Endpoints: read by any principal in the tenant (admin UI; secret elided by the
-- API). Write (register / change / remove) is tenant_admin only — mirrors M14/M21.
create policy wh_ep_read on dispatch.webhook_endpoints for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy wh_ep_ins on dispatch.webhook_endpoints for insert
  with check (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');
create policy wh_ep_upd on dispatch.webhook_endpoints for update
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin')
  with check (tenant_id = dispatch.current_tenant());
create policy wh_ep_del on dispatch.webhook_endpoints for delete
  using (tenant_id = dispatch.current_tenant() and dispatch.current_role() = 'tenant_admin');

-- Deliveries: the engine enqueues at the moment of transition (under whatever
-- principal acted) and the delivery sweep updates them (under a tenant-system
-- claim), so insert/select/update are tenant-scoped without a role gate. They are
-- never written by an external client directly.
create policy wh_del_read on dispatch.webhook_deliveries for select
  using (dispatch.current_tenant() is not null and tenant_id = dispatch.current_tenant());
create policy wh_del_ins on dispatch.webhook_deliveries for insert
  with check (tenant_id = dispatch.current_tenant());
create policy wh_del_upd on dispatch.webhook_deliveries for update
  using (tenant_id = dispatch.current_tenant())
  with check (tenant_id = dispatch.current_tenant());

grant select, insert, update, delete on dispatch.webhook_endpoints  to dispatch_app;
grant select, insert, update, delete on dispatch.webhook_deliveries to dispatch_app;
