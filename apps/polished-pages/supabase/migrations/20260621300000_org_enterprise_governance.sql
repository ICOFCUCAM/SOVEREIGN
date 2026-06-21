-- Phase E — Enterprise governance. Full auditability (a deeper audit query for
-- the audit trail view + export) and ownership transfer (a clean enterprise
-- handoff). Both are permission-checked server-side.

-- Fuller audit log for the dedicated audit-trail view and CSV export. Manager
-- only, bounded to a sane maximum.
create or replace function public.polished_org_audit_log(p_org uuid, p_limit int default 200)
returns table(id uuid, actor_email text, action text, detail text, created_at timestamptz)
language sql security definer set search_path to 'public','polished','auth' as $$
  select a.id, u.email, a.action, a.detail, a.created_at
  from polished.organization_audit a
  left join auth.users u on u.id = a.actor
  where a.org_id = p_org and polished.org_can_manage(p_org)
  order by a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 1000));
$$;

-- Transfer ownership to another member. Only an owner can do it; the new owner
-- is promoted and the previous owner steps down to admin. Logged for the audit
-- trail. The organization always retains an owner.
create or replace function public.polished_org_transfer_ownership(p_org uuid, p_user uuid)
returns void language plpgsql security definer set search_path to 'public','polished','auth' as $$
declare v_caller uuid := auth.uid(); v_email text;
begin
  if polished.org_role(p_org) <> 'owner' then raise exception 'Only an owner can transfer ownership'; end if;
  if not exists (select 1 from polished.organization_members where org_id = p_org and user_id = p_user) then
    raise exception 'That person is not a member of this organization';
  end if;
  if p_user = v_caller then raise exception 'You already own this organization'; end if;
  update polished.organization_members set role = 'owner' where org_id = p_org and user_id = p_user;
  update polished.organization_members set role = 'admin' where org_id = p_org and user_id = v_caller;
  select email into v_email from auth.users where id = p_user;
  perform polished.org_log(p_org, 'org.ownership_transferred', coalesce(v_email, 'a member'));
end; $$;

grant execute on function public.polished_org_audit_log(uuid, int) to authenticated;
grant execute on function public.polished_org_transfer_ownership(uuid, uuid) to authenticated;
