// Sprint 2 / Epic 6 — PDF render E2E through the worker + retrieve.
// submit (outputs:[pdf,md]) → worker renders both → GET artifacts → PDF is a
// valid %PDF with pages>0, md also present; checksum verifies.
import crypto from "node:crypto";
import { makePool, withClaims } from "../shared/src/db.mjs";
import { tick } from "../dispatch-worker/src/worker.mjs";
import { pdfAvailable } from "../shared/src/pdf.mjs";

const API = process.env.DISPATCH_API_URL || "http://127.0.0.1:8787";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pool = makePool();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

const briefing = () => ({ schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(),
  source: { system: "emergency-ai", tenantId: TENANT_A, correlationId: "pdf-1" },
  document: { ddmVersion: "1.0", docType: "executive_briefing",
    metadata: { title: "PDF Test Brief", date: "2026-05-29", status: "final", referenceCode: "INT-2026-0199" },
    classification: { scheme: "uk_gov", level: "OFFICIAL-SENSITIVE" },
    sections: [
      { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF: situation contained.", style: "lead" }] },
      { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "J1" }, { text: "J2" }] }] },
      { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [
        { id: "b3", type: "paragraph", text: "Body." },
        { id: "b4", type: "chart", chartType: "bar", caption: "Trend", spec: { xKey: "m", series: [{ key: "v", label: "Value" }], data: [{ m: "Jan", v: 3 }, { m: "Feb", v: 6 }] } },
        { id: "b5", type: "reference", citeId: "c1" } ] },
      { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b6", type: "callout", style: "recommendation", text: "Proceed." }] },
    ],
    citations: [{ id: "c1", type: "web", title: "Source A", url: "https://example.org/a" }] },
  outputs: ["pdf", "md"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } });

const tok = "svc svc-a:secret-A";
async function api(method, path, body) {
  const headers = { authorization: "Bearer " + tok };
  if (body) { headers["content-type"] = "application/json"; headers["idempotency-key"] = body.idempotencyKey; }
  const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get("content-type") || "";
  return { status: r.status, ct, json: ct.includes("json") ? await r.json().catch(() => null) : null,
    buf: ct.includes("json") ? null : Buffer.from(await r.arrayBuffer()), headers: r.headers };
}

async function main() {
  console.log("== Epic 6 PDF E2E ==");
  ok(pdfAvailable(), `chromium available for PDF render`);

  const sub = await api("POST", "/v1/documents", briefing());
  ok(sub.status === 202, `submit pdf+md -> 202`);
  const jobId = sub.json.jobId;

  await tick(); // render both outputs

  const job = await api("GET", `/v1/jobs/${jobId}`);
  ok(job.json.status === "succeeded", `job succeeded (status=${job.json.status})`);
  const arts = job.json.result.artifacts;
  ok(arts.length === 2, `two artifacts (pdf+md) [${arts.map(a => a.format).join(",")}]`);
  const pdf = arts.find((a) => a.format === "pdf");
  ok(pdf && pdf.pages > 0, `pdf artifact has pages=${pdf?.pages}`);

  // fetch PDF bytes
  const bytes = await api("GET", `/v1/artifacts/${pdf.artifactId}`);
  ok(bytes.status === 200 && bytes.buf.slice(0, 5).toString() === "%PDF-", "GET pdf artifact → valid %PDF bytes");
  ok(bytes.ct.includes("application/pdf"), "pdf content-type correct");
  ok(bytes.headers.get("x-dispatch-sha256") === pdf.sha256, "pdf sha256 header matches");

  // verify checksum endpoint
  const v = await api("GET", `/v1/artifacts/${pdf.artifactId}?verify=true`);
  ok(v.json.verified === true, "pdf checksum verifies");

  // metadata shows pages
  const meta = await api("GET", `/v1/artifacts/${pdf.artifactId}?disposition=metadata`);
  ok(meta.json.format === "pdf" && meta.json.pages > 0, `pdf metadata pages=${meta.json.pages}`);

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
