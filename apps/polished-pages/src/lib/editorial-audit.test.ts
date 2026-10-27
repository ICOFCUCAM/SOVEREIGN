import { describe, expect, it } from "vitest";
import { auditBook, auditMarkdown, correctionBrief } from "./editorial-audit";

// A small book with the defects found in the October 2026 review of a rewrite (source/2026-10-rewrite-review.md).
const BOOK = `# Demonology I

## Course description

This course covers angelology and demonology. It forms part of a bachelor's programme. Learning outcomes are listed below.

### Course schedule

1. The creation of angels
2. Angelic hierarchies
3. Angels in salvation history
4. The Incarnation and the angels
6. Demons and their works

## Part II Demonology

### 19. The names of the enemy

The origin of the Devil and his angels is clear from Scripture, and we can say so plainly.

### 20. Sift

Satan desires to sift believers as wheat [citation needed]. He works through the Holy Ghost's absence.

### 20. Devour

The adversary seeks whom he may devour. The Holy Spirit protects the believer.

### 21. Their bodies

The origin and identity of demons cannot be known for certain, though many have speculated.

In a dream I saw many people in chains, and many of them were Christians in church.

Wherever I am, demons must pack and go out IN THE NAME OF Yahusha.

Some say demons cause homosexual tendencies in certain people.

## Part III Spirituality

#### A heading that skips a level

Text under it.

## References
`;

describe("editorial audit", () => {
  const r = auditBook(BOOK, { rules: "Write Yahusha instead of Jesus\nWrite Yahuah instead of God (never Jehovah or Yahweh)" });
  const by = (id: string) => r.findings.filter((f) => f.id.startsWith(id));

  it("catches duplicate and skipped numbering, by code", () => {
    expect(by("dup")[0]).toMatchObject({ area: "structure", level: "blocker" });
    expect(by("dup")[0].text).toContain("“20. Sift”, “20. Devour”");
    expect(by("lgap")[0].text).toBe("A numbered list jumps from 4 to 6: is an item missing?");
  });

  it("blocks editorial markers and an empty references section", () => {
    expect(by("placeholders")[0]).toMatchObject({ level: "blocker" });
    expect(by("placeholders")[0].text).toContain("[citation needed]");
    expect(by("refs")[0]).toMatchObject({ level: "blocker", text: "“References” has no entries" });
    expect(r.ready).toBe(false);
  });

  it("raises certainty that changes on the same subject, testimony and capitals", () => {
    const c = by("cert")[0];
    expect(c.area).toBe("coherence");
    expect(c.places.map((p) => p.excerpt)).toEqual([expect.stringContaining("is clear"), expect.stringContaining("cannot be known")]);
    expect(by("testimony")[0].text).toContain("personal testimony");
    expect(by("caps")[0].places[0].excerpt).toContain("IN THE NAME OF");
  });

  it("flags sensitive claims about groups for the author without changing them", () => {
    expect(by("sensitive")[0]).toMatchObject({ level: "review" });
    expect(by("sensitive")[0].places[0].excerpt).toBe("Some say demons cause homosexual tendencies in certain people.");
  });

  it("checks terminology variants, heading levels and the course schedule against the headings", () => {
    expect(by("var-Holy Ghost")[0].text).toContain("Both “Holy Ghost” (1) and “Holy Spirit” (1)");
    expect(by("skip")[0].text).toContain("from ## to ####");
    const cover = by("cover")[0];
    expect(cover.text).toContain("with no matching chapter or section");
    expect(cover.places.map((p) => p.excerpt)).toContain("The Incarnation and the angels");
    expect(cover.places.map((p) => p.excerpt)).not.toContain("Demons and their works");
  });

  it("says nothing against a clean book", () => {
    const clean = auditBook("# A book\n\n## Chapter 1 One\n\nThe first chapter has text.\n\n## Chapter 2 Two\n\nThe second chapter has text too.\n\n## References\n\nSmith, J. (2001). A study. Press.\n");
    expect(clean.findings).toEqual([]);
    expect(clean.ready).toBe(true);
  });

  it("enforces the book's rules outside quotations only", () => {
    const t = auditBook("# B\n\n## One\n\nGod spoke to his people.\n\n## Two\n\nThe verse reads “In the beginning God created”.\n", { rules: "Write Yahuah instead of God" });
    expect(t.findings.find((f) => f.id === "rules")?.places).toHaveLength(1);
  });

  it("writes the report as Markdown", () => {
    const md = auditMarkdown(r);
    expect(md).toMatch(/^# Editorial check\n\n\d+ blocking problems to fix before publishing\./);
    expect(md).toContain("## Structure and numbering");
  });
});

describe("targeted correction brief", () => {
  it("lists what to fix and where, and leaves judgement to the author", () => {
    const b = correctionBrief(auditBook(BOOK).findings);
    expect(b).toContain("- FIX: 2 headings share the number 20");
    expect(b).toMatch(/line \d+ \(20\. Sift\)/);
    expect(b).toContain("REVIEW (fix only if it can be done without changing the author's meaning; otherwise report it)");
    expect(b).not.toContain("personal testimony"); // notes are not sent for correction
  });
});

describe("the formats real rewrites use (October 2026: the live check missed them)", () => {
  const ids = (md: string) => auditBook(md).findings.map((f) => f.id.replace(/-\d+$/, ""));
  it("finds markers written with Markdown escapes or in brackets of another kind", () => {
    expect(ids("# B\n\n## One\n\nLucifer fell \\[citation needed\\].\n")).toContain("placeholders");
    expect(ids("# B\n\n## One\n\nA named medium (citation needed) said so.\n")).toContain("placeholders");
  });
  it("numbers bold labels and stand-alone numbered lines like headings", () => {
    const bold = auditBook("# B\n\n## Part II\n\n**19. Names**\n\nText.\n\n**20. Sift**\n\nText.\n\n**20. Devour**\n\nText.\n\n**22. Wiles**\n\nText.\n");
    expect(bold.findings.find((f) => f.id.startsWith("dup"))?.text).toBe("2 headings share the number 20: “20. Sift”, “20. Devour”");
    expect(bold.findings.find((f) => f.id.startsWith("gap"))?.text).toContain("jumps from 20 to 22");
    expect(bold.findings.find((f) => f.id.startsWith("dup"))?.places[0].excerpt).toBe("20. Sift");
    expect(ids("# B\n\n## Part II\n\n19. Names\n\nText about names.\n\n20. Sift\n\nText about sifting.\n\n20. Devour\n\nText.\n")).toContain("dup");
    // an ordinary numbered list is not a set of section labels
    expect(ids("# B\n\n## One\n\n1. First step\n2. Second step\n3. Third step\n\nText.\n")).toEqual([]);
  });
  it("reads headings and bold labels as one sequence when a book mixes them", () => {
    const r = auditBook("# B\n\n### 19. Names\n\nText.\n\n**20. Sift**\n\nText.\n\n**20. Devour**\n\nText.\n\n### 21. Wiles\n\nText.\n");
    expect(r.findings.filter((f) => f.id.startsWith("gap"))).toEqual([]);
    expect(r.findings.find((f) => f.id.startsWith("dup"))?.text).toContain("“20. Sift”, “20. Devour”");
  });

  it("does not count a note under References as a bibliography", () => {
    expect(auditBook("# B\n\n## One\n\nText.\n\n## References\n\n*(To be completed.)*\n").findings.find((f) => f.id.startsWith("refs"))?.text).toContain("no usable entries");
    expect(ids("# B\n\n## One\n\nText.\n\n## References\n\nKing James Bible (1611). London: Robert Barker.\n")).toEqual([]);
  });
});

describe("cross-references", () => {
  it("flags a reference to a section the book does not have", () => {
    const r = auditBook("# B\n\n### 1. One\n\nAs we shall see in section 9, spirits deceive.\n\n### 2. Two\n\nSee section 1 again.\n");
    const x = r.findings.find((f) => f.id === "xref")!;
    expect(x.places).toHaveLength(1);
    expect(x.places[0].excerpt).toContain("in section 9");
  });
});
