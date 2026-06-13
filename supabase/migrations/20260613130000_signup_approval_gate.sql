-- Sovereign signup approval gate
--
-- Every new auth.users gets a user_roles row at status='pending'. Until
-- an admin promotes them to 'approved', they cannot reach the console
-- — they see PendingApprovalView with an inline contact form that
-- writes to contact_submissions. The very first user to sign up is
-- bootstrapped as an approved admin so the system can be unlocked.

-- ── user_roles · status + provenance ───────────────────────────────
do $$ begin
  alter table public.user_roles
    add column if not exists status text not null default 'pending'
      check (status in ('pending','approved','rejected','suspended'));
exception when others then null; end $$;

alter table public.user_roles
  add column if not exists approved_by     uuid references auth.users(id),
  add column if not exists approved_at     timestamptz,
  add column if not exists rejected_reason text;

-- Backfill — existing rows are grandfathered as approved so no current
-- operator gets locked out by the new gate.
update public.user_roles
   set status = 'approved',
       approved_at = coalesce(approved_at, created_at)
 where status is null or status = 'pending';

-- Ensure user_id is unique for ON CONFLICT in the trigger.
do $$ begin
  alter table public.user_roles add constraint user_roles_user_id_key unique (user_id);
exception when duplicate_table then null; when duplicate_object then null; end $$;

-- ── Trigger · auto-create user_roles on auth.users INSERT ──────────
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  v_existing_admin int;
  v_full_name text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email);
  select count(*) into v_existing_admin
    from public.user_roles
    where role = 'admin' and status = 'approved';

  if v_existing_admin = 0 then
    -- First-ever user becomes an approved admin (bootstrap).
    insert into public.user_roles (user_id, email, role, full_name, status, approved_at)
    values (new.id, new.email, 'admin', v_full_name, 'approved', now())
    on conflict (user_id) do nothing;
  else
    -- Subsequent signups are pending viewers until admin approval.
    insert into public.user_roles (user_id, email, role, full_name, status)
    values (new.id, new.email, 'viewer', v_full_name, 'pending')
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

revoke execute on function public.handle_new_auth_user() from anon, authenticated, public;

-- ── is_admin() now requires status='approved' too ──────────────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$$;

-- ── contact_submissions · what pending users can send admin ────────
create table if not exists public.contact_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  email        text not null,
  full_name    text,
  subject      text,
  message      text not null,
  status       text not null default 'open' check (status in ('open','responded','closed')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  responded_by uuid references auth.users(id)
);
create index if not exists contact_submissions_created_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx  on public.contact_submissions (status, created_at desc);

alter table public.contact_submissions enable row level security;

drop policy if exists "contact_submissions_insert_any"    on public.contact_submissions;
drop policy if exists "contact_submissions_read_admin"    on public.contact_submissions;
drop policy if exists "contact_submissions_update_admin"  on public.contact_submissions;

-- Anyone can submit (pending users included); only admins read/update.
create policy "contact_submissions_insert_any" on public.contact_submissions
  for insert to anon, authenticated with check (true);

create policy "contact_submissions_read_admin" on public.contact_submissions
  for select using (public.is_admin());

create policy "contact_submissions_update_admin" on public.contact_submissions
  for update using (public.is_admin()) with check (public.is_admin());
