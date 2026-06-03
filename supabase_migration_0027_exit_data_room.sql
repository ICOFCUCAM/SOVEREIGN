-- ExitOS Data Room storage — substrate for actual document upload +
-- persistence behind the diligence engine's specs.
--
-- Tables
--   exit_data_room_documents   one row per uploaded artifact
--   exit_data_room_access_log  every access event (audit posture)
--
-- Storage
--   bucket 'exit-data-room' (private). Documents served via signed URLs.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.exit_data_room_documents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  room_kind       text not null,
  filename        text not null,
  mime            text not null,
  bytes           integer not null,
  storage_path    text not null,
  classification  text not null default 'sensitive',
  uploaded_by     uuid,
  uploaded_at     timestamptz not null default now(),
  description     text,
  constraint exit_data_room_documents_kind_check check (
    room_kind in ('financial','market','user_growth','technical_architecture','security','legal','commercial')
  ),
  constraint exit_data_room_documents_class_check check (
    classification in ('unclassified','sensitive','confidential')
  )
);
create index if not exists exit_dr_docs_tenant_kind_idx on public.exit_data_room_documents (tenant_id, room_kind, uploaded_at desc);
create index if not exists exit_dr_docs_storage_path_idx on public.exit_data_room_documents (storage_path);
alter table public.exit_data_room_documents enable row level security;

create table if not exists public.exit_data_room_access_log (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  document_id   uuid references public.exit_data_room_documents(id) on delete set null,
  principal     uuid,
  action        text not null,
  details       jsonb,
  at            timestamptz not null default now(),
  constraint exit_dr_access_action_check check (action in ('upload','download','list','delete'))
);
create index if not exists exit_dr_access_tenant_at_idx on public.exit_data_room_access_log (tenant_id, at desc);
alter table public.exit_data_room_access_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='exit_data_room_documents' and policyname='exit_dr_docs_tenant_read') then
    create policy exit_dr_docs_tenant_read on public.exit_data_room_documents for select using (auth.uid() = tenant_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='exit_data_room_documents' and policyname='exit_dr_docs_service_all') then
    create policy exit_dr_docs_service_all on public.exit_data_room_documents for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='exit_data_room_access_log' and policyname='exit_dr_access_tenant_read') then
    create policy exit_dr_access_tenant_read on public.exit_data_room_access_log for select using (auth.uid() = tenant_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='exit_data_room_access_log' and policyname='exit_dr_access_service_all') then
    create policy exit_dr_access_service_all on public.exit_data_room_access_log for all to service_role using (true) with check (true);
  end if;
end$$;

insert into storage.buckets (id, name, public)
values ('exit-data-room', 'exit-data-room', false)
on conflict (id) do nothing;
