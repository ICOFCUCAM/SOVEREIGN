-- M27 — People sign in without an identity provider: invitations and passwords.
--
-- An institution that has no identity provider of its own (no Entra, Okta, Google Workspace…) still needs
-- its people to sign in. The administrator adds the person (M20), then issues an INVITATION: a single-use
-- link that expires after 7 days. The person opens it and sets their own password; from then on they sign
-- in with their email and that password. Institutions with an identity provider keep using it (M21) —
-- for an email domain with an enabled connection, the API sends people to it and never offers a password.
--
--   • person_invitations: one row per issued link. Only the SHA-256 of the link's token is stored; the
--     raw token exists once, in the API's response to the administrator. Issuing a new link revokes the
--     person's open ones, so at most one link works at a time. A link is spent when accepted.
--   • person_credentials: one password per person, stored as a salted scrypt hash computed by the API
--     (never the password). An email holds a password sign-in in ONE institution only, so signing in by
--     email is never ambiguous. Five wrong passwords lock the sign-in for 15 minutes.
--
-- Neither table is granted to dispatch_app and neither has a policy: every read and write goes through
-- the SECURITY DEFINER functions below, which check the tenant claim and the administrator role exactly
-- where the API's handlers would. Removing a person (M20 soft delete) also removes their password and
-- open links (revoke_person_sign_in), and a removed or suspended person can never sign in.

create table if not exists dispatch.person_invitations (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references dispatch.tenants(id) on delete cascade,
  user_id      uuid not null references dispatch.users(id) on delete cascade,
  token_hash   text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  issued_by    text not null,
  issued_at    timestamptz not null default now(),
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  revoked_at   timestamptz
);
create index if not exists person_invitations_user_idx on dispatch.person_invitations (user_id) where accepted_at is null and revoked_at is null;

create table if not exists dispatch.person_credentials (
  user_id          uuid primary key references dispatch.users(id) on delete cascade,
  tenant_id        uuid not null references dispatch.tenants(id) on delete cascade,
  email            text not null,
  password_hash    text not null check (password_hash like 'scrypt$%'),
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_sign_in_at  timestamptz
);
create unique index if not exists person_credentials_email_key on dispatch.person_credentials (lower(email));

alter table dispatch.person_invitations enable row level security;
alter table dispatch.person_invitations force  row level security;
alter table dispatch.person_credentials enable row level security;
alter table dispatch.person_credentials force  row level security;
revoke all on dispatch.person_invitations from public;
revoke all on dispatch.person_credentials from public;

-- ---- administrator: issue a link (raw token hashed by the API) ---------------------------------------
create or replace function dispatch.issue_person_invitation(p_user_id uuid, p_token_hash text, p_actor text)
returns timestamptz
language plpgsql security definer set search_path = dispatch, pg_temp as $$
declare tid uuid := dispatch.current_tenant(); exp timestamptz := now() + interval '7 days';
begin
  if tid is null then raise exception 'no tenant in context'; end if;
  if coalesce(dispatch.current_role(), '') <> 'tenant_admin' then raise exception 'only an administrator can invite people'; end if;
  if not exists (select 1 from dispatch.users where id = p_user_id and tenant_id = tid and status = 'active') then
    raise exception 'no such person in this institution';
  end if;
  update dispatch.person_invitations set revoked_at = now()
   where user_id = p_user_id and accepted_at is null and revoked_at is null;
  insert into dispatch.person_invitations (tenant_id, user_id, token_hash, issued_by, expires_at)
    values (tid, p_user_id, p_token_hash, coalesce(p_actor, 'admin'), exp);
  insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
    values (tid, coalesce(p_actor, 'admin'), 'system', 'person.invited', 'user', p_user_id);
  return exp;
end $$;

-- ---- public: what a link is for (shown on the accept page) -------------------------------------------
-- The person's email and institution are returned only while the link is valid.
create or replace function dispatch.person_invitation_details(p_token_hash text)
returns table (state text, institution text, email text, full_name text, expires_at timestamptz)
language sql stable security definer set search_path = dispatch, pg_temp as $$
  select case when i.id is null then 'unknown'
              when i.accepted_at is not null then 'used'
              when i.revoked_at is not null or u.status <> 'active' then 'revoked'
              when i.expires_at <= now() then 'expired'
              else 'valid' end,
         case when i.accepted_at is null and i.revoked_at is null and i.expires_at > now() and u.status = 'active' then t.name end,
         case when i.accepted_at is null and i.revoked_at is null and i.expires_at > now() and u.status = 'active' then u.email end,
         case when i.accepted_at is null and i.revoked_at is null and i.expires_at > now() and u.status = 'active' then u.full_name end,
         i.expires_at
    from (select 1) one
    left join dispatch.person_invitations i on i.token_hash = p_token_hash
    left join dispatch.users u on u.id = i.user_id
    left join dispatch.tenants t on t.id = i.tenant_id;
$$;

-- ---- public: accept a link and set the password (hash computed by the API) ----------------------------
create or replace function dispatch.accept_person_invitation(p_token_hash text, p_password_hash text)
returns table (user_id uuid, tenant_id uuid, email text, system_admin boolean, offices boolean)
language plpgsql security definer set search_path = dispatch, pg_temp as $$
#variable_conflict use_column
declare inv dispatch.person_invitations; usr dispatch.users;
begin
  select * into inv from dispatch.person_invitations where token_hash = p_token_hash for update;
  if inv.id is null or inv.accepted_at is not null or inv.revoked_at is not null or inv.expires_at <= now() then
    raise exception 'INVITATION_INVALID';
  end if;
  select * into usr from dispatch.users where id = inv.user_id and status = 'active';
  if usr.id is null then raise exception 'INVITATION_INVALID'; end if;
  if exists (select 1 from dispatch.person_credentials c where lower(c.email) = lower(usr.email) and c.user_id <> usr.id) then
    raise exception 'EMAIL_IN_USE';
  end if;
  insert into dispatch.person_credentials (user_id, tenant_id, email, password_hash)
    values (usr.id, usr.tenant_id, lower(usr.email), p_password_hash)
  on conflict on constraint person_credentials_pkey do update
    set password_hash = excluded.password_hash, email = excluded.email, failed_attempts = 0, locked_until = null, updated_at = now();
  update dispatch.person_invitations set accepted_at = now() where id = inv.id;
  insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
    values (usr.tenant_id, 'user:' || usr.id, 'user', 'person.invitation_accepted', 'user', usr.id);
  return query select usr.id, usr.tenant_id, lower(usr.email), usr.system_admin,
    exists (select 1 from dispatch.governance_role_grants g where g.tenant_id = usr.tenant_id and g.subject = 'user:' || usr.id and g.active);
end $$;

-- ---- public: the password sign-in (the API verifies the hash) --------------------------------------
create or replace function dispatch.person_password_lookup(p_email text)
returns table (user_id uuid, tenant_id uuid, email text, password_hash text, system_admin boolean, offices boolean, locked_until timestamptz)
language sql stable security definer set search_path = dispatch, pg_temp as $$
  select u.id, u.tenant_id, c.email, c.password_hash, u.system_admin,
         exists (select 1 from dispatch.governance_role_grants g where g.tenant_id = u.tenant_id and g.subject = 'user:' || u.id and g.active),
         c.locked_until
    from dispatch.person_credentials c
    join dispatch.users u on u.id = c.user_id and u.status = 'active'
   where lower(c.email) = lower(p_email);
$$;

-- Records a password attempt: success clears the counter; the fifth failure locks for 15 minutes.
create or replace function dispatch.record_person_sign_in(p_user_id uuid, p_ok boolean)
returns void
language plpgsql security definer set search_path = dispatch, pg_temp as $$
declare c dispatch.person_credentials;
begin
  select * into c from dispatch.person_credentials where user_id = p_user_id for update;
  if c.user_id is null then return; end if;
  if p_ok then
    update dispatch.person_credentials set failed_attempts = 0, locked_until = null, last_sign_in_at = now() where user_id = p_user_id;
  elsif c.failed_attempts + 1 >= 5 then
    update dispatch.person_credentials set failed_attempts = 0, locked_until = now() + interval '15 minutes' where user_id = p_user_id;
    insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
      values (c.tenant_id, 'user:' || p_user_id, 'system', 'person.sign_in_locked', 'user', p_user_id);
  else
    update dispatch.person_credentials set failed_attempts = c.failed_attempts + 1 where user_id = p_user_id;
  end if;
end $$;

-- ---- administrator: how each person signs in, and removing it --------------------------------------
create or replace function dispatch.people_sign_in_status()
returns table (user_id uuid, has_password boolean, last_sign_in_at timestamptz, invitation_expires_at timestamptz)
language sql stable security definer set search_path = dispatch, pg_temp as $$
  select u.id, c.user_id is not null, c.last_sign_in_at,
         (select max(i.expires_at) from dispatch.person_invitations i
           where i.user_id = u.id and i.accepted_at is null and i.revoked_at is null and i.expires_at > now())
    from dispatch.users u
    left join dispatch.person_credentials c on c.user_id = u.id
   where dispatch.current_tenant() is not null and u.tenant_id = dispatch.current_tenant() and u.status <> 'deleted';
$$;

create or replace function dispatch.revoke_person_sign_in(p_user_id uuid, p_actor text)
returns void
language plpgsql security definer set search_path = dispatch, pg_temp as $$
declare tid uuid := dispatch.current_tenant();
begin
  if tid is null then raise exception 'no tenant in context'; end if;
  if coalesce(dispatch.current_role(), '') <> 'tenant_admin' then raise exception 'only an administrator can remove a sign-in'; end if;
  if not exists (select 1 from dispatch.users where id = p_user_id and tenant_id = tid) then return; end if;
  delete from dispatch.person_credentials where user_id = p_user_id and tenant_id = tid;
  update dispatch.person_invitations set revoked_at = now() where user_id = p_user_id and tenant_id = tid and accepted_at is null and revoked_at is null;
  insert into dispatch.audit_events (tenant_id, actor, actor_type, action, target_type, target_id)
    values (tid, coalesce(p_actor, 'admin'), 'system', 'person.sign_in_removed', 'user', p_user_id);
end $$;

grant execute on function dispatch.issue_person_invitation(uuid, text, text) to dispatch_app;
grant execute on function dispatch.person_invitation_details(text) to dispatch_app;
grant execute on function dispatch.accept_person_invitation(text, text) to dispatch_app;
grant execute on function dispatch.person_password_lookup(text) to dispatch_app;
grant execute on function dispatch.record_person_sign_in(uuid, boolean) to dispatch_app;
grant execute on function dispatch.people_sign_in_status() to dispatch_app;
grant execute on function dispatch.revoke_person_sign_in(uuid, text) to dispatch_app;
