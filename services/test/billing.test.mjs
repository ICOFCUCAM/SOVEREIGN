// Billing / plans e2e — "sign up free, taste it, subscribe to download".
// Proves: self-serve signup → free owner credential → create up to the quota →
// quota 402 → metadata preview is free → download 402 on free → subscribe →
// download 200 and quota lifted. Assumes the API on :8787 and a superuser pool.
import crypto from "node:crypto";
import pgpkg from "pg";
import { tick } from "../dispatch-worker/src/worker.mjs";

const API = "http://127.0.0.1:8787";
const admin = new pgpkg.Pool({
  host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432),
  user: "postgres", password: process.env.PGADMIN_PASSWORD || "postgres",
  database: process.env.PGDATABASE || "dispatch", max: 3,
});
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

function execBriefing(tenantId, title = "Taste Test Brief") {
  return {
    schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(),
    source: { system: "emergency-ai", tenantId, correlationId: "taste" },
    document: {
      ddmVersion: "1.0", docType: "executive_briefing",
      metadata: { title, date: "2026-06-24", status: "final" },
      classification: { scheme: "none", level: "UNCLASSIFIED" },
      sections: [
        { id: "s-sum", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF.", style: "lead" }] },
        { id: "s-kj", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "J1" }] }] },
        { id: "s-an", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
        { id: "s-rec", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Proceed." }] },
      ],
    },
    outputs: ["md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
  };
}
async function jget(path, token, extra = {}) {
  const r = await fetch(API + path, { headers: { authorization: "Bearer " + token, ...extra } });
  return { status: r.status, ct: r.headers.get("content-type") || "", json: (r.headers.get("content-type") || "").includes("json") ? await r.json().catch(() => null) : null };
}
async function create(token, tenantId) {
  const r = await fetch(API + "/v1/documents", { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(execBriefing(tenantId)) });
  return { status: r.status, json: await r.json().catch(() => null) };
}

async function main() {
  console.log("== Billing e2e — sign up free, subscribe to download ==");

  // 1. Self-serve signup → free owner credential.
  const su = await (await fetch(API + "/v1/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Republic of Taste" }) })).json();
  ok(su.client_id?.startsWith("svc_") && su.secret?.startsWith("sdk_") && su.plan === "free", `signed up free tenant ${su.tenantId?.slice(0, 8)} with owner credential`);

  // 2. Exchange for a token.
  const tk = await (await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: su.client_id, secret: su.secret }) })).json();
  const token = tk.access_token || tk.token;
  ok(!!token && tk.scopes?.includes("dispatch:render"), "owner credential mints a token with create scope");

  // 3. Billing starts free, no download.
  const b0 = await jget("/v1/billing", token);
  ok(b0.status === 200 && b0.json.plan === "free" && b0.json.canDownload === false && b0.json.documentQuota === 3, "billing: free plan, downloads locked, quota 3");

  // 4. Create up to quota (3), then the 4th is refused.
  const c1 = await create(token, su.tenantId);
  ok(c1.status === 202 && c1.json.jobId, "create #1 → 202");
  ok((await create(token, su.tenantId)).status === 202, "create #2 → 202");
  ok((await create(token, su.tenantId)).status === 202, "create #3 → 202");
  const c4 = await create(token, su.tenantId);
  ok(c4.status === 402 && c4.json.error?.code === "QUOTA_EXCEEDED", "create #4 → 402 QUOTA_EXCEEDED (free cap)");

  // 5. Render #1 so there is an artifact to (try to) download.
  for (let i = 0; i < 6; i++) { if (!(await tick())) break; }
  const art = await admin.query("select a.id from dispatch.artifacts a where a.tenant_id=$1 limit 1", [su.tenantId]);
  ok(art.rows.length === 1, "worker rendered a downloadable artifact");
  const artifactId = art.rows[0]?.id;

  // 6. Free tier: metadata is visible, bytes are paywalled.
  const meta = await jget(`/v1/artifacts/${artifactId}?disposition=metadata`, token);
  ok(meta.status === 200 && meta.json?.format === "md", "free tier can preview artifact metadata");
  const dl = await jget(`/v1/artifacts/${artifactId}`, token);
  ok(dl.status === 402 && dl.json?.error?.code === "PAYMENT_REQUIRED", "free tier download → 402 PAYMENT_REQUIRED");

  // 7. Subscribe (stub) → downloads unlock.
  const sub = await (await fetch(API + "/v1/billing/subscribe", { method: "POST", headers: { authorization: "Bearer " + token } })).json();
  ok(sub.canDownload === true && sub.plan === "paid", "subscribe → plan paid, downloads unlocked");
  const dl2 = await jget(`/v1/artifacts/${artifactId}`, token);
  ok(dl2.status === 200, "paid tier download → 200 (bytes delivered)");

  // 8. Quota lifted once subscribed.
  ok((await create(token, su.tenantId)).status === 202, "subscribed tenant can create beyond the free cap");

  // 9. Signup validation.
  const bad = await fetch(API + "/v1/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "" }) });
  ok(bad.status === 400, "signup with empty name → 400");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await admin.end();
  process.exit(fail ? 1 : 0);
}
main().catch(async (e) => { console.error(e); try { await admin.end(); } catch {} process.exit(1); });
