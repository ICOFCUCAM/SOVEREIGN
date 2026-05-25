-- SOVEREIGN migration 0002 — RBAC hardening
-- Applied to Supabase project qvjdivcdefuprnenedje.
--
-- Fixes a privilege-escalation hole: the original "Update own role" policy on
-- public.user_roles allowed any signed-in user to update their own row,
-- including the `role` column — so a viewer could self-promote to admin.
--
-- Strategy: a BEFORE UPDATE trigger blocks any change to `role` unless the
-- caller is an admin (enforced regardless of which UPDATE policy matched),
-- the self-update policy is retained for profile fields, and an explicit
-- admin-override policy lets admins manage any identity's role.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_role_change_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: only admins may change roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_role_change ON public.user_roles;
CREATE TRIGGER trg_enforce_role_change
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_role_change_authority();

DROP POLICY IF EXISTS "Update own role" ON public.user_roles;

CREATE POLICY "Update own profile" ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update any role" ON public.user_roles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
