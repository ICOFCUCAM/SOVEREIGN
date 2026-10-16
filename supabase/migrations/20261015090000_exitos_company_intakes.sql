-- ExitOS · a founder's companies on their account, so they follow the founder across devices: each
-- company's intake (the figures entered in Value My Company and which fields the founder supplied). Each
-- row belongs to one account; nobody else can read it. The server sets the owner; a client cannot name
-- another. The company story, documents, data room, listing and deals already carry the company id.
--
-- Rollback: drop table public.exitos_company_intakes; drop function public.exitos_company_intake_stamp();

create table if not exists public.exitos_company_intakes (
  owner_account_id text not null default (auth.uid())::text,
  company_id       text not null check (company_id ~ '^co-[A-Za-z0-9-]{8,80}$'),
  inputs           jsonb not null check (jsonb_typeof(inputs) = 'object' and pg_column_size(inputs) <= 8192),
  provided         text[] not null default '{}' check (cardinality(provided) <= 64),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (owner_account_id, company_id)
);

-- the owner is always the caller, and times are the server's
create or replace function public.exitos_company_intake_stamp() returns trigger language plpgsql set search_path = public as $$
begin
  new.owner_account_id := (auth.uid())::text;
  new.updated_at := now();
  if tg_op = 'INSERT' then new.created_at := now(); else new.created_at := old.created_at; end if;
  return new;
end $$;
create or replace trigger exitos_company_intakes_stamp before insert or update on public.exitos_company_intakes
  for each row execute function public.exitos_company_intake_stamp();

alter table public.exitos_company_intakes enable row level security;
revoke all on public.exitos_company_intakes from anon, authenticated;
grant select, insert, update, delete on public.exitos_company_intakes to authenticated;

do $p$ begin
  if not exists (select 1 from pg_policies where tablename = 'exitos_company_intakes' and policyname = 'exitos_company_intakes_own') then
    create policy exitos_company_intakes_own on public.exitos_company_intakes for all to authenticated
      using (owner_account_id = (auth.uid())::text) with check (owner_account_id = (auth.uid())::text);
  end if;
end $p$;
