import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildCompanyPack, SAMPLE_PACK_COMPANIES, type PackItem } from "./sample-pack";
import { reviewVersion, qualityReportMarkdown, withFindings, gateOf, PASS_SCORE, type QualityReport } from "./quality";
import { inspectRendered, type Rendered } from "./rendered";
import { documentType } from "./registry";
import type { Truth } from "./consistency";

// The quality gate. Every document in the sample pack — two fictional companies,
// one with a complete company story and sources, one with only the headline
// intake — is reviewed twice: its document model (quality.ts) and what a person
// receives — the Markdown export, the HTML preview and the final PDF rendered
// through Dispatch's engine and headless Chromium, read back with pdftotext
// (rendered.ts). Two gates: A (integrity) and B (communication and rendering);
// both must pass. SAMPLE_PACK_DIR=<dir> (npm run docs:samples) keeps the files.
const ROOT = resolve(__dirname, "../../../../..");
type Mod = Record<string, (...a: unknown[]) => unknown>;
interface Doc { item: PackItem; truth: Truth; report: QualityReport; rendered: Rendered }
const docs = new Map<string, Doc>();
let pdfAvailable = false;
const get = (company: string, slug: string): Doc => docs.get(`${company}/${slug}`)!;

beforeAll(async () => {
  const load = async (p: string): Promise<Mod> => (await import(/* @vite-ignore */ join(ROOT, p))) as Mod;
  const engine = await load("packages/ddm-schema/src/engine.mjs"), md = await load("packages/ddm-schema/src/render-md.mjs");
  const html = await load("packages/ddm-schema/src/render-html.mjs"), pdf = await load("services/shared/src/pdf.mjs");
  pdfAvailable = (pdf.pdfAvailable as () => boolean)();
  const dir = process.env.SAMPLE_PACK_DIR ?? mkdtempSync(join(tmpdir(), "exitos-pack-"));
  mkdirSync(dir, { recursive: true });
  const reports: QualityReport[] = [];
  for (const pc of SAMPLE_PACK_COMPANIES) {
    const { items, truth } = await buildCompanyPack(pc);
    items.forEach((item, n) => {
      const base = join(dir, `${pc.key}-${String(n + 1).padStart(2, "0")}-${item.slug}`);
      const lm = engine.buildLayout(item.version.ddm, { date: "2026-10-13" });
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
      const rendered: Rendered = { markdown, html: page, pdfText, pdfPages, pdfTitle };
      const audience = documentType(item.version.typeId).audience;
      const v = truth.valuation;
      const report = withFindings(reviewVersion(item.version, truth, item.anonymized, item.coverage),
        inspectRendered(item.version, rendered, { buyerFacing: audience === "buyers" || audience === "buyer", valuationUsd: v ? [v.low, v.mid, v.high] : [] }));
      reports.push({ ...report, title: `${report.title}${pc.key === "minimal" ? " (headline intake only)" : ""}` });
      docs.set(`${pc.key}/${item.slug}`, { item, truth, report, rendered });
    });
  }
  writeFileSync(join(dir, "QUALITY_REVIEW.md"), qualityReportMarkdown(reports, "Sample pack — quality review"));
}, 600_000);

const all = (): Doc[] => [...docs.values()];

describe("acceptance: both gates, every document, both companies", () => {
  it("covers every document on the generation service for both companies", () => {
    for (const pc of SAMPLE_PACK_COMPANIES) for (const slug of ["cim", "executive_summary", "investor_deck", "buyer_teaser", "dd_room_index", "closing_checklist", "board_memo"])
      expect(docs.has(`${pc.key}/${slug}`), `${pc.key}/${slug}`).toBe(true);
  });
  it("Gate A (integrity) passes for every document", () => {
    expect(all().filter((d) => !d.report.gateA.pass).map((d) => `${d.item.company}/${d.item.slug}: ${d.report.findings.filter((f) => gateOf(f.rule) === "A").map((f) => f.rule).join(", ")}`)).toEqual([]);
  });
  it("Gate B (communication and rendering) passes for every document", () => {
    expect(all().filter((d) => !d.report.gateB.pass).map((d) => `${d.item.company}/${d.item.slug}: ${d.report.findings.filter((f) => gateOf(f.rule) === "B" && f.severity !== "minor").map((f) => f.rule).join(", ")}`)).toEqual([]);
  });
  it(`a document is accepted only when both gates pass (each ≥ ${PASS_SCORE}, no critical)`, () => {
    for (const d of all()) expect(d.report.pass).toBe(d.report.gateA.pass && d.report.gateB.pass);
  });
});

describe("provenance: documents state only what the company supplied", () => {
  const text = (company: string, slug: string): string => JSON.stringify(get(company, slug).item.version.ddm.sections);
  it("with only the headline intake: no assumed market size, headcount, cap table, retention or position", () => {
    for (const slug of ["cim", "executive_summary", "investor_deck", "buyer_teaser"]) {
      const t = text("minimal", slug);
      expect(t, slug).not.toMatch(/employs \d+ people|Founders: \d+%|Gross revenue retention|ahead of its main competitors|monolith|leadership bench/);
    }
    const cim = text("minimal", "cim");
    for (const gap of ["company's history", "description of the products", "sourced estimate of the market size", "management team and headcount", "capitalisation table", "annual financial history"]) expect(cim).toContain(gap);
  });
  it("no prior period is invented: no implied prior-year table, no FY the company did not report", () => {
    expect(text("minimal", "cim")).not.toMatch(/FY20\d\d|implied/i);
    expect(text("full", "cim")).toMatch(/FY2024/);
    expect(text("full", "cim")).not.toMatch(/FY2023/);
  });
  it("with a full story: history, products, competitors, leaders, cap table, financial history and sources reach the CIM, each figure with its basis", () => {
    const t = text("full", "cim");
    for (const s of ["Ada Park", "Northwind Dispense", "Cairn Pharmacy Systems", "Fernhill Growth Partners II", "Reported annual financials", "FY2025 statutory accounts", "Halden Retail Health Research", "Company forecasts (estimates)", "Material figures and their basis"]) expect(t, s).toContain(s);
    expect(t).toContain("supplied by the Company");          // founder-supplied figures say so
    expect(t).not.toMatch(/"text":"verified;/);              // no figure claims a verification it does not have
  });
  it("an unsourced market estimate is not stated", () => {
    expect(text("full", "cim")).not.toContain("European pharmacy software");
  });
  it("the CIM, which goes to buyers, carries no seller-side material", () => {
    for (const c of ["full", "minimal"]) expect(text(c, "cim")).not.toMatch(/Target buyer set|probability of engagement|Exit readiness|not an auction|enterprise value/i);
  });
  it("completeness reflects the information available, not word count", () => {
    expect(get("full", "cim").report.completeness!).toBeGreaterThan(0.85);
    expect(get("minimal", "cim").report.completeness!).toBeLessThan(0.5);
  });
});

describe("rendered outputs (Markdown, preview, PDF)", () => {
  it("a PDF renderer is available, so the PDF checks ran", () => {
    expect(pdfAvailable, "headless Chromium at /opt/pw-browsers or CHROME_PATH").toBe(true);
  });
  it("every table reaches the PDF: the CIM's financial tables, cell by cell", () => {
    const t = get("full", "cim").rendered.pdfText!;
    for (const cell of ["Revenue (TTM)", "Annual recurring revenue", "Gross margin", "EBITDA margin", "Net revenue retention", "FY2024", "Engineering and product", "Series A Preferred"]) expect(t).toContain(cell);
  });
  it("buyer-facing PDFs carry no valuation or seller-only wording, including the executive summary, deck and teaser", () => {
    for (const c of ["full", "minimal"]) {
      const v = get(c, "cim").truth.valuation!;
      for (const slug of ["cim", "executive_summary", "investor_deck", "buyer_teaser"]) {
        const t = get(c, slug).rendered.pdfText!;
        expect(t, `${c}/${slug}`).not.toMatch(/enterprise value|valuation range|midpoint|strategic premium|buyer universe|probability|readiness|price guidance|Valuation Framework/i);
        for (const usd of [v.low, v.mid, v.high]) expect(t, `${c}/${slug}`).not.toContain(`$${(usd / 1e6).toFixed(1)}M`);
      }
    }
  });
  it("the board memorandum, which is internal, keeps the valuation and names the inputs it assumed", () => {
    expect(get("minimal", "board_memo").rendered.pdfText!).toMatch(/enterprise value/i);
    expect(get("minimal", "board_memo").rendered.pdfText!.replace(/\s+/g, " ")).toMatch(/has not yet supplied market size/);
  });
  it("catches a lost table", () => {
    const d = get("full", "cim");
    const stripped = { ...d.rendered, pdfText: d.rendered.pdfText!.replace(/^.*(Financial profile \(current\)|Revenue \(TTM\) {2,}|Annual recurring revenue {2,}|ARR growth \(YoY\) {2,}|Gross margin {2,}|EBITDA margin {2,}|Net revenue retention {2,}).*$/gm, "") };
    expect(inspectRendered(d.item.version, stripped, { buyerFacing: true }).map((x) => x.rule)).toContain("render:table-lost");
  });
  it("catches valuation leaking through metadata or an appendix", () => {
    const d = get("full", "cim");
    const mid = d.truth.valuation!.mid;
    const leaky = { ...d.item.version, ddm: { ...d.item.version.ddm, metadata: { ...(d.item.version.ddm.metadata as object), subtitle: `Enterprise value $${(mid / 1e6).toFixed(1)}M` } } };
    const rules = inspectRendered(leaky as never, d.rendered, { buyerFacing: true, valuationUsd: [mid] }).map((x) => x.rule);
    expect(rules).toContain("leak:seller-only");
    expect(rules).toContain("leak:valuation");
  });
  it("a perfect text score cannot offset a failed PDF inspection", () => {
    const d = get("full", "cim");
    const r = withFindings(reviewVersion(d.item.version, d.truth, false, d.item.coverage), [{ severity: "critical", rule: "render:table-lost", section: "x", excerpt: "PDF", fix: "" }]);
    expect(r.gateA.pass).toBe(true);
    expect(r.gateB.pass).toBe(false);
    expect(r.pass).toBe(false);
  });
});

describe("the review itself", () => {
  it("catches the defects it is meant to catch", () => {
    const d = get("minimal", "cim");
    const v = { ...d.item.version, disclosure: [] };
    const broken = { ...v, ddm: { ...v.ddm, sections: [{ id: "s1", heading: "Overview", level: 1, order: 1, blocks: [
      { id: "p", type: "paragraph", text: "Calder Freight Software is a analytics operating in analytics software with undefined customers. It is a world-class leader! It employs 32 people. In FY2021 revenue doubled." },
    ] }] } };
    const r = reviewVersion(broken as never, d.truth, false, d.item.coverage);
    const rules = r.findings.map((f) => f.rule);
    for (const rule of ["placeholder", "article", "repeated-word", "unsupported-claim", "noun-phrase", "tone", "provenance:assumed-stated", "provenance:invented-period", "coverage:section-missing"]) expect(rules, rule).toContain(rule);
    expect(r.gateA.pass).toBe(false);
    expect(r.gateB.pass).toBe(false);
  });
  it("catches a table too dense to read and a column that is empty in every row (found in visual review)", () => {
    const d = get("minimal", "cim");
    const long = "x".repeat(70);
    const t = { id: "t", type: "table", columns: ["A", "B", "C", "D", "E", "F"].map((l, k) => ({ key: `c${k}`, label: l })), rows: [[{ text: "a" }, { text: long }, { text: "—" }, { text: "d" }, { text: "e" }, { text: "f" }]] };
    const v = { ...d.item.version, ddm: { ...d.item.version.ddm, sections: [...d.item.version.ddm.sections, { id: "sx", heading: "X", level: 1, order: 99, blocks: [t] }] } };
    const rules = reviewVersion(v as never, d.truth, false).findings.map((f) => f.rule);
    expect(rules).toContain("table-dense");
    expect(rules).toContain("table-empty-column");
  });
  it("investment highlights state strengths only; weaknesses go to the risks section (found in visual review)", () => {
    const secs = get("minimal", "cim").item.version.ddm.sections;
    // the overview paragraph states the facts plainly; the highlight bullets carry strengths only
    const hl = JSON.stringify((secs.find((x) => /highlights/i.test(x.heading))?.blocks ?? []).filter((b) => (b as { type: string }).type === "bullets"));
    const risks = JSON.stringify(secs.find((x) => /risks/i.test(x.heading)));
    expect(hl).not.toMatch(/loss-making|below the 40/);
    expect(risks).toMatch(/loss-making/);
    expect(risks).toMatch(/Rule of 40 score is 15/);
  });
});
