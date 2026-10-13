-- ExitOS · server-held roles for verified accounts (email-link sign-in).
--
-- Who a user is comes from Supabase Auth (auth.uid()). What they may do:
--  * founder / buyer — chosen by the user for their own account (exitos_accounts.role);
--    a user may only ever claim one of these two for themselves.
--  * operator / counsel / approver — privileged, granted only server-side (SQL or the
--    service role) in exitos_role_grants. No client policy can write a grant, so no
--    browser value can make anyone an approver, counsel or operator.
-- exitos_has_role() is what approval, counsel-review and execution policies check.
--
-- Rollback:
--   drop function public.exitos_has_role(text);
--   drop table public.exitos_role_grants;
--   alter policy exitos_accounts_self_write on public.exitos_accounts with check (id = auth.uid()::text);
--   alter policy exitos_accounts_self_upd on public.exitos_accounts using (id = auth.uid()::text);

create table if not exists public.exitos_role_grants (
  account_id  text not null,                 -- auth.uid()::text
  role        text not null check (role in ('operator', 'counsel', 'approver')),
  granted_by  text not null,                 -- who granted it (an operator's id, or 'sql')
  granted_at  timestamptz not null default now(),
  note        text,
  primary key (account_id, role)
);
alter table public.exitos_role_grants enable row level security;
-- a signed-in user can see their own grants; nobody can write through the API
create policy exitos_role_grants_self_read on public.exitos_role_grants
  for select to authenticated using (account_id = auth.uid()::text);
revoke insert, update, delete on public.exitos_role_grants from anon, authenticated;

create or replace function public.exitos_has_role(p_role text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.exitos_role_grants g
    where g.account_id = auth.uid()::text and g.role = p_role
  );
$$;
revoke all on function public.exitos_has_role(text) from public;
revoke execute on function public.exitos_has_role(text) from anon;
grant execute on function public.exitos_has_role(text) to authenticated;

-- a user's own account row may only claim founder or buyer
alter policy exitos_accounts_self_write on public.exitos_accounts
  with check (id = auth.uid()::text and role in ('founder', 'buyer'));
alter policy exitos_accounts_self_upd on public.exitos_accounts
  using (id = auth.uid()::text) with check (id = auth.uid()::text and role in ('founder', 'buyer'));
