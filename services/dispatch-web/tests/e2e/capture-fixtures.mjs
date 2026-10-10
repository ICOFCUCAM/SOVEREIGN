#!/usr/bin/env node
// Records real Dispatch API responses as fixtures for the console's browser
// tests, so the suite runs anywhere (CI, laptops) without a database.
//
// Run against a live local stack whose tenant has records in several lifecycle
// states (see services/test/* for how institutions are built through the API):
//
//   E2E_CLIENT_ID=… E2E_CLIENT_SECRET=… [DISPATCH_API=http://127.0.0.1:8787] \
//   [E2E_AUDIT_DSN=postgres://…] node tests/e2e/capture-fixtures.mjs
//
// The credential should carry read/approve/publish/audit scopes. Secrets are
// never written: only response bodies. E2E_AUDIT_DSN is an optional fallback for
// the audit trail — service credentials currently receive no audit rows through
// the API (RLS `audit_read` admits auditor/tenant_admin only), so the events are
// read directly and shaped exactly like GET /v1/audit.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const API = process.env.DISPATCH_API || "http://127.0.0.1:8787";
const { E2E_CLIENT_ID: id, E2E_CLIENT_SECRET: secret, E2E_AUDIT_DSN: dsn } = process.env;
if (!id || !secret) { console.error("E2E_CLIENT_ID and E2E_CLIENT_SECRET are required"); process.exit(1); }

const tok = await (await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: id, secret }) })).json();
if (!tok.access_token) { console.error("token exchange failed", tok); process.exit(1); }
const get = async (p) => { const r = await fetch(API + p, { headers: { authorization: "Bearer " + tok.access_token } }); return { status: r.status, body: await r.json().catch(() => null) }; };

const out = { capturedAt: new Date().toISOString(), scopes: tok.scopes, tenantId: tok.tenantId, singles: {}, documents: [], details: {}, jobs: {}, certificates: {}, governanceCertificates: {}, audit: [] };
for (const p of ["/v1/billing", "/v1/stats", "/v1/governance/overview", "/v1/governance/my-authority", "/v1/governance/policies", "/v1/approvals?state=pending"])
  out.singles[p] = await get(p);

out.documents = (await get("/v1/documents?limit=200")).body.items;
for (const d of out.documents) {
  const det = await get(`/v1/documents/${d.documentId}`);
  out.details[d.documentId] = det.body;
  const jobId = det.body?.latestResult?.jobId;
  if (jobId) out.jobs[jobId] = (await get(`/v1/jobs/${jobId}`)).body;
  if (d.lifecycle === "archived") out.certificates[d.documentId] = (await get(`/v1/documents/${d.documentId}/certificate`)).body;
  if (d.lifecycle === "published" || d.lifecycle === "archived") {
    const g = await get(`/v1/documents/${d.documentId}/governance-certificate`);
    if (g.status === 200) out.governanceCertificates[d.documentId] = g.body;
  }
}

out.audit = (await get("/v1/audit?limit=1000")).body?.events ?? [];
if (out.audit.length === 0 && dsn) {
  const sql = `select coalesce(json_agg(json_build_object('eventId',event_id,'actor',actor,'actorType',actor_type,'action',action,'targetType',target_type,'targetId',target_id,'classification',classification,'requestId',request_id,'correlationId',correlation_id,'sha256',sha256,'ts',ts) order by ts desc),'[]') from dispatch.audit_events where tenant_id='${tok.tenantId.replace(/[^0-9a-f-]/gi, "")}'`;
  out.audit = JSON.parse(execFileSync("psql", [dsn, "-At", "-c", sql], { encoding: "utf8" }));
}

const file = new URL("./fixtures/api.json", import.meta.url);
writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
const states = out.documents.reduce((m, d) => ((m[d.lifecycle] = (m[d.lifecycle] ?? 0) + 1), m), {});
console.log(`captured ${out.documents.length} records`, states, `${out.audit.length} audit events →`, file.pathname);
