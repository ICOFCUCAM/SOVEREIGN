-- ExitOS · the buyer's own workspace on the Acquisition Command Center, kept on their account so it
-- follows them across devices: the shortlist (listings they follow, each with a private note) and their
-- saved views (a named layout, sort, filters and tab). Each row belongs to one account; nobody else,
-- the listing's founder included, can read it. The server sets the owner; a client cannot name another.

create table if not exists public.exitos_buyer_shortlist (
  account_id text not null default (auth.uid())::text,
  listing_id text not null check (char_length(listing_id) between 1 and 200),
  note       text not null default '' check (char_length(note) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id, listing_id)
);

create table if not exists public.exitos_buyer_saved_views (
  account_id text not null default (auth.uid())::text,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  config     jsonb not null check (jsonb_typeof(config) = 'object' and pg_column_size(config) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id, name)
);

-- the owner is always the caller, and times are the server's
create or replace function public.exitos_buyer_workspace_stamp() returns trigger language plpgsql set search_path = public as $$
begin
  new.account_id := (auth.uid())::text;
  new.updated_at := now();
  if tg_op = 'INSERT' then new.created_at := now(); else new.created_at := old.created_at; end if;
  return new;
end $$;
create or replace trigger exitos_buyer_shortlist_stamp before insert or update on public.exitos_buyer_shortlist
  for each row execute function public.exitos_buyer_workspace_stamp();
create or replace trigger exitos_buyer_saved_views_stamp before insert or update on public.exitos_buyer_saved_views
  for each row execute function public.exitos_buyer_workspace_stamp();

alter table public.exitos_buyer_shortlist enable row level security;
alter table public.exitos_buyer_saved_views enable row level security;
revoke all on public.exitos_buyer_shortlist, public.exitos_buyer_saved_views from anon, authenticated;
grant select, insert, update, delete on public.exitos_buyer_shortlist, public.exitos_buyer_saved_views to authenticated;

do $p$ begin
  if not exists (select 1 from pg_policies where tablename = 'exitos_buyer_shortlist' and policyname = 'exitos_buyer_shortlist_own') then
    create policy exitos_buyer_shortlist_own on public.exitos_buyer_shortlist for all to authenticated
      using (account_id = (auth.uid())::text) with check (account_id = (auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'exitos_buyer_saved_views' and policyname = 'exitos_buyer_saved_views_own') then
    create policy exitos_buyer_saved_views_own on public.exitos_buyer_saved_views for all to authenticated
      using (account_id = (auth.uid())::text) with check (account_id = (auth.uid())::text);
  end if;
end $p$;
