-- 0003 — App-aware signup triggers (applied to the SOVEREIGN Supabase project).
--
-- Polished Pages is a separate consumer product that shares this project's auth.
-- Its signups are tagged raw_user_meta_data.app = 'polished_pages' (see the
-- Polished Pages AuthGate). The institutional signup triggers skip those users
-- entirely, so a Polished Pages consumer is never written into the platform's
-- public.user_roles or the back-office public.bo_user_profiles. Non-PP signups
-- behave exactly as before. This gives logical isolation (partitioned
-- authorization) without a separate Supabase project.

create or replace function public.handle_new_auth_user()
 returns trigger language plpgsql security definer set search_path to 'public', 'auth'
as $function$
declare
  v_existing_admin int;
  v_full_name text;
begin
  if new.raw_user_meta_data->>'app' = 'polished_pages' then
    return new;
  end if;

  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email);
  select count(*) into v_existing_admin from public.user_roles where role = 'admin' and status = 'approved';

  if v_existing_admin = 0 then
    insert into public.user_roles (user_id, email, role, full_name, status, approved_at)
    values (new.id, new.email, 'admin', v_full_name, 'approved', now())
    on conflict (user_id) do nothing;
  else
    insert into public.user_roles (user_id, email, role, full_name, status)
    values (new.id, new.email, 'viewer', v_full_name, 'pending')
    on conflict (user_id) do nothing;
  end if;

  return new;
end $function$;

create or replace function public.bo_bootstrap_first_user()
 returns trigger language plpgsql security definer set search_path to 'public', 'auth'
as $function$
begin
  if new.raw_user_meta_data->>'app' = 'polished_pages' then
    return new;
  end if;

  if not exists (select 1 from public.bo_user_profiles where role = 'superadmin' and status = 'active') then
    insert into public.bo_user_profiles (user_id, role, full_name)
    values (new.id, 'superadmin', coalesce(new.raw_user_meta_data->>'full_name', new.email))
    on conflict (user_id) do nothing;
  end if;
  return new;
end $function$;
