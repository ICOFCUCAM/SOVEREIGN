import { describe, it, expect, beforeAll } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildSamplePack, type PackItem } from "./sample-pack";
import { reviewVersion, qualityReportMarkdown, PASS_SCORE, type QualityReport } from "./quality";
import type { Truth } from "./consistency";

// The quality gate: every document in the sample pack must pass the review.
// SAMPLE_PACK_DIR=<dir> also writes the pack (Markdown, HTML, PDF through
// Dispatch's renderer) and the review, for a person to read.
const ROOT = resolve(__dirname, "../../../../..");
type Mod = Record<string, (...a: unknown[]) => unknown>;
let pack: { items: PackItem[]; truth: Truth };
let reports: QualityReport[];

beforeAll(async () => {
  pack = await buildSamplePack();
  reports = pack.items.map((i) => reviewVersion(i.version, pack.truth, i.anonymized));
  const dir = process.env.SAMPLE_PACK_DIR;
  if (!dir) return;
  const load = async (p: string): Promise<Mod> => (await import(/* @vite-ignore */ join(ROOT, p))) as Mod;
  const engine = await load("packages/ddm-schema/src/engine.mjs"), md = await load("packages/ddm-schema/src/render-md.mjs");
  const html = await load("packages/ddm-schema/src/render-html.mjs"), pdf = await load("services/shared/src/pdf.mjs");
  mkdirSync(dir, { recursive: true });
  pack.items.forEach((i, n) => {
    const base = join(dir, `${String(n + 1).padStart(2, "0")}-${i.slug}`);
    const lm = engine.buildLayout(i.version.ddm, { date: "2026-10-13" });
    writeFileSync(`${base}.md`, (md.renderMarkdown(lm) as { text: string }).text);
    const { html: page } = html.renderHtml(lm) as { html: string };
    writeFileSync(`${base}.html`, page);
    if ((pdf.pdfAvailable as () => boolean)()) writeFileSync(`${base}.pdf`, pdf.normalizePdf(pdf.htmlToPdf(page)) as Buffer);
  });
  writeFileSync(join(dir, "QUALITY_REVIEW.md"), qualityReportMarkdown(reports, "Sample pack — quality review"));
}, 180_000);

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
