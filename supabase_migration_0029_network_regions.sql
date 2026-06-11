-- Network regions · single source of truth for deployment reach.
--
-- The homepage hero claimed 47 edge nodes / 23 regions while the
-- Deployment Regions section showed 62 nodes across 5 zones — two
-- hardcoded copies that drifted apart. Both surfaces now read this
-- table, and the operator edits reach in one place.

create table if not exists public.network_regions (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  sub        text,
  nodes      int  not null default 0,
  accent     text not null default '#00C2FF',
  status     text not null default 'operational',  -- operational | provisioning | planned
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

alter table public.network_regions enable row level security;

drop policy if exists "network_regions public read" on public.network_regions;
create policy "network_regions public read" on public.network_regions
  for select using (true);

drop policy if exists "network_regions authenticated write" on public.network_regions;
create policy "network_regions authenticated write" on public.network_regions
  for all to authenticated using (true) with check (true);

insert into public.network_regions (label, sub, nodes, accent, status, sort_order)
select * from (values
  ('North America', 'United States · Canada',  12, '#00C2FF', 'operational', 1),
  ('Europe',        'EU · UK · EFTA',          24, '#7C4DFF', 'operational', 2),
  ('Africa',        'West · East · Southern',   7, '#10B981', 'operational', 3),
  ('Middle East',   'GCC · Levant',             4, '#F59E0B', 'operational', 4),
  ('Asia-Pacific',  'East · South · Oceania',  15, '#EC4899', 'operational', 5)
) as seed(label, sub, nodes, accent, status, sort_order)
where not exists (select 1 from public.network_regions);
