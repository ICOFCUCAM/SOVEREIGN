import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildSamplePack, type PackItem } from "./sample-pack";
import { reviewVersion, qualityReportMarkdown, withFindings, PASS_SCORE, type QualityReport } from "./quality";
import { inspectRendered, type Rendered } from "./rendered";
import { documentType } from "./registry";
import type { Truth } from "./consistency";

// The quality gate. Every document in the sample pack is reviewed twice: its
// document model (quality.ts) and what a person receives — the Markdown
// export, the HTML preview and the final PDF rendered through Dispatch's
// engine and headless Chromium, read back with pdftotext (rendered.ts).
// SAMPLE_PACK_DIR=<dir> (npm run docs:samples) also keeps the files and the review.
const ROOT = resolve(__dirname, "../../../../..");
type Mod = Record<string, (...a: unknown[]) => unknown>;
let pack: { items: PackItem[]; truth: Truth };
let reports: QualityReport[];
const rendered = new Map<string, Rendered>();
let pdfAvailable = false;

beforeAll(async () => {
  pack = await buildSamplePack();
  const load = async (p: string): Promise<Mod> => (await import(/* @vite-ignore */ join(ROOT, p))) as Mod;
  const engine = await load("packages/ddm-schema/src/engine.mjs"), md = await load("packages/ddm-schema/src/render-md.mjs");
  const html = await load("packages/ddm-schema/src/render-html.mjs"), pdf = await load("services/shared/src/pdf.mjs");
  pdfAvailable = (pdf.pdfAvailable as () => boolean)();
  const dir = process.env.SAMPLE_PACK_DIR ?? mkdtempSync(join(tmpdir(), "exitos-pack-"));
  mkdirSync(dir, { recursive: true });
  const v = pack.truth.valuation;
  reports = pack.items.map((i, n) => {
    const base = join(dir, `${String(n + 1).padStart(2, "0")}-${i.slug}`);
    const lm = engine.buildLayout(i.version.ddm, { date: "2026-10-13" });
    const markdown = (md.renderMarkdown(lm) as { text: string }).text;
    const { html: page } = html.renderHtml(lm) as { html: string };
    writeFileSync(`${base}.md`, markdown);
    writeFileSync(`${base}.html`, page);
    let pdfText: string | null = null, pdfPages: number | null = null, pdfTitle: string | null = null;
    if (pdfAvailable) {
      writeFileSync(`${base}.pdf`, pdf.normalizePdf(pdf.htmlToPdf(page)) as Buffer);
      pdfText = execFileSync("pdftotext", ["-layout", `${base}.pdf`, "-"]).toString();
      const info = execFileSync("pdfinfo", [`${base}.pdf`]).toString();
      pdfPages = Number(info.match(/Pages:\s+(\d+)/)?.[1] ?? 0);
      pdfTitle = info.match(/Title:\s+(.+)/)?.[1]?.trim() ?? null;
    }
    const r: Rendered = { markdown, html: page, pdfText, pdfPages, pdfTitle };
    rendered.set(i.slug, r);
    const audience = documentType(i.version.typeId).audience;
    return withFindings(reviewVersion(i.version, pack.truth, i.anonymized),
      inspectRendered(i.version, r, { buyerFacing: audience === "buyers" || audience === "buyer", valuationUsd: v ? [v.low, v.mid, v.high] : [] }));
  });
  writeFileSync(join(dir, "QUALITY_REVIEW.md"), qualityReportMarkdown(reports, "Sample pack — quality review"));
}, 300_000);

describe("document quality gate (sample pack)", () => {
  it("covers every document on the generation service", () => {
    expect(pack.items.map((i) => i.version.typeId)).toEqual([
      "exitos.cim", "exitos.executive_summary", "exitos.investor_deck", "exitos.teaser", "exitos.data_room_index",
      "exitos.closing_checklist", "exitos.board_memo_process",
    ]);
  });
  it("has no critical finding in any document", () => {
    const critical = reports.flatMap((r) => r.findings.filter((f) => f.severity === "critical").map((f) => `${r.title}: ${f.rule} — ${f.excerpt}`));
    expect(critical).toEqual([]);
  });
  it(`scores every document at least ${PASS_SCORE}`, () => {
    expect(reports.filter((r) => !r.pass).map((r) => `${r.title}: ${r.score}`)).toEqual([]);
  });
});

describe("provenance: nothing the company did not supply is stated as fact", () => {
  const text = (slug: string): string => JSON.stringify(pack.items.find((i) => i.slug === slug)!.version.ddm.sections);
  it("no assumed market size, headcount, cap table, retention or competitive position", () => {
    for (const slug of ["cim", "executive_summary", "investor_deck", "buyer_teaser"]) {
      const t = text(slug);
      expect(t, slug).not.toMatch(/\$4\.9B|employs \d+ people|Founders: 40%|Gross revenue retention|ahead of its main competitors|modular monolith/);
    }
    expect(text("cim")).toMatch(/Not yet supplied by the Company: market size/);
    expect(text("cim")).toMatch(/capitalisation table has not yet been supplied/);
  });
  it("the CIM, which goes to buyers, carries no seller-side material", () => {
    const t = text("cim");
    expect(t).not.toMatch(/Target buyer set|probability of engagement|Exit readiness|not an auction/);
  });
  it("tables reach the rendered document", () => {
    expect(text("cim")).toMatch(/"type":"table"/);
  });
});

describe("rendered outputs (Markdown, preview, PDF)", () => {
  it("a PDF renderer is available, so the PDF checks ran", () => {
    expect(pdfAvailable, "headless Chromium at /opt/pw-browsers or CHROME_PATH").toBe(true);
  });
  it("every table reaches the PDF: the CIM's financial table, cell by cell", () => {
    const t = rendered.get("cim")!.pdfText!;
    for (const cell of ["Revenue (TTM)", "Annual recurring revenue", "Gross margin", "EBITDA margin", "Net revenue retention"]) expect(t).toContain(cell);
  });
  it("buyer-facing PDFs carry no valuation or seller-only wording, including the executive summary, deck and teaser", () => {
    const v = pack.truth.valuation!;
    for (const slug of ["cim", "executive_summary", "investor_deck", "buyer_teaser"]) {
      const t = rendered.get(slug)!.pdfText!;
      expect(t, slug).not.toMatch(/enterprise value|valuation range|midpoint|strategic premium|buyer universe|probability|readiness|price guidance|Valuation Framework/i);
      for (const usd of [v.low, v.mid, v.high]) expect(t, slug).not.toContain(`$${(usd / 1e6).toFixed(1)}M`);
    }
  });
  it("the board memorandum, which is internal, keeps the valuation", () => {
    expect(rendered.get("board_memo")!.pdfText!).toMatch(/enterprise value/i);
  });
  it("catches a lost table", () => {
    const cim = pack.items.find((i) => i.slug === "cim")!.version;
    const r = rendered.get("cim")!;
    // the financial table is gone from the PDF (as if the renderer dropped it), though its words still appear in the prose
    const stripped = { ...r, pdfText: r.pdfText!.replace(/^.*(Table \d+\. Financial profile|Revenue \(TTM\) {2,}|Annual recurring revenue {2,}|ARR growth \(YoY\) {2,}|Gross margin {2,}|EBITDA margin {2,}|Net revenue retention {2,}).*$/gm, "") };
    expect(inspectRendered(cim, stripped, { buyerFacing: true }).map((x) => x.rule)).toContain("render:table-lost");
  });
  it("catches valuation leaking through metadata or an appendix", () => {
    const cim = pack.items.find((i) => i.slug === "cim")!.version;
    const mid = pack.truth.valuation!.mid;
    const leaky = { ...cim, ddm: { ...cim.ddm, metadata: { ...(cim.ddm.metadata as object), subtitle: `Enterprise value $${(mid / 1e6).toFixed(1)}M` } } };
    const rules = inspectRendered(leaky as never, rendered.get("cim")!, { buyerFacing: true, valuationUsd: [mid] }).map((x) => x.rule);
    expect(rules).toContain("leak:seller-only");
    expect(rules).toContain("leak:valuation");
  });
});

describe("the review itself", () => {
  it("catches the defects it is meant to catch", async () => {
    const v = { ...pack.items[0].version, disclosure: [] };
    const broken = { ...v, ddm: { ...v.ddm, sections: [{ id: "s1", heading: "Overview", level: 1, order: 1, blocks: [
      { id: "p", type: "paragraph", text: "Northwind Analytics is a analytics operating in analytics software with undefined customers. It is a world-class leader!" },
    ] }] } };
    const r = reviewVersion(broken as never, pack.truth);
    const rules = r.findings.map((f) => f.rule);
    for (const rule of ["placeholder", "article", "repeated-word", "unsupported-claim", "noun-phrase", "tone", "too-thin"]) expect(rules).toContain(rule);
    expect(r.pass).toBe(false);
  });
});
