// Sprint 2 / Epic 7 — DOCX renderer tests (unit + E2E).
// Unit: LM → valid OOXML zip with required parts + expected content.
// E2E: submit outputs:[docx] → worker renders → GET /v1/artifacts → docx bytes.
// NOTE: open-validation via LibreOffice is unavailable in this environment (its
// headless profile fails to load even a library-minimal docx — a LO/Java env
// issue, not our output), so we validate the OOXML structure + parts directly.
import crypto from "node:crypto";
import zlib from "node:zlib";
import { buildLayout } from "@dispatch/ddm-schema/engine";
import { renderDocx } from "../shared/src/render-docx.mjs";
import { makePool } from "../shared/src/db.mjs";
import { tick } from "../dispatch-worker/src/worker.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(__dir, "..", "..", "packages", "ddm-schema", "fixtures", "valid", f), "utf8")).document;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

// Minimal local unzip: read a named entry from a zip Buffer (stored or deflated).
function readZipEntry(buf, name) {
  // Find End Of Central Directory, then scan central dir for the entry.
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) return null;
  let cdOff = buf.readUInt32LE(eocd + 16), n = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(cdOff) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(cdOff + 28), extraLen = buf.readUInt16LE(cdOff + 30), cmtLen = buf.readUInt16LE(cdOff + 32);
    const lho = buf.readUInt32LE(cdOff + 42);
    const fname = buf.toString("utf8", cdOff + 46, cdOff + 46 + nameLen);
    if (fname === name) {
      const method = buf.readUInt16LE(lho + 8);
      const lNameLen = buf.readUInt16LE(lho + 26), lExtra = buf.readUInt16LE(lho + 28);
      const compSize = buf.readUInt32LE(cdOff + 20);
      const start = lho + 30 + lNameLen + lExtra;
      const comp = buf.subarray(start, start + compSize);
      return method === 8 ? zlib.inflateRawSync(comp) : comp;
    }
    cdOff += 46 + nameLen + extraLen + cmtLen;
  }
  return null;
}

async function main() {
  console.log("== Epic 7 DOCX renderer ==");

  // --- unit ---
  const lm = buildLayout(load("V2-full-exec-briefing.json"));
  const { bytes, warnings } = await renderDocx(lm);
  ok(bytes[0] === 0x50 && bytes[1] === 0x4b, "produces a zip (PK header)");
  ok(bytes.length > 4000, `non-trivial size (${bytes.length} bytes)`);
  const doc = readZipEntry(bytes, "word/document.xml");
  const styles = readZipEntry(bytes, "word/styles.xml");
  const footer = readZipEntry(bytes, "word/footer1.xml");
  ok(doc && styles, "contains word/document.xml + styles.xml");
  const d = doc.toString("utf8");
  ok(d.includes("Regional Stability Brief"), "cover title present");
  ok(d.includes("Executive Summary") && d.includes("Recommendation"), "section headings present");
  ok(d.includes("Appendix A"), "appendix lettered A");
  ok(d.includes("<w:tbl>"), "native Word table");
  ok(/TOC|fldChar/.test(d), "TOC field present");
  ok(d.includes("[1]"), "citation marker [1]");
  ok(d.includes("Sources"), "sources section");
  ok(footer && footer.toString("utf8").includes("PAGE"), "footer carries page-number field");
  ok(warnings.some((w) => w.code === "CHART_RASTERIZED"), "chart→table fallback warning");

  // determinism (content stream — docx embeds no timestamp in document.xml)
  const { bytes: b2 } = await renderDocx(buildLayout(load("V2-full-exec-briefing.json")));
  ok(readZipEntry(b2, "word/document.xml").equals(doc), "deterministic document.xml across renders");

  // --- E2E (only if API is up) ---
  const API = process.env.DISPATCH_API_URL;
  if (API) {
    const pool = makePool();
    const tok = "svc svc-a:secret-A";
    const body = { schemaVersion: "1.0", idempotencyKey: crypto.randomUUID(),
      source: { system: "emergency-ai", tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      document: load("V1-minimal-exec-briefing.json"), outputs: ["docx"],
      delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } };
    const sub = await fetch(API + "/v1/documents", { method: "POST",
      headers: { authorization: "Bearer " + tok, "content-type": "application/json", "idempotency-key": body.idempotencyKey },
      body: JSON.stringify(body) }).then((r) => r.json());
    ok(sub.jobId, "E2E submit docx -> 202");
    await tick();
    const job = await fetch(API + `/v1/jobs/${sub.jobId}`, { headers: { authorization: "Bearer " + tok } }).then((r) => r.json());
    ok(job.status === "succeeded" && job.result.artifacts[0]?.format === "docx", "E2E job succeeded with docx artifact");
    const aid = job.result.artifacts[0].artifactId;
    const r = await fetch(API + `/v1/artifacts/${aid}`, { headers: { authorization: "Bearer " + tok } });
    const buf = Buffer.from(await r.arrayBuffer());
    ok(r.status === 200 && buf[0] === 0x50 && buf[1] === 0x4b, "E2E GET /v1/artifacts → docx zip bytes");
    ok((r.headers.get("content-type") || "").includes("wordprocessingml"), "docx content-type correct");
    await pool.end();
  } else {
    console.log("  (skip E2E — DISPATCH_API_URL not set)");
  }

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
