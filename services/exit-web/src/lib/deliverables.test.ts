import { describe, expect, it } from "vitest";
import {
  docToMarkdown, docFilename, buyerIntroLetter, introFilename, buyerListCsv,
  valuationMemo, buyerShortlistMemo, riskReportDoc, structuredDoc, frameDoc,
} from "./deliverables.js";
import { BUYERS, VALUATION_STRATEGIC } from "./engines.js";
import { TemplateMemorandumGenerator } from "@exit/engines";
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
    expect(md).toMatch(/not investment, legal or tax advice/);
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
