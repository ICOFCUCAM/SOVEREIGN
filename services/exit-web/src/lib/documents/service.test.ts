import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { TemplateMemorandumGenerator, runInstitutionalValuation, runBuyerDiscovery, runDueDiligence, runReadiness } from "@exit/engines";
import { buildProfile, SAMPLE_INTAKE } from "../company-intake";
import { canonicalValuationFor } from "../canonical-valuation";
import { closingRows, STATUS_LABEL } from "../closing-checklist";
import { generateVersion, canonicalJson, sha256, type DocumentVersion } from "./service";

// Dispatch's own validator, layout engine and renderers (packages/ddm-schema) and its
// PDF renderer (services/shared/src/pdf.mjs): the code that renders ExitOS documents in
// production, run here in-process against headless Chromium — a test configuration.
const ROOT = resolve(__dirname, "../../../../..");
type Mod = Record<string, (...a: unknown[]) => unknown>;
let validator: Mod, engine: Mod, md: Mod, html: Mod, pdf: Mod;
beforeAll(async () => {
  validator = await import(/* @vite-ignore */ join(ROOT, "packages/ddm-schema/src/validator.mjs")) as Mod;
  engine = await import(/* @vite-ignore */ join(ROOT, "packages/ddm-schema/src/engine.mjs")) as Mod;
  md = await import(/* @vite-ignore */ join(ROOT, "packages/ddm-schema/src/render-md.mjs")) as Mod;
  html = await import(/* @vite-ignore */ join(ROOT, "packages/ddm-schema/src/render-html.mjs")) as Mod;
  pdf = await import(/* @vite-ignore */ join(ROOT, "services/shared/src/pdf.mjs")) as Mod;
});

const co = { ...buildProfile({ ...SAMPLE_INTAKE, name: "Zephyrine Logistics", sector: "logistics_freight", ttmRevenueUsd: 37_400_000, arrUsd: 31_250_000 }), id: "co-test" };
const inst = runInstitutionalValuation(co);
const canonical = canonicalValuationFor(co, inst);
const base = { company: co, companyId: "co-test", unconfirmed: [] as never[], generatedBy: "founder@example.com", valuationMidUsd: canonical.headline.mid, now: new Date("2026-10-13T12:00:00Z") };

async function memo(kind: "cim" | "buyer_teaser" | "executive_summary", typeId: string, anonymize = false): Promise<DocumentVersion> {
  const doc = await new TemplateMemorandumGenerator().generate(kind, {
    company: co, valuation: canonical, constitution: inst, readiness: runReadiness(co),
    buyers: runBuyerDiscovery(co, { limit: 8 }), diligence: runDueDiligence(co), anonymize, codeName: "Project Atlas",
  });
  return generateVersion({ ...base, typeId, title: doc.title, sections: doc.sections, producedBy: doc.producedBy,
    inputs: { intake: SAMPLE_INTAKE, kind }, ownerName: anonymize ? "Project Atlas" : co.name });
}

/** "3 Investment Highlights": a rendered heading with its section number. */
const order_n = (text: string, heading: string): string => text.match(new RegExp(`## (\\d+ ${heading})`))?.[1] ?? heading;

describe("document versions", () => {
  it("record what they were made from, and hash identically for identical content", async () => {
    const a = await memo("cim", "exitos.cim");
    const b = await memo("cim", "exitos.cim");
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.sourceHash).toBe(await sha256(canonicalJson({ intake: SAMPLE_INTAKE, kind: "cim" })));
    expect(a).toMatchObject({ typeId: "exitos.cim", companyId: "co-test", status: "draft", registrySchemaVersion: "1.0.0" });
    expect((a.ddm.metadata as Record<string, string>).referenceCode).toContain(a.sourceHash.slice(0, 12));
  });

  it("withhold a pre-NDA document that names the company", async () => {
    await expect(generateVersion({ ...base, typeId: "exitos.teaser", title: "Zephyrine Logistics — overview", sections: [{ heading: "Overview", body: "x" }],
      producedBy: "test", inputs: {}, ownerName: "Project Atlas" })).rejects.toThrow(/Withheld/);
  });

  it("mark unconfirmed inputs in the document itself", async () => {
    const v = await generateVersion({ ...base, unconfirmed: ["grossMarginPct"], typeId: "exitos.cim", title: "CIM", sections: [{ heading: "Executive overview", body: "x" }],
      producedBy: "test", inputs: {}, ownerName: co.name });
    expect(JSON.stringify(v.ddm)).toContain("still the demo company's values (grossMarginPct)");
  });
});

describe("Dispatch accepts and renders ExitOS documents (test configuration)", () => {
  const checklist = (): Promise<DocumentVersion> => {
    const rows = closingRows({ "c-01": "done" });
    return generateVersion({ ...base, typeId: "exitos.closing_checklist", title: "Closing Checklist", producedBy: "lib/closing-checklist",
      sections: [
        { heading: "Status", body: "1 of 12 items marked done." },
        { heading: "Items", table: { headers: ["#", "Item", "Owner", "Timing", "Gate", "Status"], rows: rows.map((r, n) => [String(n + 1), r.title, r.owner, r.timing, r.gating ? "Yes" : "", STATUS_LABEL[r.status]]) } },
        { heading: "Timing", body: "Signing in weeks 8–10." },
      ], inputs: { statuses: { "c-01": "done" } }, ownerName: co.name });
  };

  it("passes Dispatch's validator and builds a layout for every family", async () => {
    for (const v of [await memo("cim", "exitos.cim"), await memo("buyer_teaser", "exitos.teaser", true), await memo("executive_summary", "exitos.executive_summary"), await checklist()]) {
      const verdict = validator.validateDocument(v.ddm) as { valid: boolean; errors: unknown[] };
      expect(verdict.errors, v.typeId).toEqual([]);
      expect(verdict.valid).toBe(true);
      expect(() => engine.buildLayout(v.ddm, { date: "2026-10-13" })).not.toThrow();
    }
  });

  it("the board memorandum's own mapping, stamped as a version, still validates", async () => {
    const { buildBoardMemo } = await import("../report-docs");
    const { boardMemoToDdm } = await import("../dispatch-ddm");
    const v = await generateVersion({ ...base, typeId: "exitos.board_memo_process", title: "Board Transaction Memorandum", sections: [],
      ddm: boardMemoToDdm(buildBoardMemo(co)) as never, producedBy: "test", inputs: {}, ownerName: co.name });
    const verdict = validator.validateDocument(v.ddm) as { valid: boolean; errors: unknown[] };
    expect(verdict.errors).toEqual([]);
    expect((v.ddm.classification as { level: string }).level).toBe("BOARD CONFIDENTIAL");
    expect((v.ddm.metadata as { referenceCode: string }).referenceCode).toMatch(/^exitos\.board_memo_process · [0-9a-f]{12}$/);
    // rendered in the order written, not with Dispatch's profile roles pulled to the front
    const { text } = md.renderMarkdown(engine.buildLayout(v.ddm, { date: "2026-10-13" })) as { text: string };
    const order = ["Executive Summary", "Background", "Investment Highlights", "Transaction Parameters", "Process and Timing", "Proposed Resolutions", "Basis of Preparation"]
      .map((h) => text.indexOf(`## ${order_n(text, h)}`));
    expect(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1]))).toBe(true);
  });

  it("keeps the document's own section order and carries classification, version and reference into the render", async () => {
    const v = await memo("cim", "exitos.cim");
    const lm = engine.buildLayout(v.ddm, { date: "2026-10-13" });
    const { text } = md.renderMarkdown(lm) as { text: string };
    const headings = (v.ddm.sections as Array<{ heading: string }>).map((s) => s.heading);
    let at = -1;
    for (const h of headings) { const i = text.indexOf(h); expect(i, h).toBeGreaterThan(at); at = i; }
    expect(text).toContain("STRICTLY CONFIDENTIAL — UNDER NDA");
    expect(text).not.toMatch(/\d+\s+\d+\. /);   // one numbering, Dispatch's
    expect(text).toContain("v1");
  });

  it("renders a real, paginated PDF whose text matches the document", async () => {
    if (!(pdf.pdfAvailable as () => boolean)()) return; // no Chromium on this machine: the PDF step cannot run here
    const v = await checklist();
    const lm = engine.buildLayout(v.ddm, { date: "2026-10-13" });
    const { html: page } = html.renderHtml(lm) as { html: string };
    const buf = pdf.normalizePdf(pdf.htmlToPdf(page)) as Buffer;
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.pdfPageCount(buf) as number).toBeGreaterThanOrEqual(1);
    if (existsSync("/usr/bin/pdftotext")) {
      const dir = mkdtempSync(join(tmpdir(), "exitos-pdf-"));
      writeFileSync(join(dir, "c.pdf"), buf);
      const out = execFileSync("/usr/bin/pdftotext", ["-layout", join(dir, "c.pdf"), "-"]).toString();
      expect(out).toContain("Closing Checklist");
      expect(out).toContain("RESTRICTED — TRANSACTION PARTIES");
      expect(out).toContain("SPA execution and signature pages");
    }
  }, 90_000);
});

// SAVE_PDF_DIR=<dir> keeps a rendered CIM for inspection (not part of the assertions above)
it.runIf(!!process.env.SAVE_PDF_DIR)("writes a sample CIM PDF", async () => {
  const v = await memo("cim", "exitos.cim");
  const { html: page } = html.renderHtml(engine.buildLayout(v.ddm, { date: "2026-10-13" })) as { html: string };
  writeFileSync(join(process.env.SAVE_PDF_DIR as string, "sample-cim.pdf"), pdf.normalizePdf(pdf.htmlToPdf(page)) as Buffer);
}, 90_000);
