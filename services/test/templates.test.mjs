// Tenant document templates (scaffolds).
//   - admin gating + upsert/list/delete templates (dispatch:admin).
//   - a CUSTOM docType added by a tenant validates (was DOC_TYPE_UNSUPPORTED).
//   - OVERRIDING a built-in docType changes its required roles (a doc valid
//     under the built-in becomes SCAFFOLD_INCOMPLETE under the override).
//   - GET /v1/doctypes returns the effective set (built-ins + tenant).
//   - deleting the override reverts to the built-in.
//   - tenant isolation: tenant B's template does not affect tenant A.
import crypto from "node:crypto";
import pgpkg from "pg";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const admin = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432), user: "postgres", database: process.env.PGDATABASE || "dispatch", max: 3 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

const T = (role) => `user ${TENANT_A}:${role}`;
async function api(method, path, { token, body } = {}) {
  const headers = {}; if (token) headers.authorization = "Bearer " + token; if (body) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, json: ct.includes("json") ? await r.json().catch(() => null) : null };
}
// a minimal, SCHEMA-VALID request with the given docType + section roles.
// The built-in executive_briefing requires a `callout` block in its
// recommendation section (blockPolicy), so emit one there; everything else is a
// paragraph. Custom roles are plain paragraphs.
const blockFor = (role, i) => role === "recommendation"
  ? { id: "b" + i, type: "callout", style: "recommendation", text: "go" }
  : { id: "b" + i, type: "paragraph", text: "x" };
const reqWith = (docType, roles) => ({ schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(),
  source: { system: "saas-ui", tenantId: TENANT_A },
  document: { ddmVersion: "1.0", docType, metadata: { title: "T", date: "2026-05-30", status: "final" },
    classification: { scheme: "none", level: "UNCLASSIFIED" },
    sections: roles.map((role, i) => ({ id: "s" + i, role, heading: role, level: 1, blocks: [blockFor(role, i)] })) },
  outputs: ["md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } });

async function main() {
  console.log("== tenant templates / scaffolds ==");
  // clean slate for deterministic assertions
  await admin.query("delete from dispatch.templates where tenant_id=$1", [TENANT_A]);

  // gating
  const denied = await api("GET", "/v1/admin/templates", { token: T("author") });
  ok(denied.status === 403, "non-admin denied /v1/admin/templates (403)");

  // a custom docType is unknown before any template
  const before = await api("POST", "/v1/validate", { token: T("tenant_admin"), body: reqWith("incident_report", ["timeline", "impact"]) });
  ok(before.json && before.json.valid === false && before.json.errors.some((e) => e.code === "DOC_TYPE_UNSUPPORTED"), "custom docType unknown before template → DOC_TYPE_UNSUPPORTED");

  // add a custom template
  const add = await api("POST", "/v1/admin/templates", { token: T("tenant_admin"),
    body: { docType: "incident_report", title: "Incident Report", requiredRoles: ["timeline", "impact"], optionalRoles: ["annex"] } });
  ok(add.status === 200 && add.json.docType === "incident_report", "upsert custom template → 200");

  // now it validates when the required roles are present, and fails when missing
  const okDoc = await api("POST", "/v1/validate", { token: T("tenant_admin"), body: reqWith("incident_report", ["timeline", "impact"]) });
  ok(okDoc.json.valid === true, "custom docType validates with required roles present");
  const missDoc = await api("POST", "/v1/validate", { token: T("tenant_admin"), body: reqWith("incident_report", ["timeline"]) });
  ok(missDoc.json.valid === false && missDoc.json.errors.some((e) => /impact/.test(e.message)), "custom docType missing a required role → SCAFFOLD_INCOMPLETE");

  // override a BUILT-IN docType (executive_briefing) with stricter roles
  const builtinOkBefore = await api("POST", "/v1/validate", { token: T("tenant_admin"), body: reqWith("executive_briefing", ["executive_summary", "key_judgements", "analysis", "recommendation"]) });
  ok(builtinOkBefore.json.valid === true, "built-in executive_briefing valid under default scaffold");
  await api("POST", "/v1/admin/templates", { token: T("tenant_admin"),
    body: { docType: "executive_briefing", title: "Exec Briefing (strict)", requiredRoles: ["executive_summary", "key_judgements", "analysis", "recommendation", "legal_review"] } });
  const builtinAfter = await api("POST", "/v1/validate", { token: T("tenant_admin"), body: reqWith("executive_briefing", ["executive_summary", "key_judgements", "analysis", "recommendation"]) });
  ok(builtinAfter.json.valid === false && builtinAfter.json.errors.some((e) => /legal_review/.test(e.message)), "overriding a built-in adds a new required role");

  // effective doctypes list includes both custom + overridden
  const dt = await api("GET", "/v1/doctypes", { token: T("tenant_admin") });
  ok(dt.status === 200 && dt.json.items.some((i) => i.docType === "incident_report") && dt.json.items.some((i) => i.docType === "executive_briefing"), "/v1/doctypes returns effective set");

  // list shows the override flag
  const list = await api("GET", "/v1/admin/templates", { token: T("tenant_admin") });
  const eb = list.json.items.find((i) => i.docType === "executive_briefing");
  ok(eb && eb.overrides === true, "list marks built-in override as overrides=true");

  // delete the override → reverts to built-in
  const del = await api("DELETE", "/v1/admin/templates/executive_briefing", { token: T("tenant_admin") });
  ok(del.status === 200, "delete override → 200");
  const reverted = await api("POST", "/v1/validate", { token: T("tenant_admin"), body: reqWith("executive_briefing", ["executive_summary", "key_judgements", "analysis", "recommendation"]) });
  ok(reverted.json.valid === true, "after delete, built-in scaffold applies again");

  // tenant isolation: tenant B has no incident_report template
  const tokB = "svc svc-b:secret-B";
  const bDoc = await api("POST", "/v1/validate", { token: tokB, body: { ...reqWith("incident_report", ["timeline", "impact"]), source: { system: "saas-ui", tenantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" } } });
  ok(bDoc.json.valid === false && bDoc.json.errors.some((e) => e.code === "DOC_TYPE_UNSUPPORTED"), "tenant B unaffected by tenant A's custom template");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await admin.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
