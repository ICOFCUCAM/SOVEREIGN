import { describe, expect, it } from "vitest";
import { CHUNK, authorPreview, chunkBook, diffVersions, estimateTokens, parseStructure } from "@/lib/teacher/pipeline";
import { scriptureRefs } from "@/lib/teacher/scripture";

const sentence = (i: number) => `Sentence ${i} explains how the ancient texts describe spirits and their roles in daily life.`;
const para = (n: number, from = 0) => Array.from({ length: n }, (_, i) => sentence(from + i)).join(" ");
const BOOK = `# Demonology

## Preface

This book began as a set of lectures.

## Defining the Subject: Terms, Methods and Sources

${para(6)}

### Terms {#terms}

${para(8, 10)}

${para(8, 20)}

#### Hebrew words

The word sa'ir appears in Leviticus 17:7 and Isa. 13:21; compare Gen 6:1–4 and 1 Enoch 6:1.

## Spirits in the Ancient Near East

${Array.from({ length: 12 }, (_, i) => para(5, 100 + i * 5)).join("\n\n")}

## Bibliography

Black, J. and Green, A. Gods, Demons and Symbols of Ancient Mesopotamia.
`;

describe("AI Teacher content pipeline", () => {
  it("reads chapters, numbers only real chapters, and gives stable readable IDs", () => {
    const s = parseStructure(BOOK);
    expect(s.title).toBe("Demonology");
    expect(s.chapters.map((c) => [c.id, c.number])).toEqual([
      ["preface", null], ["ch-01-defining-the-subject-terms-methods-and-sources", 1], ["ch-02-spirits-in-the-ancient-near-east", 2], ["bibliography", null],
    ]);
    const ch1 = s.chapters[1];
    expect(ch1.sections.map((x) => x.id)).toEqual(["ch-01-defining-the-subject-terms-methods-and-sources", "terms", "ch-01-defining-the-subject-terms-methods-and-sources--hebrew-words"]);
    expect(ch1.sections[2].headingPath).toEqual(["Defining the Subject: Terms, Methods and Sources", "Terms", "Hebrew words"]);
    // paragraph offsets point at the exact text in the source
    const p = ch1.sections[1].paragraphs[0];
    expect(BOOK.slice(p.charStart, p.charEnd)).toBe(p.text);
    expect(s.issues).toEqual([]);
  });

  it("reports structure problems the author must see before indexing", () => {
    const s = parseStructure("Loose text.\n\n## One\n\n#### Too deep\n\nText [[YOURS: a story]]\n\n## One\n\n## Empty\n");
    const codes = s.issues.map((i) => i.code);
    expect(codes).toEqual(expect.arrayContaining(["text-before-first-chapter", "heading-skip", "duplicate-chapter", "empty-chapter", "unresolved-marker"]));
    expect(parseStructure("Just text, no headings.").issues.find((i) => i.code === "no-chapters")).toMatchObject({ level: "error" });
  });

  it("chunks within sections near the target size, never across sections, with overlap and full metadata", async () => {
    const v = await chunkBook(BOOK, { id: "demonology" });
    for (const c of v.chunks) {
      expect(c.tokens).toBeLessThanOrEqual(CHUNK.max + CHUNK.overlap);
      expect(c.id.startsWith(`demonology:${c.chapterId}:`)).toBe(true);
      expect(c.contentHash).toMatch(/^[0-9a-f]{64}$/);
    }
    const ane = v.chunks.filter((c) => c.chapterId === "ch-02-spirits-in-the-ancient-near-east");
    expect(ane.length).toBeGreaterThan(1);
    expect(ane.slice(0, -1).every((c) => c.tokens >= CHUNK.min)).toBe(true);
    // neighbouring chunks share their boundary sentence
    const shared = ane[1].text.split("\n\n")[0];
    expect(estimateTokens(shared)).toBeLessThanOrEqual(CHUNK.overlap);
    expect(ane[0].text.endsWith(shared)).toBe(true);
    // short sections stay whole; the preface is one chunk
    expect(v.chunks.filter((c) => c.chapterId === "preface")).toHaveLength(1);
    const hebrew = v.chunks.find((c) => c.headingPath.at(-1) === "Hebrew words")!;
    expect(hebrew.sourceLocation).toBe("Chapter 1 › Terms › Hebrew words ¶4") // paragraphs are numbered within the chapter;
    expect(hebrew.scriptureRefs.map((r) => r.normalized)).toEqual(["LEV 17:7", "ISA 13:21", "GEN 6:1-4", "1EN 6:1"]);
    expect(BOOK.slice(hebrew.charStart, hebrew.charEnd)).toBe(hebrew.text);
  });

  it("splits a paragraph longer than the maximum at sentences, and always finishes", async () => {
    const huge = `## Long\n\n${para(120)}\n\n${para(3, 500)}`;
    const v = await chunkBook(huge, { id: "b" });
    expect(estimateTokens(para(120))).toBeGreaterThan(CHUNK.max);
    expect(v.chunks.length).toBeGreaterThan(3);
    expect(v.chunks.every((c) => c.tokens <= CHUNK.max + CHUNK.overlap)).toBe(true);
    expect(v.chunks.at(-1)!.text).toContain("Sentence 502");
  });

  it("keeps the IDs of unchanged passages across versions, so their citations survive an edit", async () => {
    const v1 = await chunkBook(BOOK, { id: "demonology" });
    const v2 = await chunkBook(BOOK.replace("This book began as a set of lectures.", "This book began as lectures given in 2024."), { id: "demonology" });
    expect(v1.contentHash).not.toBe(v2.contentHash);
    const d = diffVersions(v1, v2);
    expect(d.added).toHaveLength(1);
    expect(d.removed).toHaveLength(1);
    expect(d.kept).toBe(v1.chunks.length - 1);
    expect(diffVersions(null, v1).added).toHaveLength(v1.chunks.length);
  });

  it("gives the author a preview of chapters, counts and scripture before indexing", async () => {
    const pv = authorPreview(await chunkBook(BOOK, { id: "demonology" }));
    expect(pv.blocking).toBe(false);
    expect(pv.chapters[1]).toMatchObject({ label: "Chapter 1", sections: 2, scripture: ["LEV 17:7", "ISA 13:21", "GEN 6:1-4", "1EN 6:1"] });
    expect(pv.chapters[0]).toMatchObject({ label: "Unnumbered", title: "Preface", chunks: 1 });
  });
});

describe("scripture references", () => {
  it("normalises names and abbreviations and keeps the original wording", () => {
    expect(scriptureRefs("See 1 John 4:1, Ps 91, Mark 5:1-20 and Rev. 12:9.").map((r) => [r.normalized, r.original])).toEqual([
      ["1JN 4:1", "1 John 4:1"], ["PSA 91", "Ps 91"], ["MRK 5:1-20", "Mark 5:1-20"], ["REV 12:9", "Rev. 12:9"],
    ]);
  });
  it("does not read ordinary words as books", () => {
    expect(scriptureRefs("They had a job 2 days a week; acts 3 times.")).toEqual([]);
  });
});
