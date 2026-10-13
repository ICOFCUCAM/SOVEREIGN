-- ExitOS · generated document versions, review workflow and audit trail.
--
-- A version is immutable once written (no update or delete policy). Its review
-- status moves only through exitos_document_action(), which checks who is
-- acting against server-held roles:
--   submit           owner          draft          → in_review
--   withdraw         owner          in_review | counsel_review → draft
--   send_to_counsel  owner          in_review      → counsel_review
--   counsel_reviewed counsel grant  counsel_review → in_review   (records the review)
--   approve          approver grant, not the owner; in_review → approved;
--                    a type that requires counsel review needs a counsel_reviewed event first
-- A newer version of the same type for the same company supersedes the older ones.
-- Execution (signatures) is separate and not represented here: an approved
-- document is approved for use, not executed.
--
-- Rollback:
--   drop function public.exitos_document_action(text, text, text);
--   drop trigger exitos_document_versions_supersede on public.exitos_document_versions;
--   drop function public.exitos_document_versions_supersede();
--   drop table public.exitos_document_events; drop table public.exitos_document_versions;

create table if not exists public.exitos_document_versions (
  id                text primary key,
  owner_account_id  text not null default auth.uid()::text,
  company_id        text,
  type_id           text not null,
  version           integer not null check (version >= 1),
  status            text not null default 'draft'
                    check (status in ('draft', 'in_review', 'counsel_review', 'approved', 'superseded')),
  requires_counsel  boolean not null default false,
  classification    text not null,
  content_hash      text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  source_hash       text not null check (source_hash ~ '^[0-9a-f]{64}$'),
  created_at        timestamptz not null default now(),
  data              jsonb not null,
  unique (owner_account_id, company_id, type_id, version)
);
create index if not exists exitos_document_versions_owner_idx on public.exitos_document_versions (owner_account_id, company_id, type_id, version desc);
alter table public.exitos_document_versions enable row level security;

create table if not exists public.exitos_document_events (
  id          bigint generated always as identity primary key,
  version_id  text not null references public.exitos_document_versions(id),
  account_id  text not null default auth.uid()::text,
  action      text not null check (action in ('generated', 'downloaded', 'rendered_pdf', 'submit', 'withdraw',
                                               'send_to_counsel', 'counsel_reviewed', 'approve', 'superseded')),
  at          timestamptz not null default now(),
  detail      jsonb not null default '{}'::jsonb
);
create index if not exists exitos_document_events_version_idx on public.exitos_document_events (version_id, at);
alter table public.exitos_document_events enable row level security;

-- read: the owner; counsel while a version awaits counsel; approvers while it awaits approval
create policy exitos_doc_versions_read on public.exitos_document_versions for select to authenticated using (
  owner_account_id = auth.uid()::text
  or (status = 'counsel_review' and public.exitos_has_role('counsel'))
  or (status = 'in_review' and public.exitos_has_role('approver'))
);
-- write: the owner adds a new draft version; nothing is ever updated or deleted through the API
create policy exitos_doc_versions_insert on public.exitos_document_versions for insert to authenticated with check (
  owner_account_id = auth.uid()::text and status = 'draft'
);
revoke update, delete on public.exitos_document_versions from anon, authenticated;

create policy exitos_doc_events_read on public.exitos_document_events for select to authenticated using (
  exists (select 1 from public.exitos_document_versions v where v.id = version_id and v.owner_account_id = auth.uid()::text)
  or account_id = auth.uid()::text
);
-- the owner may log what they did with their own version; review actions go through the function
create policy exitos_doc_events_insert on public.exitos_document_events for insert to authenticated with check (
  account_id = auth.uid()::text and action in ('generated', 'downloaded', 'rendered_pdf')
  and exists (select 1 from public.exitos_document_versions v where v.id = version_id and v.owner_account_id = auth.uid()::text)
);
revoke update, delete on public.exitos_document_events from anon, authenticated;

-- a newer version supersedes the older ones of the same type for the same company
create or replace function public.exitos_document_versions_supersede()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  with old as (
    update public.exitos_document_versions
       set status = 'superseded'
     where owner_account_id = new.owner_account_id
       and company_id is not distinct from new.company_id
       and type_id = new.type_id and id <> new.id and status <> 'superseded'
    returning id
  )
  insert into public.exitos_document_events (version_id, account_id, action, detail)
  select id, new.owner_account_id, 'superseded', jsonb_build_object('by', new.id) from old;
  return new;
end;
$$;
create trigger exitos_document_versions_supersede after insert on public.exitos_document_versions
  for each row execute function public.exitos_document_versions_supersede();
revoke execute on function public.exitos_document_versions_supersede() from public, anon, authenticated;

create or replace function public.exitos_document_action(p_version_id text, p_action text, p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v public.exitos_document_versions;
  me text := auth.uid()::text;
  next_status text;
begin
  if me is null then raise exception 'sign in to act on a document'; end if;
  select * into v from public.exitos_document_versions where id = p_version_id for update;
  if not found then raise exception 'no such document version'; end if;

  if p_action = 'submit' then
    if v.owner_account_id <> me then raise exception 'only the owner can submit for review'; end if;
    if v.status <> 'draft' then raise exception 'only a draft can be submitted (status is %)', v.status; end if;
    next_status := 'in_review';
  elsif p_action = 'withdraw' then
    if v.owner_account_id <> me then raise exception 'only the owner can withdraw'; end if;
    if v.status not in ('in_review', 'counsel_review') then raise exception 'nothing to withdraw (status is %)', v.status; end if;
    next_status := 'draft';
  elsif p_action = 'send_to_counsel' then
    if v.owner_account_id <> me then raise exception 'only the owner can send to counsel'; end if;
    if v.status <> 'in_review' then raise exception 'only a version in review can go to counsel (status is %)', v.status; end if;
    next_status := 'counsel_review';
  elsif p_action = 'counsel_reviewed' then
    if not public.exitos_has_role('counsel') then raise exception 'counsel review needs a counsel grant'; end if;
    if v.status <> 'counsel_review' then raise exception 'this version is not awaiting counsel (status is %)', v.status; end if;
    next_status := 'in_review';
  elsif p_action = 'approve' then
    if not public.exitos_has_role('approver') then raise exception 'approval needs an approver grant'; end if;
    if v.owner_account_id = me then raise exception 'the owner cannot approve their own document'; end if;
    if v.status <> 'in_review' then raise exception 'only a version in review can be approved (status is %)', v.status; end if;
    if v.requires_counsel and not exists (
      select 1 from public.exitos_document_events e where e.version_id = v.id and e.action = 'counsel_reviewed'
    ) then raise exception 'this document needs counsel review before approval'; end if;
    next_status := 'approved';
  else
    raise exception 'unknown action %', p_action;
  end if;

  update public.exitos_document_versions set status = next_status where id = v.id;
  insert into public.exitos_document_events (version_id, account_id, action, detail)
  values (v.id, me, p_action, jsonb_build_object('from', v.status, 'to', next_status, 'note', p_note));
  return next_status;
end;
$$;
revoke all on function public.exitos_document_action(text, text, text) from public, anon;
grant execute on function public.exitos_document_action(text, text, text) to authenticated;
