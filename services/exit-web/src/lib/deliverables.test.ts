import { describe, expect, it } from "vitest";
import { docToMarkdown, docFilename, buyerIntroLetter, introFilename, buyerListCsv, briefMarkdown } from "./deliverables.js";
import { BUYERS, VALUATION_STRATEGIC } from "./engines.js";
import { TemplateMemorandumGenerator } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile.js";

describe("deliverables", () => {
  it("renders a generated memorandum to non-empty Markdown", async () => {
    const doc = await new TemplateMemorandumGenerator().generate("buyer_teaser", {
      company: SAMPLE_COMPANY, valuation: VALUATION_STRATEGIC,
    });
    const md = docToMarkdown(doc);
    expect(md).toContain(`# ${doc.title}`);
    expect(md.length).toBeGreaterThan(100);
    expect(docFilename(doc)).toMatch(/\.md$/);
    expect(md).not.toMatch(/undefined|NaN/);
  });

  it("writes a personalized, addressed buyer intro letter", () => {
    const b = BUYERS.candidates[0];
    const letter = buyerIntroLetter({ buyer: b, projectName: "Project Cipher", askMid: VALUATION_STRATEGIC.headline.mid, fromName: "Anne Kovac" });
    expect(letter).toContain(b.buyer.name);
    expect(letter).toContain(b.rationale);
    expect(letter).toContain("Project Cipher");
    expect(introFilename(b)).toMatch(/^intro-.+\.txt$/);
  });

  it("exports the shortlist as a CSV with a header row per buyer", () => {
    const list = BUYERS.candidates.slice(0, 5);
    const csv = buyerListCsv(list);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("Buyer");
    expect(lines).toHaveLength(list.length + 1);
  });

  it("builds a titled brief from key/value rows", () => {
    const md = briefMarkdown("Test brief", [["A", "1"], ["B", "2"]], "Body line.");
    expect(md).toContain("# Test brief");
    expect(md).toContain("- **A:** 1");
    expect(md).toContain("Body line.");
  });
});
