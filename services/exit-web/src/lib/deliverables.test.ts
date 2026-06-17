import { describe, expect, it } from "vitest";
import {
  docToMarkdown, docFilename, buyerIntroLetter, introFilename, buyerListCsv,
  valuationMemo, institutionalValuationMemo, buyerShortlistMemo, riskReportDoc, structuredDoc, frameDoc,
  outreachPlanDoc, dataRoomGatingDoc, offerComparisonDoc, closingChecklistDoc, wealthPlanDoc, tracedDocMarkdown,
} from "./deliverables.js";
import { BUYERS, VALUATION_STRATEGIC, VALUATION_INSTITUTIONAL, VALUATION_FACTS, DOCUMENT_SUITE, OFFER_COMPARISON, NEGOTIATION_STATE, DILIGENCE } from "./engines.js";
import { TemplateMemorandumGenerator } from "@exit/engines";
import type { MemorandumKind } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile.js";
import { discoverFindings, buildSellerReport } from "./diligence-intel.js";

const noPlaceholders = (s: string): void => {
  expect(s).not.toMatch(/undefined|NaN|\[object Object\]/);
};

describe("document framework", () => {
  it("frames a confidential, sectioned, disclaimed document", () => {
    const md = frameDoc({ title: "T", subtitle: "S", sections: [{ heading: "H", body: "B", table: { headers: ["A", "B"], rows: [["1", "2"]] } }] });
    expect(md).toContain("# T");
    expect(md).toContain("STRICTLY CONFIDENTIAL");
    expect(md).toContain("## 1. H");
    expect(md).toContain("| A | B |");
    expect(md).toMatch(/investment, legal or tax advice/);
    expect(md).not.toMatch(/generated|deterministic engines|template-memorandum/i);
  });
});

describe("deliverables", () => {
  it("valuation memo carries conclusion, methodology table and premia", () => {
    const md = valuationMemo(VALUATION_STRATEGIC, SAMPLE_COMPANY.name);
    expect(md).toContain("Company Valuation");
    expect(md).toContain("Valuation conclusion");
    expect(md).toContain("Methodology");
    // every methodology row is present
    for (const m of VALUATION_STRATEGIC.methodologies) expect(md).toContain(m.name);
    expect(md.length).toBeGreaterThan(600);
    noPlaceholders(md);
  });

  it("institutional valuation memo is evidence-driven across all six dimensions", () => {
    const md = institutionalValuationMemo(VALUATION_INSTITUTIONAL);
    const r = VALUATION_INSTITUTIONAL;
    expect(md).toContain("Institutional Valuation");
    // 1 — explained conclusion
    expect(md).toMatch(/= financial baseline .* × \(1 \+/);
    // 2 — normalized weights
    expect(md).toContain("normalized and sum to 100%");
    // 3 — evidence-based premium with observed precedents
    expect(md).toContain("Strategic premium — evidence");
    expect(md).toContain("Observed precedent premiums");
    // 4 — comparable transactions, each sourced
    expect(md).toContain("Comparable transactions");
    for (const c of r.comparableTransactions.slice(0, 3)) expect(md).toContain(c.target);
    // 5 — confidence score
    expect(md).toContain("Confidence score");
    expect(md).toContain(`${r.confidence.score}%`);
    // 6 — buyer universe + most likely buyers
    expect(md).toContain("Buyer universe");
    for (const b of r.mostLikelyBuyers.slice(0, 3)) expect(md).toContain(b.name);
    expect(md).toContain("Strategic buyer rationale");
    // framework governance — provenance, variable coverage, mandatory-output checklist
    expect(md).toContain(`Framework v${r.frameworkVersion}`);
    expect(md).toContain("Valuation variables & provenance");
    expect(md).toContain("Data provenance summary");
    expect(md).toContain("Framework compliance — mandatory outputs");
    for (const field of r.provenanceSummary.requiredFields) expect(md).toContain(field);
    expect(md.length).toBeGreaterThan(1500);
    noPlaceholders(md);
  });

  it("the document factory renders every kind, fully traceable, from one fact sheet", () => {
    // the tear block exists with the headline metrics
    const keys = VALUATION_FACTS.map((f) => f.key);
    for (const k of ["enterprise_value", "confidence", "comparable_transactions", "qualified_buyers", "applied_premium", "data_freshness"]) {
      expect(keys, k).toContain(k);
    }
    for (const kind of ["board_report", "market_update", "buyer_brief", "acquisition_recommendation", "exit_readiness", "valuation_summary"] as const) {
      const doc = DOCUMENT_SUITE[kind];
      expect(doc.traceability.ok, `${kind} fully traceable`).toBe(true);
      const md = tracedDocMarkdown(doc);
      expect(md).toContain("Valuation fact sheet");
      expect(md).toContain("Traceability");
      expect(md).toContain(`Framework v${doc.frameworkVersion}`);
      // the governed midpoint appears verbatim — no per-document recompute
      expect(md).toContain(VALUATION_INSTITUTIONAL.headline.mid >= 1e9
        ? `$${(VALUATION_INSTITUTIONAL.headline.mid / 1e9).toFixed(2)}B`
        : `$${(VALUATION_INSTITUTIONAL.headline.mid / 1e6).toFixed(1)}M`);
      expect(md.length).toBeGreaterThan(500);
      noPlaceholders(md);
    }
  });

  it("buyer target list has a ranked table and a profile per buyer", () => {
    const list = BUYERS.candidates.slice(0, 5);
    const md = buyerShortlistMemo(list, "Project Cipher");
    expect(md).toContain("Buyer Target List");
    expect(md).toContain("Expected offer");
    for (const c of list) {
      expect(md).toContain(c.buyer.name);
      expect(md).toContain(c.buyer.thesis);
    }
    noPlaceholders(md);
  });

  it("buyer CSV exports the rich signal columns", () => {
    const list = BUYERS.candidates.slice(0, 4);
    const csv = buyerListCsv(list);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("Expected offer");
    expect(lines[0]).toContain("Days to close");
    expect(lines).toHaveLength(list.length + 1);
    noPlaceholders(csv);
  });

  it("seller risk report is framed with severity and findings", () => {
    const md = riskReportDoc(buildSellerReport(discoverFindings()));
    expect(md).toContain("Severity profile");
    expect(md).toContain("Findings");
    expect(md).toContain("Recommendation");
    noPlaceholders(md);
  });

  it("intro letter is personalized and confidential", () => {
    const b = BUYERS.candidates[0];
    const letter = buyerIntroLetter({ buyer: b, projectName: "Project Cipher", askMid: VALUATION_STRATEGIC.headline.mid, fromName: "Anne Kovac" });
    expect(letter).toContain("STRICTLY CONFIDENTIAL");
    expect(letter).toContain(b.buyer.name);
    expect(letter).toContain(b.buyer.thesis);
    expect(introFilename(b)).toMatch(/^intro-.+\.txt$/);
    noPlaceholders(letter);
  });

  it("generated memorandum renders to framed Markdown", async () => {
    const doc = await new TemplateMemorandumGenerator().generate("buyer_teaser", { company: SAMPLE_COMPANY, valuation: VALUATION_STRATEGIC });
    const md = docToMarkdown(doc);
    expect(md).toContain(`# ${doc.title}`);
    expect(docFilename(doc)).toMatch(/\.md$/);
    noPlaceholders(md);
  });

  it("structuredDoc composes multi-section documents", () => {
    const md = structuredDoc("Plan", "Sub", [{ heading: "X", bullets: ["a", "b"] }]);
    expect(md).toContain("## 1. X");
    expect(md).toContain("- a");
  });
});

// ── Every document the platform can produce has substantive content ──
describe("all generated documents have content", () => {
  const fmt = (n: number): string => `$${n.toLocaleString()}`;
  const shortlist = BUYERS.candidates.slice(0, 7);
  const leaderName = OFFER_COMPARISON.offers[0]?.offer.buyerName;

  // Filename → built document, mirroring exactly what each surface generates.
  const builds: Record<string, () => string> = {
    "valuation-summary.md": () => valuationMemo(VALUATION_STRATEGIC, SAMPLE_COMPANY.name),
    "buyer-target-list.md": () => buyerShortlistMemo(shortlist, "Project Cipher"),
    "outreach-plan.md": () => outreachPlanDoc({ projectName: "Project Cipher", shortlistCount: shortlist.length, anchor: fmt(VALUATION_STRATEGIC.headline.mid) }),
    "data-room-gating.md": () => dataRoomGatingDoc(DILIGENCE.documents.length),
    "seller-diligence-report.md": () => riskReportDoc(buildSellerReport(discoverFindings())),
    "offer-comparison.md": () => offerComparisonDoc({
      summary: OFFER_COMPARISON.summary,
      offers: OFFER_COMPARISON.offers.map((e) => ({ buyer: e.offer.buyerName, type: e.offer.buyerType, score: `${e.score.toFixed(0)}/100`, headline: fmt(e.offer.headlinePriceUsd), net: fmt(e.impliedNetToFoundersUsd) })),
      dynamics: OFFER_COMPARISON.delta.map((d) => [d.term, d.notes] as [string, string]),
      posture: [`Leverage: ${NEGOTIATION_STATE.leverage}`, `Leading bid: ${leaderName ?? "—"}`],
    }),
    "closing-checklist.md": closingChecklistDoc,
    "wealth-transition-plan.md": () => wealthPlanDoc(fmt(VALUATION_STRATEGIC.headline.mid)),
    "buyer-shortlist.csv": () => buyerListCsv(shortlist),
    "intro-letter.txt": () => buyerIntroLetter({ buyer: shortlist[0], projectName: "Project Cipher", askMid: VALUATION_STRATEGIC.headline.mid, fromName: "Anne Kovac" }),
  };

  for (const [filename, build] of Object.entries(builds)) {
    it(`${filename} is substantive`, () => {
      const text = build();
      expect(text.length).toBeGreaterThan(500);
      noPlaceholders(text);
      if (filename.endsWith(".md")) {
        expect(text.trim().split("\n").length).toBeGreaterThan(10);
        expect(text).toMatch(/^# /m);          // a title
        expect(text).toMatch(/^## /m);          // at least one section
      }
    });
  }

  it("all five memorandum kinds render with real sections", async () => {
    const gen = new TemplateMemorandumGenerator();
    const kinds: readonly MemorandumKind[] = ["cim", "executive_summary", "investor_deck", "buyer_teaser", "dd_room_index"];
    for (const kind of kinds) {
      // mirror useMemorandum(): the pages always supply the full engine context
      const doc = await gen.generate(kind, { company: SAMPLE_COMPANY, valuation: VALUATION_STRATEGIC, buyers: BUYERS, diligence: DILIGENCE });
      const md = docToMarkdown(doc);
      expect(doc.sections.length, kind).toBeGreaterThan(0);
      expect(md.length, kind).toBeGreaterThan(800);
      noPlaceholders(md);
    }
  });

  it("memoranda INHERIT the Valuation Constitution when supplied", async () => {
    const gen = new TemplateMemorandumGenerator();
    const fwVersion = VALUATION_INSTITUTIONAL.frameworkVersion;
    // CIM, exec summary and deck must render the framework's governed figures
    for (const kind of ["cim", "executive_summary", "investor_deck"] as const) {
      const doc = await gen.generate(kind, {
        company: SAMPLE_COMPANY, valuation: VALUATION_STRATEGIC,
        constitution: VALUATION_INSTITUTIONAL, buyers: BUYERS, diligence: DILIGENCE,
      });
      const md = docToMarkdown(doc);
      expect(md, kind).toContain(`Framework v${fwVersion}`);
      // the governed midpoint figure appears verbatim (no per-doc recomputation)
      expect(md, kind).toContain(VALUATION_INSTITUTIONAL.mandatoryOutputs.midpoint_valuation);
    }
    // the anonymized teaser inherits the basis without leaking absolute figures
    const teaser = await gen.generate("buyer_teaser", {
      company: SAMPLE_COMPANY, valuation: VALUATION_STRATEGIC, constitution: VALUATION_INSTITUTIONAL,
    });
    const tmd = docToMarkdown(teaser);
    expect(tmd).toContain(`Framework v${fwVersion}`);
    expect(tmd).not.toContain(VALUATION_INSTITUTIONAL.mandatoryOutputs.midpoint_valuation);
  });
});
