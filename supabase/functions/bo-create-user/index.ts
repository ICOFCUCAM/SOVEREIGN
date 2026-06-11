// SOVEREIGN Back Office · create user.
// Superadmin only. Creates the auth.users row (with password) and the
// bo_user_profiles row in one transaction. Audit-logged via the
// profile-insert trigger.
//
// Body: {
//   email: string,
//   password: string,        // initial password; user should rotate on first login
//   fullName: string,
//   role: bo_role,
//   employeeId?: string
// }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ROLES = new Set([
  'superadmin','admin','accountant','auditor',
  'treasurer','controller','payroll_officer','tax_officer',
]);

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status, headers: { ...cors, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST')   return err(405, 'method not allowed');

  // Verify caller is an active superadmin via their JWT.
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return err(401, 'missing authorization');

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !serviceKey) return err(500, 'server not configured');

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Resolve caller from the JWT.
  const userRes = await admin.auth.getUser(jwt);
  if (userRes.error || !userRes.data.user) return err(401, 'invalid token');
  const callerId = userRes.data.user.id;

  // Confirm role.
  const profile = await admin.from('bo_user_profiles').select('role, status').eq('user_id', callerId).maybeSingle();
  if (profile.error)                    return err(500, profile.error.message);
  if (!profile.data)                    return err(403, 'no back-office profile');
  if (profile.data.status !== 'active') return err(403, 'profile suspended');
  if (profile.data.role !== 'superadmin') return err(403, 'superadmin only');

  let body: { email?: string; password?: string; fullName?: string; role?: string; employeeId?: string };
  try { body = await req.json(); } catch { return err(400, 'invalid json'); }

  const email     = String(body.email ?? '').trim().toLowerCase();
  const password  = String(body.password ?? '');
  const fullName  = String(body.fullName ?? '').trim();
  const role      = String(body.role ?? '');
  const employeeId = body.employeeId ? String(body.employeeId) : null;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err(400, 'valid email required');
  if (password.length < 12)                                return err(400, 'password must be ≥ 12 chars');
  if (!fullName)                                            return err(400, 'fullName required');
  if (!ROLES.has(role))                                     return err(400, `role must be one of ${[...ROLES].join(', ')}`);

  // Create the auth user.
  const created = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { bo_role: role },
  });
  if (created.error || !created.data.user) return err(500, `auth create failed: ${created.error?.message ?? 'unknown'}`);

  // The bootstrap trigger may have promoted this user to superadmin if
  // none exists. Idempotent upsert to set the correct role + employee_id.
  const upsert = await admin.from('bo_user_profiles').upsert({
    user_id:     created.data.user.id,
    role,
    full_name:   fullName,
    employee_id: employeeId,
    status:      'active',
    invited_by:  callerId,
  }, { onConflict: 'user_id' });
  if (upsert.error) {
    // Rollback the auth user — keep the system clean.
    await admin.auth.admin.deleteUser(created.data.user.id).catch(() => {});
    return err(500, `profile insert failed: ${upsert.error.message}`);
  }

  return new Response(JSON.stringify({
    ok: true,
    user: {
      id: created.data.user.id,
      email,
      fullName,
      role,
      employeeId,
    },
  }), { status: 201, headers: { ...cors, 'content-type': 'application/json' } });
});
