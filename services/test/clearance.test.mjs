// Classification enforcement — clearance gating on reads (activates inert
// clearance fields). Unit: clearanceAllows ladder. E2E: with
// DISPATCH_ENFORCE_CLEARANCE=1, a 'secret'-cleared client reads an
// OFFICIAL-SENSITIVE doc/artifact; a 'none' client is 403'd; grant-mint is gated.
import crypto from "node:crypto";
import pgpkg from "pg";
import { clearanceAllows, isUnclassified } from "../shared/src/clearance.mjs";

const API = process.env.DISPATCH_API_URL;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

const brief = (tenantId, level = "OFFICIAL-SENSITIVE", scheme = "uk_gov") => ({
  schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(),
  source: { system: "emergency-ai", tenantId },
  document: { ddmVersion: "1.0", docType: "executive_briefing",
    metadata: { title: "Clearance Brief", date: "2026-05-29", status: "final" },
    classification: { scheme, level },
    sections: [
      { id: "s1", role: "executive_summary", heading: "S", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "x" }] },
      { id: "s2", role: "key_judgements", heading: "K", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "j" }] }] },
      { id: "s3", role: "analysis", heading: "A", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "y" }] },
      { id: "s4", role: "recommendation", heading: "R", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "go" }] },
    ] },
  outputs: ["md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } });

async function token(id, secret) {
  return fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: id, secret }) }).then((r) => r.json());
}
async function submit(tok, tenantId) {
  const body = brief(tenantId);
  return fetch(API + "/v1/documents", { method: "POST", headers: { authorization: "Bearer " + tok, "content-type": "application/json", "idempotency-key": body.idempotencyKey }, body: JSON.stringify(body) }).then((r) => r.json());
}

async function main() {
  console.log("== classification enforcement (clearance) ==");
  // unit (enforcement on for the pure check)
  process.env.DISPATCH_ENFORCE_CLEARANCE = "1";
  ok(clearanceAllows("secret", { scheme: "uk_gov", level: "OFFICIAL-SENSITIVE" }).allowed, "unit: secret ≥ official-sensitive");
  ok(!clearanceAllows("none", { scheme: "uk_gov", level: "SECRET" }).allowed, "unit: none < secret");
  ok(clearanceAllows("none", { scheme: "none", level: "UNCLASSIFIED" }).allowed, "unit: unclassified open");
  ok(isUnclassified("uk_gov", "UNCLASSIFIED"), "unit: isUnclassified");

  if (!API) { console.log("  (skip e2e — DISPATCH_API_URL not set)"); console.log(`\nTOTAL: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }
  const TA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const admin = new pgpkg.Pool({ host: process.env.PGHOST || "localhost", port: Number(process.env.PGPORT || 5432), user: "postgres", password: process.env.PGADMIN_PASSWORD || "postgres", database: process.env.PGDATABASE || "dispatch", max: 2 });

  // Two clients in tenant A: svc-a (we set clearance=secret), svc-low (clearance=none)
  await admin.query("update dispatch.service_clients set clearance='secret' where client_id='svc-a'");
  const lowId = "svc-low-" + crypto.randomUUID().slice(0, 6);
  await admin.query("insert into dispatch.service_clients (tenant_id, name, client_id, secret_hash, scopes, clearance) values ($1,$2,$3,encode(digest($4,'sha256'),'hex'),$5,'none')",
    [TA, "low", lowId, "low-secret", ["dispatch:validate", "dispatch:render", "dispatch:read"]]);

  // Submit an OFFICIAL-SENSITIVE briefing as svc-a, render it.
  const tokA = (await token("svc-a", "secret-A")).access_token;
  const sub = await submit(tokA, TA);
  ok(!!sub.jobId, "submit OFFICIAL-SENSITIVE briefing → jobId");
  // render in this process (worker import) — but the API runs separately, so use a worker tick here:
  const { tick } = await import("../dispatch-worker/src/worker.mjs?cl=" + Date.now());
  await tick();

  const jobA = await fetch(API + `/v1/jobs/${sub.jobId}`, { headers: { authorization: "Bearer " + tokA } }).then((r) => r.json());
  ok(jobA.status === "succeeded", "svc-a (secret) reads its OFFICIAL-SENSITIVE job → succeeded");
  const aid = jobA.result.artifacts[0].artifactId;
  const artA = await fetch(API + `/v1/artifacts/${aid}`, { headers: { authorization: "Bearer " + tokA } });
  ok(artA.status === 200, "svc-a (secret) downloads the artifact → 200");

  // Low-clearance client in the SAME tenant must be blocked (RLS lets it see the
  // row; clearance gate must 403).
  const tokLow = (await token(lowId, "low-secret")).access_token;
  const jobLow = await fetch(API + `/v1/jobs/${sub.jobId}`, { headers: { authorization: "Bearer " + tokLow } });
  ok(jobLow.status === 403, "svc-low (none) reading OFFICIAL-SENSITIVE job → 403");
  const jb = await jobLow.json();
  ok(jb.error?.code === "INSUFFICIENT_CLEARANCE", "  → INSUFFICIENT_CLEARANCE");
  const artLow = await fetch(API + `/v1/artifacts/${aid}`, { headers: { authorization: "Bearer " + tokLow } });
  ok(artLow.status === 403, "svc-low (none) downloading the artifact → 403");
  const grantLow = await fetch(API + `/v1/artifacts/${aid}/grant`, { method: "POST", headers: { authorization: "Bearer " + tokLow } });
  ok(grantLow.status === 403, "svc-low (none) minting a download grant → 403 (gate at mint)");

  await admin.end();
  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
