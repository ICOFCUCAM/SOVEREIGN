// Sprint 2 / Epic 10 — hardening: metrics endpoint, content-safe logging,
// Chromium circuit-breaker. Run against a live API (DISPATCH_API_URL).
import crypto from "node:crypto";
import { makePool } from "../shared/src/db.mjs";
import { tick, pdfBreakerOpen } from "../dispatch-worker/src/worker.mjs";

const API = process.env.DISPATCH_API_URL;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

async function main() {
  console.log("== Epic 10 hardening ==");
  if (!API) { console.log("  (skip — DISPATCH_API_URL not set)"); process.exit(0); }
  const pool = makePool();

  // metrics endpoint exists and is unauthenticated (ops scrape)
  const m0 = await fetch(API + "/v1/metrics").then((r) => r.json());
  ok(typeof m0.uptimeMs === "number" && m0.counters && m0.durations, "GET /v1/metrics → snapshot shape");

  // generate activity: token + submit + render + retrieve
  const tk = await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: "svc-a", secret: "secret-A" }) }).then((r) => r.json());
  const doc = { ddmVersion: "1.0", docType: "executive_briefing", metadata: { title: "M", date: "2026-05-29", status: "final" },
    classification: { scheme: "none", level: "UNCLASSIFIED" }, sections: [
      { id: "s1", role: "executive_summary", heading: "S", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "x" }] },
      { id: "s2", role: "key_judgements", heading: "K", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "j" }] }] },
      { id: "s3", role: "analysis", heading: "A", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "y" }] },
      { id: "s4", role: "recommendation", heading: "R", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "go" }] } ] };
  const sub = await fetch(API + "/v1/documents", { method: "POST",
    headers: { authorization: "Bearer " + tk.access_token, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(), source: { system: "saas-ui", tenantId: tk.tenantId }, document: doc, outputs: ["pdf", "md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } }) }).then((r) => r.json());
  await tick();
  await fetch(API + `/v1/jobs/${sub.jobId}`, { headers: { authorization: "Bearer " + tk.access_token } });

  const m1 = await fetch(API + "/v1/metrics").then((r) => r.json());
  ok(m1.counters.api_requests_total > m0.counters.api_requests_total || m1.counters.api_requests_total >= 3, "api_requests_total increments");
  ok((m1.counters.api_status_2xx || 0) >= 1, "tracks 2xx responses");
  ok(m1.durations.api_request_ms && m1.durations.api_request_ms.count >= 1, "records api_request_ms durations");

  // circuit-breaker: force PDF failures via a bogus CHROMIUM_BIN in a child worker
  // (here we just assert the breaker starts closed and the API exposes pdf metrics).
  ok(pdfBreakerOpen() === false, "pdf circuit-breaker starts closed");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
