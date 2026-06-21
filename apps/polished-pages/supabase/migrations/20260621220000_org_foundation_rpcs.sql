-- Organization Foundation — RPC layer (the app's interface). Documents are
-- governed by security-definer RPCs in this project, so organizations follow the
-- same pattern: role-checked functions over the RLS'd org tables.

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
  return query select v_id, v_slug;
end; $$;

create or replace function public.polished_org_list_mine()
returns table(id uuid, slug text, name text, type text, role text, verified boolean, member_count bigint)
language sql security definer set search_path to 'public','polished' as $$
  select o.id, o.slug, o.name, o.type, m.role, o.verified,
    (select count(*) from polished.organization_members mm where mm.org_id = o.id)
  from polished.organizations o
  join polished.organization_members m on m.org_id = o.id and m.user_id = auth.uid()
  order by o.name;
$$;

create or replace function public.polished_org_get(p_slug text)
returns table(id uuid, slug text, name text, type text, tagline text, bio text, website text, verified boolean, my_role text)
language sql security definer set search_path to 'public','polished' as $$
  select o.id, o.slug, o.name, o.type, o.tagline, o.bio, o.website, o.verified,
    (select role from polished.organization_members m where m.org_id = o.id and m.user_id = auth.uid())
  from polished.organizations o where o.slug = p_slug;
$$;

create or replace function public.polished_org_update(p_org uuid, p_name text, p_tagline text, p_bio text, p_website text)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if not polished.org_can_manage(p_org) then raise exception 'Not allowed'; end if;
  update polished.organizations
    set name = coalesce(nullif(btrim(p_name),''), name), tagline = p_tagline, bio = p_bio, website = p_website, updated_at = now()
    where id = p_org;
end; $$;

create or replace function public.polished_org_members(p_org uuid)
returns table(user_id uuid, role text, email text, created_at timestamptz)
language sql security definer set search_path to 'public','polished','auth' as $$
  select m.user_id, m.role, u.email, m.created_at
  from polished.organization_members m
  join auth.users u on u.id = m.user_id
  where m.org_id = p_org and polished.org_is_member(p_org)
  order by case m.role when 'owner' then 0 when 'admin' then 1 when 'editor' then 2 when 'contributor' then 3 else 4 end, u.email;
$$;

create or replace function public.polished_org_set_role(p_org uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if not polished.org_can_manage(p_org) then raise exception 'Not allowed'; end if;
  if p_role not in ('owner','admin','editor','contributor','viewer') then raise exception 'Invalid role'; end if;
  if p_role <> 'owner'
     and (select role from polished.organization_members where org_id = p_org and user_id = p_user) = 'owner'
     and (select count(*) from polished.organization_members where org_id = p_org and role = 'owner') <= 1 then
    raise exception 'An organization must have at least one owner';
  end if;
  update polished.organization_members set role = p_role where org_id = p_org and user_id = p_user;
end; $$;

create or replace function public.polished_org_remove_member(p_org uuid, p_user uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if p_user <> auth.uid() and not polished.org_can_manage(p_org) then raise exception 'Not allowed'; end if;
  if (select role from polished.organization_members where org_id = p_org and user_id = p_user) = 'owner'
     and (select count(*) from polished.organization_members where org_id = p_org and role = 'owner') <= 1 then
    raise exception 'Cannot remove the last owner';
  end if;
  delete from polished.organization_members where org_id = p_org and user_id = p_user;
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
  return v_inv.org_id;
end; $$;

create or replace function public.polished_org_invitations(p_org uuid)
returns table(id uuid, email text, role text, status text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select i.id, i.email, i.role, i.status, i.created_at
  from polished.organization_invitations i
  where i.org_id = p_org and polished.org_can_manage(p_org) and i.status = 'pending'
  order by i.created_at desc;
$$;

create or replace function public.polished_org_set_document(p_doc uuid, p_org uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if (select user_id from polished.documents where id = p_doc) <> auth.uid() then raise exception 'Not your document'; end if;
  if p_org is not null and not polished.org_can_edit(p_org) then raise exception 'Not allowed in this organization'; end if;
  update polished.documents set org_id = p_org where id = p_doc;
end; $$;

create or replace function public.polished_org_library(p_org uuid)
returns table(id uuid, kind text, title text, preview text, listed boolean, created_at timestamptz, author_name text)
language sql security definer set search_path to 'public','polished' as $$
  select d.id, d.kind, d.title, d.preview, d.listed, d.created_at, d.author_name
  from polished.documents d
  where d.org_id = p_org and polished.org_is_member(p_org)
  order by d.created_at desc;
$$;

create or replace function public.polished_org_collection_create(p_org uuid, p_name text, p_desc text default null)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_id uuid;
begin
  if not polished.org_can_edit(p_org) then raise exception 'Not allowed'; end if;
  insert into polished.organization_collections(org_id, name, description) values (p_org, btrim(p_name), p_desc) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.polished_org_collections(p_org uuid)
returns table(id uuid, name text, description text, item_count bigint)
language sql security definer set search_path to 'public','polished' as $$
  select c.id, c.name, c.description, (select count(*) from polished.organization_collection_items i where i.collection_id = c.id)
  from polished.organization_collections c where c.org_id = p_org order by c.name;
$$;

create or replace function public.polished_org_storefront(p_slug text)
returns table(token uuid, kind text, title text, category text, price_cents integer, preview text, author_name text, license text, featured boolean, view_count integer, download_count integer, avg_rating numeric, review_count bigint, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select d.share_token, d.kind, d.title, d.category, d.price_cents, d.preview, d.author_name, d.license, d.featured, d.view_count, d.download_count,
    rv.avg_rating, coalesce(rv.review_count, 0), d.created_at
  from polished.documents d
  join polished.organizations o on o.id = d.org_id
  left join lateral (select avg(rating)::numeric as avg_rating, count(*) as review_count from polished.reviews r where r.document_id = d.id) rv on true
  where o.slug = p_slug and d.listed = true and d.shared = true and d.share_token is not null
  order by d.featured desc, d.created_at desc;
$$;

create or replace function public.polished_org_analytics(p_org uuid)
returns table(works bigint, published bigint, views bigint, downloads bigint, members bigint, collections bigint)
language sql security definer set search_path to 'public','polished' as $$
  select
    (select count(*) from polished.documents d where d.org_id = p_org),
    (select count(*) from polished.documents d where d.org_id = p_org and d.listed = true),
    (select coalesce(sum(view_count),0) from polished.documents d where d.org_id = p_org),
    (select coalesce(sum(download_count),0) from polished.documents d where d.org_id = p_org),
    (select count(*) from polished.organization_members m where m.org_id = p_org),
    (select count(*) from polished.organization_collections c where c.org_id = p_org)
  where polished.org_is_member(p_org);
$$;

grant execute on function public.polished_org_get(text) to anon, authenticated;
grant execute on function public.polished_org_storefront(text) to anon, authenticated;
grant execute on function public.polished_org_create(text,text,text), public.polished_org_list_mine(),
  public.polished_org_update(uuid,text,text,text,text), public.polished_org_members(uuid),
  public.polished_org_set_role(uuid,uuid,text), public.polished_org_remove_member(uuid,uuid),
  public.polished_org_invite(uuid,text,text), public.polished_org_accept_invite(uuid),
  public.polished_org_invitations(uuid), public.polished_org_set_document(uuid,uuid),
  public.polished_org_library(uuid), public.polished_org_collection_create(uuid,text,text),
  public.polished_org_collections(uuid), public.polished_org_analytics(uuid) to authenticated;
