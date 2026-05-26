-- 0018 — Deployment briefings (inquiries) table + RLS, with triage status.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  system_slug text,
  system_name text,
  tier text,
  name text,
  email text not null,
  organization text,
  message text,
  status text default 'new'
);
alter table public.inquiries enable row level security;

drop policy if exists "anon submit inquiries" on public.inquiries;
create policy "anon submit inquiries" on public.inquiries for insert to anon with check (true);
drop policy if exists "auth submit inquiries" on public.inquiries;
create policy "auth submit inquiries" on public.inquiries for insert to authenticated with check (true);
drop policy if exists "auth read inquiries" on public.inquiries;
create policy "auth read inquiries" on public.inquiries for select to authenticated using (true);
drop policy if exists "auth update inquiries" on public.inquiries;
create policy "auth update inquiries" on public.inquiries for update to authenticated using (true) with check (true);
