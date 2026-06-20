-- Character Bible: persistent character profiles beyond just a look — add
-- personality, relationships and age so a recurring cast stays consistent
-- (and can age across a series).
alter table polished.story_characters add column if not exists personality text;
alter table polished.story_characters add column if not exists relationships text;
alter table polished.story_characters add column if not exists age text;

drop function if exists public.polished_save_character(text, text);
create function public.polished_save_character(
  p_name text, p_appearance text,
  p_personality text default null, p_relationships text default null, p_age text default null
) returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name),'') = '' or coalesce(btrim(p_appearance),'') = '' then
    raise exception 'name and appearance are required';
  end if;
  insert into polished.story_characters(user_id, name, appearance, personality, relationships, age)
    values (v_uid, btrim(p_name), btrim(p_appearance),
            nullif(btrim(p_personality),''), nullif(btrim(p_relationships),''), nullif(btrim(p_age),''))
    returning id into v_id;
  return v_id;
end; $$;

drop function if exists public.polished_list_characters();
create function public.polished_list_characters()
returns table(id uuid, name text, appearance text, personality text, relationships text, age text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select c.id, c.name, c.appearance, c.personality, c.relationships, c.age, c.created_at
  from polished.story_characters c
  where c.user_id = auth.uid()
  order by c.created_at desc limit 100;
$$;

revoke all on function public.polished_save_character(text, text, text, text, text) from public, anon;
revoke all on function public.polished_list_characters() from public, anon;
grant execute on function public.polished_save_character(text, text, text, text, text) to authenticated;
grant execute on function public.polished_list_characters() to authenticated;
