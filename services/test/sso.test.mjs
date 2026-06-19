// Human SSO — Supabase user JWT path.
//   - a user JWT is accepted; ROLE + CLEARANCE come from the membership row,
//     NOT the token (a token asserting tenant_admin/top_secret is ignored).
//   - no membership in the tenant → 403 NO_MEMBERSHIP.
//   - disabled membership → 403 MEMBERSHIP_DISABLED.
//   - /v1/whoami reflects the resolved principal.
//   - an SSO user with approve scope can act on the governance surface.
import crypto from "node:crypto";
import pgpkg from "pg";
import { signJwt } from "../shared/src/jwt.mjs";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
const SECRET = process.env.SUPABASE_JWT_SECRET || "supabase-test-secret-32-bytes-minimum";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const admin = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432), user: "postgres", database: process.env.PGDATABASE || "dispatch", max: 3 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

// Mint a Supabase-style user token (HS256, principal_type omitted → user path).
function userToken(sub, tenantId, extra = {}) {
  return signJwt({ sub, tenant_id: tenantId, ...extra }, SECRET, { expiresIn: 900, issuer: process.env.DISPATCH_TOKEN_ISSUER || "sovereign-dispatch" });
}
async function whoami(token) {
  const r = await fetch(API + "/v1/whoami", { headers: { authorization: "Bearer " + token } });
  return { status: r.status, json: await r.json().catch(() => null) };
}

async function main() {
  console.log("== human SSO (Supabase user JWT) ==");

  const approverId = crypto.randomUUID();
  const adminId = crypto.randomUUID();
  const disabledId = crypto.randomUUID();
  const strangerId = crypto.randomUUID();

  // seed memberships in tenant A
  await admin.query(`insert into dispatch.memberships (tenant_id, user_id, role, clearance, status) values
     ($1,$2,'approver','secret','active'),
     ($1,$3,'tenant_admin','top_secret','active'),
     ($1,$4,'author','none','disabled')
     on conflict (tenant_id,user_id) do update set role=excluded.role, clearance=excluded.clearance, status=excluded.status`,
    [TENANT_A, approverId, adminId, disabledId]);

  // 1. membership-authoritative role/clearance
  const w1 = await whoami(userToken(approverId, TENANT_A));
  ok(w1.status === 200 && w1.json.role === "approver" && w1.json.clearance === "secret" && w1.json.principalType === "user", `approver SSO → role/clearance from membership (role=${w1.json?.role})`);
  ok(Array.isArray(w1.json.scopes) && w1.json.scopes.includes("dispatch:approve"), "approver scopes derived from role");

  // 2. token cannot self-escalate: assert tenant_admin + top_secret in the token
  const w2 = await whoami(userToken(approverId, TENANT_A, { role: "tenant_admin", dispatch_role: "tenant_admin", clearance: "top_secret", scopes: ["dispatch:admin"] }));
  ok(w2.status === 200 && w2.json.role === "approver" && w2.json.clearance === "secret" && !w2.json.scopes.includes("dispatch:admin"),
    "token-asserted role/clearance/scopes are IGNORED (membership wins)");

  // 3. tenant_admin membership → admin scope
  const w3 = await whoami(userToken(adminId, TENANT_A));
  ok(w3.status === 200 && w3.json.role === "tenant_admin" && w3.json.scopes.includes("dispatch:admin"), "tenant_admin SSO → admin scope");

  // 4. no membership in this tenant → 403
  const w4 = await whoami(userToken(strangerId, TENANT_A));
  ok(w4.status === 403 && w4.json.error.code === "NO_MEMBERSHIP", "no membership → 403 NO_MEMBERSHIP");

  // 5. membership exists in A but token claims tenant B (no membership there) → 403
  const w5 = await whoami(userToken(approverId, TENANT_B));
  ok(w5.status === 403 && w5.json.error.code === "NO_MEMBERSHIP", "wrong-tenant token → 403 (no cross-tenant leak)");

  // 6. disabled membership → 403
  const w6 = await whoami(userToken(disabledId, TENANT_A));
  ok(w6.status === 403 && w6.json.error.code === "MEMBERSHIP_DISABLED", "disabled membership → 403 MEMBERSHIP_DISABLED");

  // 7. bad signature → 401
  const forged = userToken(approverId, TENANT_A).slice(0, -3) + "xxx";
  const w7 = await whoami(forged);
  ok(w7.status === 401, "tampered token → 401");

  // 8. an SSO approver can read the approvals inbox (scope works end-to-end)
  const inbox = await fetch(API + "/v1/approvals?state=pending", { headers: { authorization: "Bearer " + userToken(approverId, TENANT_A) } });
  ok(inbox.status === 200, "SSO approver can call /v1/approvals (scope enforced via membership)");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await admin.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
