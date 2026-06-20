import { describe, it, expect } from "vitest";
import { splitBook } from "@/lib/book-split";

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

describe("splitBook", () => {
  it("splits a multi-chapter book on chapter headings", () => {
    const body = "A substantial paragraph of chapter prose. ".repeat(220); // ~9k chars
    const book = `# Title\n\n## Chapter One\n\n${body}\n\n## Chapter Two\n\n${body}\n\n## Chapter Three\n\n${body}`;
    const sections = splitBook(book);
    expect(sections.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps a tiny book as a single section (no flood of micro-calls)", () => {
    const book = `## One\n\nAlpha.\n\n## Two\n\nBeta.`;
    expect(splitBook(book)).toHaveLength(1);
  });

  it("never loses content (every source word survives in some section)", () => {
    const book = `## One\n\nThe quiet algorithm hummed.\n\n## Two\n\nNumbers bloomed across dark glass.`;
    const joined = splitBook(book).join("\n");
    for (const w of words(book)) {
      expect(words(joined)).toContain(w);
    }
  });

  it("returns a single section for short, heading-less text", () => {
    const text = "Just a few plain sentences with no headings at all. Nothing special here.";
    const sections = splitBook(text);
    expect(sections).toHaveLength(1);
    expect(sections[0]).toContain("plain sentences");
  });

  it("breaks very long heading-less runs into multiple sections", () => {
    const para = "This is a long paragraph repeated many times. ".repeat(60); // ~2.7k chars
    const big = Array.from({ length: 12 }, () => para).join("\n\n"); // ~32k chars, no headings
    const sections = splitBook(big);
    expect(sections.length).toBeGreaterThan(1);
    // each section stays comfortably under the function's hard limit
    for (const s of sections) expect(s.length).toBeLessThan(40000);
  });
});
