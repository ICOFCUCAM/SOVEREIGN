// Provisioning e2e — "how a government or bank gets an account and a secret".
// Proves the whole credentialing process end to end:
//   operator provisions a tenant → issues a credential → the institution mints a
//   token → a tenant_admin self-services more credentials → rotation kills the
//   old secret → revocation kills the credential. Plus the security negatives.
//
// Assumes the API is running on :8787 (CI starts it) and a superuser admin pool
// (same pattern as sprint1-e2e). Run: node test/provisioning.test.mjs
import pgpkg from "pg";
import { withClaims } from "../shared/src/db.mjs";
import { provisionTenantTx, seedTenantAdminTx, issueClientTx } from "../shared/src/provisioning.mjs";

const API = "http://127.0.0.1:8787";
const admin = new pgpkg.Pool({
  host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432),
  user: "postgres", password: process.env.PGADMIN_PASSWORD || "postgres",
  database: process.env.PGDATABASE || "dispatch", max: 3,
});
const ADMIN_USER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

async function token(client_id, secret) {
  const r = await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id, secret }) });
  return { status: r.status, json: await r.json().catch(() => null) };
}
async function adminApi(path, tenantId, role, body) {
  const headers = { "authorization": `Bearer user ${tenantId}:${role}` };
  if (body) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
}

async function main() {
  console.log("== Provisioning e2e — account + secret ==");

  // 1. Operator provisions a tenant (superuser, cross-tenant) and seeds a tenant_admin.
  const tenant = await withClaims(admin, {}, (c) => provisionTenantTx(c, { slug: "prov-test-" + Date.now().toString(36), name: "Provisioning Test Bank", edition: "enterprise", residency: "eu", retentionDays: 3650, actor: "operator:test" }));
  ok(!!tenant.id && tenant.edition === "enterprise", `operator provisioned tenant ${tenant.slug} (enterprise/eu)`);
  await withClaims(admin, {}, (c) => seedTenantAdminTx(c, { tenantId: tenant.id, userId: ADMIN_USER, actor: "operator:test" }));

  // 2. Operator issues the FIRST credential; the institution mints a token with it.
  const first = await withClaims(admin, {}, (c) => issueClientTx(c, { tenantId: tenant.id, name: "Bootstrap API", scopes: ["dispatch:validate", "dispatch:render", "dispatch:read"], actor: "operator:test", actorType: "system" }));
  ok(first.clientId.startsWith("svc_") && first.secret.startsWith("sdk_"), `operator issued credential ${first.clientId}`);
  const t1 = await token(first.clientId, first.secret);
  ok(t1.status === 200 && (t1.json.access_token || t1.json.token), "institution exchanged credential for a Bearer token");
  ok(t1.json.tenantId === tenant.id, "token is scoped to the institution's tenant");

  // 3. Tenant self-service: a tenant_admin issues another credential via the admin API.
  const issued = await adminApi("/v1/admin/clients", tenant.id, "tenant_admin", { name: "Reporting Pipeline", scopes: ["dispatch:read"] });
  ok(issued.status === 201 && issued.json.secret?.startsWith("sdk_"), "tenant_admin self-issued a credential (201, secret once)");
  const sc = issued.json.client_id, secret2 = issued.json.secret;
  const t2 = await token(sc, secret2);
  ok(t2.status === 200, "self-issued credential mints a token");

  // 4. Rotation invalidates the old secret, the new one works.
  const rot = await adminApi(`/v1/admin/clients/${sc}/rotate`, tenant.id, "tenant_admin", { });
  ok(rot.status === 200 && rot.json.secret && rot.json.secret !== secret2, "rotation returned a new secret");
  ok((await token(sc, secret2)).status === 401, "old secret no longer mints a token after rotation");
  ok((await token(sc, rot.json.secret)).status === 200, "new secret mints a token after rotation");

  // 5. Revocation kills the credential.
  const rev = await adminApi(`/v1/admin/clients/${sc}/revoke`, tenant.id, "tenant_admin", { });
  ok(rev.status === 200 && rev.json.revoked === true, "credential revoked");
  ok((await token(sc, rot.json.secret)).status === 401, "revoked credential can no longer mint a token");

  // 6. Listing shows the credentials (no secrets).
  const list = await adminApi("/v1/admin/clients", tenant.id, "tenant_admin");
  ok(list.status === 200 && Array.isArray(list.json.clients) && list.json.clients.length >= 2 && !("secret_hash" in (list.json.clients[0] || {})), "list returns credentials without secret material");

  // 6b. The console path: the console signs in with a service credential, so an
  // admin-SCOPED service credential must also be able to self-service via the API.
  const adminCred = await withClaims(admin, {}, (c) => issueClientTx(c, { tenantId: tenant.id, name: "Console Admin", scopes: ["dispatch:admin", "dispatch:read"], actor: "operator:test", actorType: "system", allowAdmin: true }));
  const at = await token(adminCred.clientId, adminCred.secret);
  const adminToken = at.json?.access_token || at.json?.token;
  const viaSvc = await fetch(API + "/v1/admin/clients", { method: "POST", headers: { authorization: "Bearer " + adminToken, "content-type": "application/json" }, body: JSON.stringify({ name: "Issued via console", scopes: ["dispatch:read"] }) });
  const viaSvcJson = await viaSvc.json().catch(() => null);
  ok(viaSvc.status === 201 && viaSvcJson?.secret?.startsWith("sdk_"), "admin-scoped service credential can issue via the API (console path)");

  // 7. Security negatives.
  const esc = await adminApi("/v1/admin/clients", tenant.id, "tenant_admin", { name: "Escalation", scopes: ["dispatch:admin"] });
  ok(esc.status === 400 && esc.json.error?.code === "SCOPE_NOT_ISSUABLE", "self-service cannot issue dispatch:admin (no privilege escalation)");
  const nonAdmin = await adminApi("/v1/admin/clients", tenant.id, "author", { name: "Nope", scopes: ["dispatch:read"] });
  ok(nonAdmin.status === 403 && nonAdmin.json.error?.code === "FORBIDDEN_SCOPE", "non-admin role is refused by the admin API");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await admin.end();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => { console.error(e); try { await admin.end(); } catch {} process.exit(1); });
