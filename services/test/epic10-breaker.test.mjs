// Epic 10 — Chromium circuit-breaker opens after repeated PDF failures.
// Runs with CHROMIUM_BIN=/bin/false so every PDF render genuinely fails; submits
// 3 pdf jobs and asserts the breaker opens (and md still renders → partial).
// Requires a live API (DISPATCH_API_URL) + this process to share the DB.
import crypto from "node:crypto";
import { makePool } from "../shared/src/db.mjs";
import { tick, pdfBreakerOpen } from "../dispatch-worker/src/worker.mjs";

const API = process.env.DISPATCH_API_URL;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

const doc = { ddmVersion: "1.0", docType: "executive_briefing", metadata: { title: "B", date: "2026-05-29", status: "final" },
  classification: { scheme: "none", level: "UNCLASSIFIED" }, sections: [
    { id: "s1", role: "executive_summary", heading: "S", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "x" }] },
    { id: "s2", role: "key_judgements", heading: "K", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "j" }] }] },
    { id: "s3", role: "analysis", heading: "A", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "y" }] },
    { id: "s4", role: "recommendation", heading: "R", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "go" }] } ] };

async function main() {
  console.log("== Epic 10 Chromium circuit-breaker ==");
  if (!API) { console.log("  (skip — DISPATCH_API_URL not set)"); process.exit(0); }
  const pool = makePool();
  const tk = await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: "svc-a", secret: "secret-A" }) }).then((r) => r.json());

  ok(pdfBreakerOpen() === false, "breaker starts closed");

  let lastJob;
  for (let i = 0; i < 3; i++) {
    const sub = await fetch(API + "/v1/documents", { method: "POST",
      headers: { authorization: "Bearer " + tk.access_token, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(), source: { system: "saas-ui", tenantId: tk.tenantId }, document: doc, outputs: ["pdf", "md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } }) }).then((r) => r.json());
    await tick(); // renders in THIS process (CHROMIUM_BIN=/bin/false here) → pdf fails, md ok
    lastJob = sub.jobId;
  }

  const job = await fetch(API + `/v1/jobs/${lastJob}`, { headers: { authorization: "Bearer " + tk.access_token } }).then((r) => r.json());
  ok(job.status === "partial", `pdf fails but md succeeds → partial (got ${job.status})`);
  ok(job.result.artifacts.some((a) => a.format === "md") && !job.result.artifacts.some((a) => a.format === "pdf"), "md delivered, pdf isolated");
  ok(pdfBreakerOpen() === true, "breaker OPEN after 3 consecutive pdf failures");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
