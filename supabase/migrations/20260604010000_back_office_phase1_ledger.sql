-- SOVEREIGN Back Office · Phase 1 ledger foundation
--
-- Multi-role superadmin/officer system + double-entry ledger with
-- multi-currency, audit log on every mutation, period locks.
--
-- NOT INCLUDED (each is its own engineering project):
--   - Country-specific tax forms (US 1120/941, UK CT600, FR liasse fiscale, NO RF-1167)
--   - E-filing certification (IRS MeF, HMRC MTD, EDI-TVA, Altinn)
--   - Payment processor integrations (Stripe, Plaid, banking APIs)
--
-- Auth model:
--   - auth.users provides the principal (Supabase Auth)
--   - bo_user_profiles links a user to a back-office role
--   - First user to sign up auto-promotes to superadmin (bootstrap)
--   - Subsequent users created via the bo-create-user edge function

-- See migration applied via apply_migration MCP tool 2026-06-04.
-- File mirrors the applied state for git tracking.

do $$ begin
  create type public.bo_role as enum (
    'superadmin','admin','accountant','auditor',
    'treasurer','controller','payroll_officer','tax_officer'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.bo_account_type as enum ('asset','liability','equity','revenue','expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.bo_currency as enum
    ('USD','GBP','EUR','NOK','SEK','DKK','CHF','CAD','AUD','JPY','BRL','INR','MXN','SGD','AED');
exception when duplicate_object then null; end $$;

do $$ begin create type public.bo_journal_status as enum ('draft','posted','voided');
exception when duplicate_object then null; end $$;

do $$ begin create type public.bo_period_status as enum ('open','closed','locked');
exception when duplicate_object then null; end $$;

create table if not exists public.bo_company (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  legal_name               text not null,
  jurisdiction             text not null,
  fiscal_year_start_month  integer not null default 1 check (fiscal_year_start_month between 1 and 12),
  functional_currency      public.bo_currency not null default 'USD',
  vat_number               text,
  tax_id                   text,
  address                  jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists public.bo_user_profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  role            public.bo_role not null,
  full_name       text not null,
  employee_id     text,
  status          text not null check (status in ('active','suspended','revoked')) default 'active',
  invited_by      uuid references auth.users(id),
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists bo_user_profiles_role_idx   on public.bo_user_profiles (role);
create index if not exists bo_user_profiles_status_idx on public.bo_user_profiles (status);

create or replace function public.bo_current_role()
returns public.bo_role
language sql stable security definer set search_path = public
as $$
  select role from public.bo_user_profiles where user_id = auth.uid() and status = 'active';
$$;

create or replace function public.bo_bootstrap_first_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.bo_user_profiles where role = 'superadmin' and status = 'active') then
    insert into public.bo_user_profiles (user_id, role, full_name)
    values (new.id, 'superadmin', coalesce(new.raw_user_meta_data->>'full_name', new.email))
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists bo_bootstrap_first_user_tr on auth.users;
create trigger bo_bootstrap_first_user_tr after insert on auth.users
  for each row execute function public.bo_bootstrap_first_user();

create table if not exists public.bo_accounts (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  account_type  public.bo_account_type not null,
  parent_id     uuid references public.bo_accounts(id),
  currency      public.bo_currency not null default 'USD',
  is_active     boolean not null default true,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists bo_accounts_type_idx   on public.bo_accounts (account_type);
create index if not exists bo_accounts_parent_idx on public.bo_accounts (parent_id);

create table if not exists public.bo_periods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  starts_at   date not null,
  ends_at     date not null,
  status      public.bo_period_status not null default 'open',
  closed_by   uuid references auth.users(id),
  closed_at   timestamptz,
  locked_by   uuid references auth.users(id),
  locked_at   timestamptz,
  check (ends_at >= starts_at)
);
create index if not exists bo_periods_dates_idx  on public.bo_periods (starts_at, ends_at);
create index if not exists bo_periods_status_idx on public.bo_periods (status);

create table if not exists public.bo_journal_entries (
  id              uuid primary key default gen_random_uuid(),
  entry_number    bigserial unique,
  entry_date      date not null,
  period_id       uuid references public.bo_periods(id),
  memo            text not null,
  reference       text,
  status          public.bo_journal_status not null default 'draft',
  created_by      uuid not null references auth.users(id),
  posted_by       uuid references auth.users(id),
  posted_at       timestamptz,
  voided_by       uuid references auth.users(id),
  voided_at       timestamptz,
  void_reason     text,
  reverses_entry  uuid references public.bo_journal_entries(id),
  created_at      timestamptz not null default now()
);
create index if not exists bo_journal_entries_date_idx   on public.bo_journal_entries (entry_date desc);
create index if not exists bo_journal_entries_status_idx on public.bo_journal_entries (status);
create index if not exists bo_journal_entries_period_idx on public.bo_journal_entries (period_id);

create table if not exists public.bo_journal_lines (
  id                  uuid primary key default gen_random_uuid(),
  entry_id            uuid not null references public.bo_journal_entries(id) on delete cascade,
  line_no             integer not null,
  account_id          uuid not null references public.bo_accounts(id),
  debit_amount        numeric(20,4) not null default 0 check (debit_amount  >= 0),
  credit_amount       numeric(20,4) not null default 0 check (credit_amount >= 0),
  currency            public.bo_currency not null,
  fx_rate             numeric(20,8) not null default 1 check (fx_rate > 0),
  functional_debit    numeric(20,4) not null default 0,
  functional_credit   numeric(20,4) not null default 0,
  memo                text,
  constraint bo_journal_lines_dr_xor_cr check (
    (debit_amount  > 0 and credit_amount = 0) or
    (credit_amount > 0 and debit_amount  = 0)
  )
);
create index if not exists bo_journal_lines_entry_idx   on public.bo_journal_lines (entry_id, line_no);
create index if not exists bo_journal_lines_account_idx on public.bo_journal_lines (account_id);

create table if not exists public.bo_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_email   text,
  actor_role    public.bo_role,
  action        text not null,
  entity_type   text not null,
  entity_id     text,
  changes       jsonb,
  ip_address    text,
  user_agent    text,
  at            timestamptz not null default now()
);
create index if not exists bo_audit_log_at_idx     on public.bo_audit_log (at desc);
create index if not exists bo_audit_log_actor_idx  on public.bo_audit_log (actor_user_id, at desc);
create index if not exists bo_audit_log_action_idx on public.bo_audit_log (action, at desc);

create or replace function public.bo_write_audit_log()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  v_email text; v_role public.bo_role; v_action text; v_entity_id text; v_changes jsonb;
begin
  select email into v_email from auth.users where id = auth.uid();
  v_role := public.bo_current_role();
  v_action := lower(tg_op) || '_' || tg_table_name;
  if tg_op = 'DELETE' then v_entity_id := old.id::text; v_changes := to_jsonb(old);
  else                     v_entity_id := new.id::text; v_changes := to_jsonb(new); end if;
  insert into public.bo_audit_log (actor_user_id, actor_email, actor_role, action, entity_type, entity_id, changes)
  values (auth.uid(), v_email, v_role, v_action, tg_table_name, v_entity_id, v_changes);
  return coalesce(new, old);
end $$;

revoke execute on function public.bo_bootstrap_first_user() from anon, authenticated, public;
revoke execute on function public.bo_write_audit_log()      from anon, authenticated, public;

create trigger bo_accounts_audit_tr        after insert or update or delete on public.bo_accounts        for each row execute function public.bo_write_audit_log();
create trigger bo_periods_audit_tr         after insert or update or delete on public.bo_periods         for each row execute function public.bo_write_audit_log();
create trigger bo_journal_entries_audit_tr after insert or update or delete on public.bo_journal_entries for each row execute function public.bo_write_audit_log();
create trigger bo_user_profiles_audit_tr   after insert or update or delete on public.bo_user_profiles   for each row execute function public.bo_write_audit_log();
create trigger bo_company_audit_tr         after insert or update or delete on public.bo_company         for each row execute function public.bo_write_audit_log();

alter table public.bo_company             enable row level security;
alter table public.bo_user_profiles       enable row level security;
alter table public.bo_accounts            enable row level security;
alter table public.bo_periods             enable row level security;
alter table public.bo_journal_entries     enable row level security;
alter table public.bo_journal_lines       enable row level security;
alter table public.bo_audit_log           enable row level security;

create policy "bo_company_read"  on public.bo_company for select using (public.bo_current_role() is not null);
create policy "bo_company_write" on public.bo_company for all
  using (public.bo_current_role() = 'superadmin') with check (public.bo_current_role() = 'superadmin');

create policy "bo_user_profiles_self_or_admin_read" on public.bo_user_profiles for select
  using (user_id = auth.uid() or public.bo_current_role() in ('superadmin','auditor'));
create policy "bo_user_profiles_super_write" on public.bo_user_profiles for all
  using (public.bo_current_role() = 'superadmin') with check (public.bo_current_role() = 'superadmin');

create policy "bo_accounts_read"  on public.bo_accounts for select using (public.bo_current_role() is not null);
create policy "bo_accounts_write" on public.bo_accounts for all
  using (public.bo_current_role() in ('superadmin','controller','accountant'))
  with check (public.bo_current_role() in ('superadmin','controller','accountant'));

create policy "bo_periods_read"  on public.bo_periods for select using (public.bo_current_role() is not null);
create policy "bo_periods_write" on public.bo_periods for all
  using (public.bo_current_role() in ('superadmin','controller'))
  with check (public.bo_current_role() in ('superadmin','controller'));

create policy "bo_journal_entries_read" on public.bo_journal_entries for select using (public.bo_current_role() is not null);
create policy "bo_journal_entries_write" on public.bo_journal_entries for all
  using (public.bo_current_role() in ('superadmin','controller','accountant','treasurer','payroll_officer','tax_officer'))
  with check (public.bo_current_role() in ('superadmin','controller','accountant','treasurer','payroll_officer','tax_officer'));

create policy "bo_journal_lines_read" on public.bo_journal_lines for select using (public.bo_current_role() is not null);
create policy "bo_journal_lines_write" on public.bo_journal_lines for all
  using (public.bo_current_role() in ('superadmin','controller','accountant','treasurer','payroll_officer','tax_officer'))
  with check (public.bo_current_role() in ('superadmin','controller','accountant','treasurer','payroll_officer','tax_officer'));

create policy "bo_audit_log_read" on public.bo_audit_log for select using (public.bo_current_role() in ('superadmin','auditor'));

create or replace view public.bo_trial_balance as
  select a.id as account_id, a.code, a.name, a.account_type, a.currency,
    coalesce(sum(jl.functional_debit), 0)  as total_debit,
    coalesce(sum(jl.functional_credit), 0) as total_credit,
    coalesce(sum(jl.functional_debit), 0) - coalesce(sum(jl.functional_credit), 0) as balance
  from public.bo_accounts a
  left join public.bo_journal_lines jl on jl.account_id = a.id
  left join public.bo_journal_entries je on je.id = jl.entry_id and je.status = 'posted'
  group by a.id, a.code, a.name, a.account_type, a.currency;
alter view public.bo_trial_balance set (security_invoker = true);

-- Seed: standard chart of accounts (36 rows) + fiscal periods. See
-- the apply_migration call for the full seed list.
