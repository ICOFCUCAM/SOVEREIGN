-- ExitOS · data-room files tagged to the artifact they satisfy (deliverable 5, finding C-4).
--
-- Before: completeness counted any upload in a room, and the "missing" list matched
-- upload filenames against template names, so three unrelated files made a package
-- 100% complete while every artifact was still listed missing.
--
-- Now each file carries the artifact it is meant to satisfy (an id from the diligence
-- specification, e.g. financial.audited_accounts), the company it belongs to, and a
-- review state. Completeness (exit-engines diligence/room.ts) counts a required artifact
-- only when a file tagged with it, for this company, has been accepted.
--   submitted  uploaded and tagged, not yet reviewed (the default)
--   accepted   the room's owner confirmed it is the document the artifact asks for
--   rejected   the owner found it is not; it does not count
-- Tagging, re-tagging and review go through two owner-only functions; re-tagging returns
-- a file to "submitted". "Accepted" here is the company's own confirmation, not an
-- independent review; that is stated wherever completeness is shown.
--
-- Table privileges are narrowed: anon gets nothing, signed-in users may only read
-- (writes go through the upload function and the two functions below). TRUNCATE in
-- particular is not subject to RLS and is removed from both roles.
--
-- Rollback:
--   drop function public.exit_data_room_tag(uuid, text, text); drop function public.exit_data_room_review(uuid, text, text);
--   alter table public.exit_data_room_documents drop column artifact_id, drop column company_id, drop column review_state,
--     drop column reviewed_by, drop column reviewed_at, drop column review_note;
--   grant all on public.exit_data_room_documents, public.exit_data_room_access_log to anon, authenticated;

alter table public.exit_data_room_documents
  add column if not exists artifact_id  text check (artifact_id ~ '^[a-z]+\.[a-z0-9_]+$'),
  add column if not exists company_id   text check (company_id ~ '^co-[0-9a-f-]{36}$'),
  add column if not exists review_state text not null default 'submitted' check (review_state in ('submitted', 'accepted', 'rejected')),
  add column if not exists reviewed_by  uuid,
  add column if not exists reviewed_at  timestamptz,
  add column if not exists review_note  text;
create index if not exists exit_dr_docs_artifact on public.exit_data_room_documents (tenant_id, company_id, artifact_id);

-- the owner tags (or re-tags) one of their files; re-tagging clears any review
create or replace function public.exit_data_room_tag(p_document uuid, p_artifact text, p_company text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in to tag data-room files'; end if;
  if p_artifact is not null and p_artifact !~ '^[a-z]+\.[a-z0-9_]+$' then raise exception 'not an artifact id: %', p_artifact; end if;
  update public.exit_data_room_documents
     set artifact_id = p_artifact, company_id = p_company,
         review_state = 'submitted', reviewed_by = null, reviewed_at = null, review_note = null
   where id = p_document and tenant_id = auth.uid();
  if not found then raise exception 'no such file in your data room'; end if;
end $$;

-- the owner accepts or rejects a tagged file
create or replace function public.exit_data_room_review(p_document uuid, p_state text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare d public.exit_data_room_documents;
begin
  if auth.uid() is null then raise exception 'sign in to review data-room files'; end if;
  if p_state not in ('accepted', 'rejected') then raise exception 'a review accepts or rejects'; end if;
  select * into d from public.exit_data_room_documents where id = p_document and tenant_id = auth.uid();
  if not found then raise exception 'no such file in your data room'; end if;
  if d.artifact_id is null then raise exception 'tag the file with the artifact it satisfies before reviewing it'; end if;
  update public.exit_data_room_documents
     set review_state = p_state, reviewed_by = auth.uid(), reviewed_at = now(), review_note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_document;
end $$;

revoke all on public.exit_data_room_documents, public.exit_data_room_access_log from anon, authenticated;
grant select on public.exit_data_room_documents, public.exit_data_room_access_log to authenticated;
revoke all on function public.exit_data_room_tag(uuid, text, text), public.exit_data_room_review(uuid, text, text) from public, anon;
grant execute on function public.exit_data_room_tag(uuid, text, text), public.exit_data_room_review(uuid, text, text) to authenticated;
