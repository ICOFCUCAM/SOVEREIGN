-- Reusable cast for the Children's Studio: save a character once (name + visual
-- description) and reuse it across storybooks so a recurring hero stays
-- on-model book to book. Scoped per user via auth.uid().
create table if not exists polished.story_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  appearance text not null,
  created_at timestamptz not null default now()
);
create index if not exists story_characters_user_idx on polished.story_characters(user_id, created_at desc);
alter table polished.story_characters enable row level security;

create or replace function public.polished_save_character(p_name text, p_appearance text)
returns uuid language plpgsql security definer set search_path to 'public','polished' as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name),'') = '' or coalesce(btrim(p_appearance),'') = '' then
    raise exception 'name and appearance are required';
  end if;
  insert into polished.story_characters(user_id, name, appearance)
    values (v_uid, btrim(p_name), btrim(p_appearance)) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.polished_list_characters()
returns table(id uuid, name text, appearance text, created_at timestamptz)
language sql security definer set search_path to 'public','polished' as $$
  select c.id, c.name, c.appearance, c.created_at
  from polished.story_characters c
  where c.user_id = auth.uid()
  order by c.created_at desc limit 100;
$$;

create or replace function public.polished_delete_character(p_id uuid)
returns void language plpgsql security definer set search_path to 'public','polished' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from polished.story_characters where id = p_id and user_id = auth.uid();
end; $$;

revoke all on function public.polished_save_character(text, text) from public, anon;
revoke all on function public.polished_list_characters() from public, anon;
revoke all on function public.polished_delete_character(uuid) from public, anon;
grant execute on function public.polished_save_character(text, text) to authenticated;
grant execute on function public.polished_list_characters() to authenticated;
grant execute on function public.polished_delete_character(uuid) to authenticated;
