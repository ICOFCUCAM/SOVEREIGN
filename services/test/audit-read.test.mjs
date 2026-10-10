// Audit read — a SERVICE credential holding dispatch:audit reads its own
// tenant's evidence trail (previously it always received an empty list: the
// M7 audit_read RLS policy admits auditor/tenant_admin and service principals
// run as role "service"). Also proves tenant isolation and the scope gate:
//   • tenant A's audit credential sees A's events — never tenant B's;
//   • a credential without dispatch:audit is refused (403);
//   • the trail stays append-only (unchanged; covered by the M4 trigger).
// Assumes the API on :8787 (self-serve signup enabled).
import crypto from "node:crypto";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.authorization = "Bearer " + token;
  if (body !== undefined) headers["content-type"] = "application/json";
  if (method === "POST" && path === "/v1/documents") headers["idempotency-key"] = crypto.randomUUID();
  const r = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch { /* non-json */ }
  return { status: r.status, body: j };
}
const token = async (id, secret) => (await call("POST", "/v1/token", { body: { client_id: id, secret } })).body?.access_token;

const briefing = (tenantId, title) => ({
  schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(), source: { system: "saas-ui", tenantId },
  document: { ddmVersion: "1.0", docType: "executive_briefing", metadata: { title, date: "2026-10-10", status: "final" },
    classification: { scheme: "none", level: "UNCLASSIFIED" },
    sections: [
      { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF.", style: "lead" }] },
      { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "J1" }] }] },
      { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
      { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Proceed." }] },
    ] },
  outputs: ["pdf"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 3600 },
});

// A tenant with one submitted record and two service credentials: the signup
// owner (no audit scope) and an auditor credential issued through the admin API.
async function tenant(name) {
  const su = (await call("POST", "/v1/signup", { body: { name } })).body;
  const owner = await token(su.client_id, su.secret);
  const doc = await call("POST", "/v1/documents", { token: owner, body: briefing(su.tenantId, `${name} record`) });
  const issued = await call("POST", "/v1/admin/clients", { token: owner, body: { name: "Compliance export", scopes: ["dispatch:read", "dispatch:audit"] } });
  return { tenantId: su.tenantId, owner, documentId: doc.body?.documentId, issued };
}

async function main() {
  console.log("== Audit read (service credential with dispatch:audit) ==");
  const run = crypto.randomBytes(3).toString("hex");
  const A = await tenant(`Audit Ministry A ${run}`);
  const B = await tenant(`Audit Ministry B ${run}`);
  ok(A.documentId && B.documentId, "each tenant submitted a record (events written)");
  ok(A.issued.status === 200 || A.issued.status === 201, `tenant admin issued an audit-scoped service credential (${A.issued.status})`);

  const auditorA = await token(A.issued.body.client_id, A.issued.body.secret);
  const r = await call("GET", "/v1/audit?limit=200", { token: auditorA });
  ok(r.status === 200, "GET /v1/audit → 200");
  const events = r.body?.events ?? [];
  ok(events.length > 0, `service credential with dispatch:audit sees its trail (${events.length} events)`);
  ok(events.some((e) => e.targetId === A.documentId), "trail includes tenant A's own record");
  ok(!events.some((e) => e.targetId === B.documentId), "trail never includes tenant B's record (tenant isolation)");

  const byTarget = await call("GET", `/v1/audit?target=${B.documentId}`, { token: auditorA });
  ok(byTarget.status === 200 && byTarget.body.events.length === 0, "filtering by another tenant's record id returns nothing");

  const refused = await call("GET", "/v1/audit", { token: A.owner });
  ok(refused.status === 403, "a credential without dispatch:audit is refused (403)");

  console.log(`\n  ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
