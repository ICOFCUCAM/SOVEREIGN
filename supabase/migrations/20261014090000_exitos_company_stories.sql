-- ExitOS · the company story and its evidence (progressive intake).
--
-- One row per owner and company: the founder's history, products, customers,
-- market, people, ownership, financial history and source documents, saved as
-- they go (partial is fine). Owner-only. The owner may record a figure as
-- supplied by them, supported by an attached source, or estimated with a
-- method — never as independently verified: a row that marks anything
-- "verified" is refused unless the writer holds the operator grant (the only
-- verification process that exists today is an operator recording it).
--
-- Rollback:
--   drop trigger exitos_company_stories_guard on public.exitos_company_stories;
--   drop function public.exitos_company_stories_guard();
--   drop table public.exitos_company_stories;

create table if not exists public.exitos_company_stories (
  owner_account_id  text not null default auth.uid()::text,
  company_id        text not null check (company_id ~ '^co-[0-9a-f-]{36}$'),
  revision          integer not null default 1 check (revision >= 1),
  updated_at        timestamptz not null default now(),
  data              jsonb not null check (jsonb_typeof(data) = 'object' and data->>'version' = '1'),
  primary key (owner_account_id, company_id)
);
alter table public.exitos_company_stories enable row level security;

create policy exitos_company_stories_read on public.exitos_company_stories for select to authenticated
  using (owner_account_id = auth.uid()::text);
create policy exitos_company_stories_insert on public.exitos_company_stories for insert to authenticated
  with check (owner_account_id = auth.uid()::text);
create policy exitos_company_stories_update on public.exitos_company_stories for update to authenticated
  using (owner_account_id = auth.uid()::text) with check (owner_account_id = auth.uid()::text);
create policy exitos_company_stories_delete on public.exitos_company_stories for delete to authenticated
  using (owner_account_id = auth.uid()::text);

create or replace function public.exitos_company_stories_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.data @? '$.** ? (@.provenance == "verified")' and not public.exitos_has_role('operator') then
    raise exception 'a figure can be marked verified only through a verification process, not by its owner';
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.revision := old.revision + 1; end if;
  return new;
end $$;
revoke all on function public.exitos_company_stories_guard() from public, anon, authenticated;

drop trigger if exists exitos_company_stories_guard on public.exitos_company_stories;
create trigger exitos_company_stories_guard before insert or update on public.exitos_company_stories
  for each row execute function public.exitos_company_stories_guard();
