-- Organization Foundation — schema, permissions helpers and RLS.
-- A single organization architecture for publishers, schools, NGOs, ministries
-- and companies, with roles owner/admin/editor/contributor/viewer. Billing is
-- intentionally out of scope; this is designed to extend to seats/enterprise
-- billing later without a redesign.
create extension if not exists pgcrypto;

create table if not exists polished.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text not null default 'publisher' check (type in ('publisher','school','ngo','ministry','company')),
  tagline text,
  bio text,
  website text,
  verified boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists polished.organization_members (
  org_id uuid not null references polished.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','editor','contributor','viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists idx_org_members_user on polished.organization_members(user_id);

create table if not exists polished.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references polished.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('owner','admin','editor','contributor','viewer')),
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);
create index if not exists idx_org_invites_org on polished.organization_invitations(org_id);
create index if not exists idx_org_invites_email on polished.organization_invitations(lower(email));

create table if not exists polished.organization_collections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references polished.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_org_collections_org on polished.organization_collections(org_id);

create table if not exists polished.organization_collection_items (
  collection_id uuid not null references polished.organization_collections(id) on delete cascade,
  document_id uuid not null references polished.documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, document_id)
);

alter table polished.documents add column if not exists org_id uuid references polished.organizations(id) on delete set null;
create index if not exists idx_documents_org on polished.documents(org_id);

-- Permissions helpers (security definer so policies don't recurse on the
-- membership table).
create or replace function polished.org_role(p_org uuid)
returns text language sql stable security definer set search_path to 'polished','public' as $$
  select role from polished.organization_members where org_id = p_org and user_id = auth.uid();
$$;
create or replace function polished.org_is_member(p_org uuid)
returns boolean language sql stable security definer set search_path to 'polished','public' as $$
  select exists(select 1 from polished.organization_members where org_id = p_org and user_id = auth.uid());
$$;
create or replace function polished.org_can_manage(p_org uuid)
returns boolean language sql stable security definer set search_path to 'polished','public' as $$
  select exists(select 1 from polished.organization_members where org_id = p_org and user_id = auth.uid() and role in ('owner','admin'));
$$;
create or replace function polished.org_can_edit(p_org uuid)
returns boolean language sql stable security definer set search_path to 'polished','public' as $$
  select exists(select 1 from polished.organization_members where org_id = p_org and user_id = auth.uid() and role in ('owner','admin','editor'));
$$;

alter table polished.organizations enable row level security;
alter table polished.organization_members enable row level security;
alter table polished.organization_invitations enable row level security;
alter table polished.organization_collections enable row level security;
alter table polished.organization_collection_items enable row level security;

create policy org_select on polished.organizations for select using (true);
create policy org_insert on polished.organizations for insert with check (created_by = auth.uid());
create policy org_update on polished.organizations for update using (polished.org_can_manage(id)) with check (polished.org_can_manage(id));
create policy org_delete on polished.organizations for delete using (polished.org_role(id) = 'owner');

create policy orgmem_select on polished.organization_members for select using (polished.org_is_member(org_id));
create policy orgmem_write on polished.organization_members for all using (polished.org_can_manage(org_id)) with check (polished.org_can_manage(org_id));

create policy orginv_select on polished.organization_invitations for select using (polished.org_can_manage(org_id) or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy orginv_write on polished.organization_invitations for all using (polished.org_can_manage(org_id)) with check (polished.org_can_manage(org_id));

create policy orgcol_select on polished.organization_collections for select using (true);
create policy orgcol_write on polished.organization_collections for all using (polished.org_can_edit(org_id)) with check (polished.org_can_edit(org_id));
create policy orgcoli_select on polished.organization_collection_items for select using (true);
create policy orgcoli_write on polished.organization_collection_items for all
  using (exists (select 1 from polished.organization_collections c where c.id = collection_id and polished.org_can_edit(c.org_id)))
  with check (exists (select 1 from polished.organization_collections c where c.id = collection_id and polished.org_can_edit(c.org_id)));
