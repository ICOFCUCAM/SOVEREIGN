// Sprint 2 / Epic 9 — Dispatch console + browser-flow (token query-param download).
// Verifies the static console is served and the exact call sequence a browser
// makes works: /v1/token → /v1/documents → worker → /v1/jobs → artifact download
// via ?token= (the <a>-href path, since anchors can't set Authorization headers).
import crypto from "node:crypto";
import { makePool } from "../shared/src/db.mjs";
import { tick } from "../dispatch-worker/src/worker.mjs";

const API = process.env.DISPATCH_API_URL;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

async function main() {
  console.log("== Epic 9 console + browser flow ==");
  if (!API) { console.log("  (skip — DISPATCH_API_URL not set)"); process.exit(0); }
  const pool = makePool();

  // console page
  const page = await fetch(API + "/");
  const html = await page.text();
  ok(page.status === 200 && (page.headers.get("content-type") || "").includes("text/html"), "GET / serves HTML console");
  ok(html.includes("Sovereign Dispatch") && html.includes("Dispatch →"), "console has title + submit control");
  const fav = await fetch(API + "/favicon.ico");
  ok(fav.status === 204, "favicon → 204");

  // 1. token
  const tk = await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id: "svc-a", secret: "secret-A" }) }).then((r) => r.json());
  ok(tk.access_token && tk.access_token.split(".").length === 3, "POST /v1/token → JWT (access_token)");
  const TOKEN = tk.access_token, TENANT = tk.tenantId;

  // 2. submit (tenant derived from token; console sends source without tenantId)
  const doc = { ddmVersion: "1.0", docType: "executive_briefing",
    metadata: { title: "Console Brief", date: "2026-05-29", status: "final" },
    classification: { scheme: "uk_gov", level: "OFFICIAL-SENSITIVE" },
    sections: [
      { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF." }] },
      { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "J1" }] }] },
      { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
      { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Go." }] },
    ] };
  const sub = await fetch(API + "/v1/documents", { method: "POST",
    headers: { authorization: "Bearer " + TOKEN, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(), source: { system: "saas-ui", tenantId: TENANT },
      document: doc, outputs: ["pdf", "docx", "md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } }) }).then((r) => r.json());
  ok(sub.jobId, "POST /v1/documents → 202 jobId");

  // 3. worker renders all three
  await tick();

  // 4. poll
  const job = await fetch(API + `/v1/jobs/${sub.jobId}`, { headers: { authorization: "Bearer " + TOKEN } }).then((r) => r.json());
  ok(job.status === "succeeded", `job succeeded (status=${job.status})`);
  const arts = job.result.artifacts;
  ok(arts.length === 3, `three artifacts [${arts.map((a) => a.format).join(",")}]`);

  // 5. download each via a single-artifact GRANT (the console's <a> path) — no
  // Authorization header, no full token in the URL.
  for (const a of arts) {
    const g = await fetch(API + `/v1/artifacts/${a.artifactId}/grant`, { method: "POST", headers: { authorization: "Bearer " + TOKEN } }).then((r) => r.json());
    ok(g.downloadUrl && g.downloadUrl.includes("grant="), `mint grant for ${a.format}`);
    const r = await fetch(API + g.downloadUrl);
    const buf = Buffer.from(await r.arrayBuffer());
    const valid = a.format === "pdf" ? buf.slice(0, 5).toString() === "%PDF-"
      : a.format === "docx" ? (buf[0] === 0x50 && buf[1] === 0x4b)
      : buf.toString("utf8").startsWith("#");
    ok(r.status === 200 && valid, `download ${a.format} via grant → 200 + valid bytes (${buf.length}b)`);
  }

  // 6. hardening: a full token in an artifact URL no longer works (?token= dropped)
  const tokInUrl = await fetch(API + `/v1/artifacts/${arts[0].artifactId}?token=${encodeURIComponent(TOKEN)}`);
  ok(tokInUrl.status === 401, "full token in artifact ?token= → 401 (no longer accepted)");

  // 7. a grant for artifact A cannot fetch artifact B
  const gA = await fetch(API + `/v1/artifacts/${arts[0].artifactId}/grant`, { method: "POST", headers: { authorization: "Bearer " + TOKEN } }).then((r) => r.json());
  const grantTok = new URL(API + gA.downloadUrl).searchParams.get("grant");
  const cross = await fetch(API + `/v1/artifacts/${arts[1].artifactId}?grant=${encodeURIComponent(grantTok)}`);
  ok(cross.status === 403, "grant bound to one artifact → 403 on a different artifact");

  // 8. bad grant → 401
  const bad = await fetch(API + `/v1/artifacts/${arts[0].artifactId}?grant=not.a.jwt`);
  ok(bad.status === 401, "bad grant → 401");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
