-- Image Consistency Engine: store a canonical reference image (model sheet) per
-- character, so the same character stays recognizable across books. The
-- illustration engine can pass this reference to keep generations on-model.
alter table polished.story_characters add column if not exists reference_image text;

create or replace function public.polished_set_character_reference(p_id uuid, p_url text)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update polished.story_characters set reference_image = nullif(btrim(p_url), '')
    where id = p_id and user_id = auth.uid();
end; $$;

drop function if exists public.polished_list_characters();
create function public.polished_list_characters()
returns table(id uuid, name text, appearance text, personality text, relationships text, age text, reference_image text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select c.id, c.name, c.appearance, c.personality, c.relationships, c.age, c.reference_image, c.created_at
  from polished.story_characters c
  where c.user_id = auth.uid()
  order by c.created_at desc limit 100;
$$;

revoke all on function public.polished_set_character_reference(uuid, text) from public, anon;
revoke all on function public.polished_list_characters() from public, anon;
grant execute on function public.polished_set_character_reference(uuid, text) to authenticated;
grant execute on function public.polished_list_characters() to authenticated;
