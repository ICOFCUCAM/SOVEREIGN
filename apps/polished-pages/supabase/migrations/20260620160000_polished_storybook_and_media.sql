-- Allow saving illustrated picture books (storybooks / colouring books).
alter table polished.documents drop constraint if exists documents_kind_check;
alter table polished.documents add constraint documents_kind_check
  check (kind in ('cv','cover-letter','book','tailored','cover','storybook'));

create or replace function public.polished_save_document(
  p_kind text, p_title text, p_template text, p_payload jsonb, p_preview text
) returns uuid
language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_kind not in ('cv','cover-letter','book','tailored','cover','storybook') then raise exception 'invalid kind'; end if;
  insert into polished.documents(user_id, kind, title, template, payload, preview)
  values (v_uid, p_kind, coalesce(nullif(btrim(p_title), ''), 'Untitled'), p_template, p_payload, left(coalesce(p_preview, ''), 400))
  returning id into v_id;
  return v_id;
end; $$;

-- Per-user media bucket for illustration images (public read; write/delete only
-- within your own uid-prefixed folder). Keeps document rows small (URLs, not
-- megabytes of base64).
insert into storage.buckets (id, name, public)
values ('polished-media', 'polished-media', true)
on conflict (id) do nothing;

drop policy if exists "polished_media_read" on storage.objects;
drop policy if exists "polished_media_insert_own" on storage.objects;
drop policy if exists "polished_media_delete_own" on storage.objects;

create policy "polished_media_read" on storage.objects
  for select using (bucket_id = 'polished-media');
create policy "polished_media_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'polished-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "polished_media_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'polished-media' and (storage.foldername(name))[1] = auth.uid()::text);
