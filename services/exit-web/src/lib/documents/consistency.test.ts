import { describe, it, expect } from "vitest";
import { TemplateMemorandumGenerator, DEFAULT_PROCESS_TIMELINE, type CompanyProfile, type MemorandumKind } from "@exit/engines";
import { SAMPLE_COMPANY } from "../profile";
import { VALUATION_CANONICAL, VALUATION_INSTITUTIONAL, READINESS, BUYERS, DILIGENCE } from "../engines";
import { buildProfile, SAMPLE_INTAKE } from "../company-intake";
import { docToMarkdown } from "../deliverables";
import { closingChecklistDoc } from "../closing-checklist";
import { codeNameFor } from "../listings";
import { memorandumInputs } from "./memorandum-inputs";
import { checkDocument, checkSuite, checkClosingChecklist, type DocText, type Truth } from "./consistency";

const KINDS: Record<MemorandumKind, string> = {
  cim: "exitos.cim", executive_summary: "exitos.executive_summary", investor_deck: "exitos.investor_deck",
  buyer_teaser: "exitos.teaser", dd_room_index: "exitos.data_room_index",
};
const gen = new TemplateMemorandumGenerator();

/** Every memorandum the Document Generator produces for a company, as it produces them. */
async function suite(company: CompanyProfile, fromIntake: boolean): Promise<{ docs: DocText[]; truth: Truth }> {
  const inputs = memorandumInputs(company, fromIntake);
  const base = { company: SAMPLE_COMPANY, valuation: VALUATION_CANONICAL, constitution: VALUATION_INSTITUTIONAL, readiness: READINESS, buyers: BUYERS, diligence: DILIGENCE, ...inputs };
  const docs: DocText[] = [];
  for (const [kind, typeId] of Object.entries(KINDS) as Array<[MemorandumKind, string]>) {
    const d = await gen.generate(kind, base);
    docs.push({ typeId, title: d.title, text: docToMarkdown(d), anonymized: d.anonymized });
  }
  const h = base.valuation.headline;
  return { docs, truth: { company: base.company, codeName: codeNameFor(company, !fromIntake), valuation: { low: h.low, mid: h.mid, high: h.high }, timeline: DEFAULT_PROCESS_TIMELINE } };
}
const replace = (s: { docs: DocText[] }, typeId: string, from: string | RegExp, to: string): DocText[] =>
  s.docs.map((d) => (d.typeId === typeId ? { ...d, text: d.text.replace(from, to) } : d));

describe("cross-document consistency — the generated suite", () => {
  it("the demo company's documents agree with each other, the valuation, the timeline and the checklist", async () => {
    const s = await suite(SAMPLE_COMPANY, false);
    expect(checkSuite(s.docs, s.truth, closingChecklistDoc({}))).toEqual([]);
  });

  it("a founder's own company: its documents agree, and none carries the demo company", async () => {
    const own = { ...buildProfile({ ...SAMPLE_INTAKE, name: "Northwind Analytics", arrUsd: 7_400_000, ttmRevenueUsd: 9_100_000, growthPct: 0.31, grossMarginPct: 0.71, ebitdaMarginPct: 0.12, netRetentionPct: 1.14 }), id: "co-test" };
    const s = await suite(own, true);
    const all = s.docs.map((d) => d.text).join("\n");
    expect(all).not.toContain(SAMPLE_COMPANY.name);
    expect(all).toContain("Northwind Analytics");
    expect(checkSuite(s.docs, s.truth)).toEqual([]);
  });
});

describe("cross-document consistency — each check catches a contradiction", () => {
  it("a figure that differs from the company's", async () => {
    const s = await suite(SAMPLE_COMPANY, false);
    const growth = Math.round(SAMPLE_COMPANY.growth.arrGrowthYoyPct * 100);
    const f = checkSuite(replace(s, "exitos.executive_summary", new RegExp(`${growth}% year over year`), `${growth + 9}% year over year`), s.truth);
    expect(f).toContainEqual(expect.objectContaining({ check: "figure", typeId: "exitos.executive_summary", what: "ARR growth", found: `${growth + 9}%` }));
  });

  it("a valuation that is not the canonical one", async () => {
    const s = await suite(SAMPLE_COMPANY, false);
    // buyer documents state no valuation; a document that does must state the canonical one
    const f = checkSuite(replace(s, "exitos.cim", "## ", "On a strategic-buyer basis the enterprise value is $140.0M.\n\n## "), s.truth);
    expect(f).toContainEqual(expect.objectContaining({ check: "valuation", typeId: "exitos.cim", found: "140M" }));
  });

  it("a date that contradicts the process timeline", async () => {
    const s = await suite(SAMPLE_COMPANY, false);
    const f = checkSuite(replace(s, "exitos.teaser", "due in week 4", "due in week 7"), s.truth);
    expect(f).toContainEqual(expect.objectContaining({ check: "timeline", typeId: "exitos.teaser", expected: "Week 4" }));
    expect(checkDocument({ typeId: "x", title: "x", text: `${s.truth.company.name}. Letter of intent targeted in weeks 3–4.`, anonymized: false }, s.truth))
      .toContainEqual(expect.objectContaining({ check: "timeline", expected: "Weeks 5–6" }));
  });

  it("the company's name in a code-name document, or the wrong code name", async () => {
    const s = await suite(SAMPLE_COMPANY, false);
    const leaked = checkSuite(replace(s, "exitos.teaser", "## The opportunity", `## The opportunity\n\n${SAMPLE_COMPANY.name}`), s.truth);
    expect(leaked).toContainEqual(expect.objectContaining({ check: "name", typeId: "exitos.teaser" }));
    const renamed = checkSuite(replace(s, "exitos.teaser", new RegExp(s.truth.codeName, "g"), "Project Cipher"), s.truth);
    expect(renamed).toContainEqual(expect.objectContaining({ check: "code_name", found: "Project Cipher", expected: s.truth.codeName }));
  });

  it("the demo company inside a founder's own document", async () => {
    const own = buildProfile({ ...SAMPLE_INTAKE, name: "Northwind Analytics" });
    const f = checkDocument({ typeId: "exitos.cim", title: "CIM", text: `Northwind Analytics, compared with ${SAMPLE_COMPANY.name}.`, anonymized: false }, { company: own, codeName: "Project Atlas" });
    expect(f).toContainEqual(expect.objectContaining({ check: "sample_data" }));
  });

  it("another currency", () => {
    const f = checkDocument({ typeId: "exitos.cim", title: "CIM", text: `${SAMPLE_COMPANY.name} reports €62.0M`, anonymized: false }, { company: SAMPLE_COMPANY, codeName: "Project Beacon" });
    expect(f).toContainEqual(expect.objectContaining({ check: "currency", found: "€6" }));
  });

  it("a closing checklist that drops, repeats or re-dates an item", () => {
    const doc = closingChecklistDoc({});
    expect(checkClosingChecklist(doc)).toEqual([]);
    const lines = doc.split("\n");
    const i = lines.findIndex((l) => l.includes("Bring-down certificate"));
    expect(checkClosingChecklist(lines.filter((_, n) => n !== i).join("\n"))).toContainEqual(expect.objectContaining({ what: "Bring-down certificate", found: "missing" }));
    expect(checkClosingChecklist([...lines, lines[i]].join("\n"))).toContainEqual(expect.objectContaining({ found: "listed 2 times" }));
    expect(checkClosingChecklist(doc.replace(/(Bring-down certificate[^\n]*?)weeks 10–16/, "$1weeks 4–5"))).toContainEqual(expect.objectContaining({ what: "Bring-down certificate timing", expected: "weeks 10–16" }));
  });
});
