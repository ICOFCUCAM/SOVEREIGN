// Sprint 2 / Epic 8 — retrieve endpoints E2E.
// submit → worker renders md → GET /v1/jobs/{id} → GET /v1/artifacts/{id}
// (+ ?disposition=metadata, ?verify=true) → GET /v1/documents/{id}; tenant isolation.
import crypto from "node:crypto";
import { makePool, withClaims } from "../shared/src/db.mjs";
import { tick } from "../dispatch-worker/src/worker.mjs";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const pool = makePool();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

function briefing(tenantId) {
  return { schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(),
    source: { system: "emergency-ai", tenantId, correlationId: "ret-1" },
    document: { ddmVersion: "1.0", docType: "executive_briefing",
      metadata: { title: "Retrieve Test", date: "2026-05-29", status: "final" },
      classification: { scheme: "none", level: "UNCLASSIFIED" },
      sections: [
        { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF." }] },
        { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "J1" }] }] },
        { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
        { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Go." }] },
      ] },
    outputs: ["md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } };
}
const tokA = "svc svc-a:secret-A";
async function req(method, path, { token, idem, body } = {}) {
  const headers = {}; if (token) headers.authorization = "Bearer " + token;
  if (idem) headers["idempotency-key"] = idem; if (body) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, ct, json: ct.includes("json") ? await r.json().catch(() => null) : null, text: ct.includes("json") ? null : await r.text(), headers: r.headers };
}

async function main() {
  console.log("== Epic 8 retrieve endpoints ==");
  // submit
  const b = briefing(TENANT_A);
  const sub = await req("POST", "/v1/documents", { token: tokA, idem: b.idempotencyKey, body: b });
  ok(sub.status === 202 && sub.json.jobId, `submit -> 202 (${sub.json?.jobId?.slice(0,8)})`);
  const jobId = sub.json.jobId;

  // job before render
  const j1 = await req("GET", `/v1/jobs/${jobId}`, { token: tokA });
  ok(j1.status === 200 && j1.json.status === "queued", `GET /v1/jobs queued (status=${j1.json?.status})`);

  // render
  await tick();
  const j2 = await req("GET", `/v1/jobs/${jobId}`, { token: tokA });
  ok(j2.status === 200 && j2.json.status === "succeeded" && j2.json.progress === 100, `GET /v1/jobs succeeded@100`);
  ok(Array.isArray(j2.json.result?.artifacts) && j2.json.result.artifacts.length === 1, "job result carries 1 artifact ref");
  const artifactId = j2.json.result.artifacts[0].artifactId;
  const documentId = j2.json.result.artifacts[0] && sub.json.jobId ? null : null; // documentId fetched below via job

  // artifact metadata
  const meta = await req("GET", `/v1/artifacts/${artifactId}?disposition=metadata`, { token: tokA });
  ok(meta.status === 200 && meta.json.format === "md" && /^[a-f0-9]{64}$/.test(meta.json.sha256), "GET /v1/artifacts ?metadata → md + sha256");

  // artifact bytes
  const bytes = await req("GET", `/v1/artifacts/${artifactId}`, { token: tokA });
  ok(bytes.status === 200 && bytes.ct.includes("text/markdown") && bytes.text.startsWith("# Retrieve Test"), "GET /v1/artifacts streams markdown bytes");
  ok(bytes.headers.get("x-dispatch-sha256") === meta.json.sha256, "artifact stream carries matching sha256 header");

  // verify
  const ver = await req("GET", `/v1/artifacts/${artifactId}?verify=true`, { token: tokA });
  ok(ver.status === 200 && ver.json.verified === true, "GET /v1/artifacts ?verify=true → verified");

  // document view (look up documentId via DB from the job)
  const docId = await withClaims(pool, { tenant_id: TENANT_A, dispatch_role: "service", principal_type: "service", actor: "t" },
    async (c) => (await c.query("select document_id from dispatch.jobs where id=$1", [jobId])).rows[0].document_id);
  const dv = await req("GET", `/v1/documents/${docId}`, { token: tokA });
  ok(dv.status === 200 && dv.json.docType === "executive_briefing" && dv.json.versions.length === 1, "GET /v1/documents → doc + versions + latestResult");
  ok(dv.json.latestResult && dv.json.latestResult.status === "succeeded", "document latestResult present");

  // tenant isolation: tenant B token cannot read tenant A's job/artifact (404, no leak)
  const tokB = "svc svc-b:secret-B";
  const jB = await req("GET", `/v1/jobs/${jobId}`, { token: tokB });
  ok(jB.status === 404, "cross-tenant GET /v1/jobs → 404 (no existence leak)");
  const aB = await req("GET", `/v1/artifacts/${artifactId}`, { token: tokB });
  ok(aB.status === 404, "cross-tenant GET /v1/artifacts → 404");

  // unauthenticated → 401
  const noauth = await req("GET", `/v1/jobs/${jobId}`);
  ok(noauth.status === 401, "unauthenticated GET → 401");

  // unknown id → 404
  const unk = await req("GET", `/v1/jobs/${crypto.randomUUID()}`, { token: tokA });
  ok(unk.status === 404, "unknown job id → 404");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
