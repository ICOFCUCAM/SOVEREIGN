-- Organization Experience Premiumization — trust, typed collections, showcase.
--   Circle 7: collections gain a type (curriculum / publishing / program / series)
--   Circle 8: an immutable audit log records who did what, for institutional trust
--   Circle 9: a public showcase that surfaces only organizations with real,
--             published content (no fabricated examples)

------------------------------------------------------------------------------
-- Circle 7 — typed collections
------------------------------------------------------------------------------
alter table polished.organization_collections add column if not exists kind text not null default 'general';
alter table polished.organization_collections drop constraint if exists organization_collections_kind_check;
alter table polished.organization_collections
  add constraint organization_collections_kind_check
  check (kind in ('general','curriculum','publishing','program','series'));

------------------------------------------------------------------------------
-- Circle 8 — audit log + logging helper
------------------------------------------------------------------------------
create table if not exists polished.organization_audit (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references polished.organizations(id) on delete cascade,
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists organization_audit_org_idx on polished.organization_audit(org_id, created_at desc);
alter table polished.organization_audit enable row level security;
-- No direct policies: the table is append-only via the security-definer helper
-- and read only through the role-checked polished_org_audit RPC below.

create or replace function polished.org_log(p_org uuid, p_action text, p_detail text default null)
returns void language sql security definer set search_path to 'polished' as $$
  insert into polished.organization_audit(org_id, actor, action, detail)
  values (p_org, auth.uid(), p_action, p_detail);
$$;

create or replace function public.polished_org_audit(p_org uuid)
returns table(id uuid, actor_email text, action text, detail text, created_at timestamptz)
language sql security definer set search_path to 'public','polished','auth' as $$
  select a.id, u.email, a.action, a.detail, a.created_at
  from polished.organization_audit a
  left join auth.users u on u.id = a.actor
  where a.org_id = p_org and polished.org_can_manage(p_org)
  order by a.created_at desc
  limit 100;
$$;

------------------------------------------------------------------------------
-- Wire audit logging into the mutating RPCs (recreated with perform org_log)
------------------------------------------------------------------------------
create or replace function public.polished_org_create(p_name text, p_type text default 'publisher', p_slug text default null)
returns table(id uuid, slug text)
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_id uuid; v_slug text; v_base text; v_n int := 1;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if coalesce(btrim(p_name),'') = '' then raise exception 'Name is required'; end if;
  v_base := btrim(lower(regexp_replace(coalesce(nullif(btrim(p_slug),''), p_name), '[^a-z0-9]+', '-', 'g')), '-');
  if v_base = '' then v_base := 'org'; end if;
  v_slug := v_base;
  while exists (select 1 from polished.organizations o where o.slug = v_slug) loop
    v_n := v_n + 1; v_slug := v_base || '-' || v_n;
  end loop;
  insert into polished.organizations(slug, name, type, created_by)
    values (v_slug, btrim(p_name), coalesce(p_type,'publisher'), auth.uid())
    returning organizations.id into v_id;
  insert into polished.organization_members(org_id, user_id, role) values (v_id, auth.uid(), 'owner');
  perform polished.org_log(v_id, 'org.created', btrim(p_name));
  return query select v_id, v_slug;
end; $$;

create or replace function public.polished_org_update(p_org uuid, p_name text, p_tagline text, p_bio text, p_website text)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if not polished.org_can_manage(p_org) then raise exception 'Not allowed'; end if;
  update polished.organizations
    set name = coalesce(nullif(btrim(p_name),''), name), tagline = p_tagline, bio = p_bio, website = p_website, updated_at = now()
    where id = p_org;
  perform polished.org_log(p_org, 'org.updated', null);
end; $$;

create or replace function public.polished_org_set_role(p_org uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path to 'public','polished','auth' as $$
declare v_email text;
begin
  if not polished.org_can_manage(p_org) then raise exception 'Not allowed'; end if;
  if p_role not in ('owner','admin','editor','contributor','viewer') then raise exception 'Invalid role'; end if;
  if p_role <> 'owner'
     and (select role from polished.organization_members where org_id = p_org and user_id = p_user) = 'owner'
     and (select count(*) from polished.organization_members where org_id = p_org and role = 'owner') <= 1 then
    raise exception 'An organization must have at least one owner';
  end if;
  update polished.organization_members set role = p_role where org_id = p_org and user_id = p_user;
  select email into v_email from auth.users where id = p_user;
  perform polished.org_log(p_org, 'member.role_changed', coalesce(v_email,'member') || ' → ' || p_role);
end; $$;

create or replace function public.polished_org_remove_member(p_org uuid, p_user uuid)
returns void language plpgsql security definer set search_path to 'public','polished','auth' as $$
declare v_email text;
begin
  if p_user <> auth.uid() and not polished.org_can_manage(p_org) then raise exception 'Not allowed'; end if;
  if (select role from polished.organization_members where org_id = p_org and user_id = p_user) = 'owner'
     and (select count(*) from polished.organization_members where org_id = p_org and role = 'owner') <= 1 then
    raise exception 'Cannot remove the last owner';
  end if;
  select email into v_email from auth.users where id = p_user;
  delete from polished.organization_members where org_id = p_org and user_id = p_user;
  perform polished.org_log(p_org, 'member.removed', coalesce(v_email,'member'));
end; $$;

create or replace function public.polished_org_invite(p_org uuid, p_email text, p_role text default 'viewer')
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_token uuid;
begin
  if not polished.org_can_manage(p_org) then raise exception 'Not allowed'; end if;
  if p_role not in ('admin','editor','contributor','viewer') then raise exception 'Invalid role'; end if;
  insert into polished.organization_invitations(org_id, email, role, invited_by)
    values (p_org, lower(btrim(p_email)), p_role, auth.uid())
    returning token into v_token;
  perform polished.org_log(p_org, 'member.invited', lower(btrim(p_email)) || ' (' || p_role || ')');
  return v_token;
end; $$;

create or replace function public.polished_org_accept_invite(p_token uuid)
returns uuid language plpgsql security definer set search_path to 'public','polished','auth' as $$
declare v_inv polished.organization_invitations; v_email text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into v_inv from polished.organization_invitations where token = p_token;
  if v_inv.id is null or v_inv.status <> 'pending' or v_inv.expires_at < now() then raise exception 'Invitation invalid or expired'; end if;
  select email into v_email from auth.users where id = auth.uid();
  if lower(v_email) <> lower(v_inv.email) then raise exception 'This invitation is for a different email'; end if;
  insert into polished.organization_members(org_id, user_id, role) values (v_inv.org_id, auth.uid(), v_inv.role)
    on conflict (org_id, user_id) do update set role = excluded.role;
  update polished.organization_invitations set status = 'accepted' where token = p_token;
  perform polished.org_log(v_inv.org_id, 'member.joined', coalesce(v_email,'member') || ' (' || v_inv.role || ')');
  return v_inv.org_id;
end; $$;

create or replace function public.polished_org_set_document(p_doc uuid, p_org uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
declare v_title text;
begin
  if (select user_id from polished.documents where id = p_doc) <> auth.uid() then raise exception 'Not your document'; end if;
  if p_org is not null and not polished.org_can_edit(p_org) then raise exception 'Not allowed in this organization'; end if;
  select title into v_title from polished.documents where id = p_doc;
  update polished.documents set org_id = p_org where id = p_doc;
  if p_org is not null then perform polished.org_log(p_org, 'content.added', v_title); end if;
end; $$;

------------------------------------------------------------------------------
-- Typed collections — create with a kind, list including kind
------------------------------------------------------------------------------
drop function if exists public.polished_org_collection_create(uuid, text, text);
create or replace function public.polished_org_collection_create(p_org uuid, p_name text, p_desc text default null, p_kind text default 'general')
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_id uuid;
begin
  if not polished.org_can_edit(p_org) then raise exception 'Not allowed'; end if;
  if coalesce(p_kind,'general') not in ('general','curriculum','publishing','program','series') then raise exception 'Invalid collection type'; end if;
  insert into polished.organization_collections(org_id, name, description, kind)
    values (p_org, btrim(p_name), p_desc, coalesce(p_kind,'general')) returning id into v_id;
  perform polished.org_log(p_org, 'collection.created', btrim(p_name));
  return v_id;
end; $$;

drop function if exists public.polished_org_collections(uuid);
create or replace function public.polished_org_collections(p_org uuid)
returns table(id uuid, name text, description text, kind text, item_count bigint)
language sql security definer set search_path to 'public','polished' as $$
  select c.id, c.name, c.description, c.kind,
    (select count(*) from polished.organization_collection_items i where i.collection_id = c.id)
  from polished.organization_collections c where c.org_id = p_org order by c.name;
$$;

------------------------------------------------------------------------------
-- Circle 9 — public showcase (real content only: orgs with published works)
------------------------------------------------------------------------------
create or replace function public.polished_org_showcase()
returns table(slug text, name text, type text, tagline text, verified boolean, works bigint, languages bigint)
language sql security definer set search_path to 'public','polished' as $$
  select o.slug, o.name, o.type, o.tagline, o.verified,
    count(d.id) as works,
    count(distinct nullif(d.edition_language,'')) as languages
  from polished.organizations o
  join polished.documents d on d.org_id = o.id and d.listed = true and d.shared = true and d.share_token is not null
  group by o.id
  order by o.verified desc, works desc, o.name
  limit 60;
$$;

------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------
grant execute on function public.polished_org_showcase() to anon, authenticated;
grant execute on function public.polished_org_audit(uuid) to authenticated;
grant execute on function public.polished_org_collection_create(uuid,text,text,text) to authenticated;
grant execute on function public.polished_org_collections(uuid) to authenticated;
