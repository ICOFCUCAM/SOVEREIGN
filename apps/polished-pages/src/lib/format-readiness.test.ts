import { describe, expect, it } from "vitest";
import type { Manuscript } from "@/lib/manuscript";
import { estimatePages, formatReport, MIN_PAPERBACK_PAGES, WORDS_PER_HOUR } from "@/lib/format-readiness";

const book = (extra: Partial<Manuscript> = {}, body = "word ".repeat(30_000).trim()): Manuscript => ({
  title: "Demonology", author: "The Author", history: [], sections: [
    { id: "p", kind: "preface", title: "Preface", body: "Why I wrote it." },
    { id: "c1", kind: "chapter", title: "One", body },
    { id: "c2", kind: "chapter", title: "Two", body: "Short chapter." },
  ], ...extra,
});

describe("format readiness", () => {
  it("estimates pages from the trim size and says it is an estimate", () => {
    expect(estimatePages(book(), "6x9")).toBe(Math.ceil(30_007 / 300) + 3 + 4);
    const r = formatReport("print", book(), { cover: true });
    expect(r.facts[0]).toMatch(/^About \d+ pages \(estimated until typeset\)/);
    expect(formatReport("print", book({ meta: { pageCount: "212", trimSize: "6x9" } }), { cover: true }).facts[0]).toBe("212 pages");
  });

  it("EPUB needs a title, an author and a cover; flags images without descriptions", () => {
    const r = formatReport("epub", book({ author: "" }, "Text ![](map.png) more."), { cover: false });
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => /No author/.test(c.text))).toBeTruthy();
    expect(r.checks.find((c) => /front cover image/.test(c.text))).toMatchObject({ ok: false, fix: "cover" });
    expect(r.checks.find((c) => /no description for screen readers/.test(c.text))).toMatchObject({ level: "advised", sectionId: "c1" });
    expect(formatReport("epub", book({ meta: { language: "English" } }), { cover: true }).ready).toBe(true);
  });

  it("paperback: page minimum, ISBN, cover, and the spine from the page count and paper", () => {
    const thin = formatReport("paperback", book({}, "A few words."), { cover: true });
    expect(thin.checks.find((c) => c.text.includes(`at least ${MIN_PAPERBACK_PAGES}`))?.ok).toBe(false);
    expect(thin.facts.some((f) => /No spine text below 80 pages/.test(f))).toBe(true);
    const r = formatReport("paperback", book({ meta: { isbn: "978-1-23", trimSize: "6x9", pageCount: "300", paper: "Cream" } }), { cover: true });
    expect(r.ready).toBe(true);
    expect(r.facts.find((f) => f.startsWith("Spine"))).toBe("Spine 19.1 mm on cream paper; full wrap 13.00 × 9.25 in with bleed.");
    expect(r.facts).toContain("Spine text allowed.");
  });

  it("audiobook: narration time, one file per chapter, and what reads badly aloud", () => {
    const r = formatReport("audiobook", book({}, `${"word ".repeat(WORDS_PER_HOUR * 2)}\n\n| a | b |\n\nAs shown (Black, 1992).`), { cover: false });
    expect(r.facts[0]).toBe(`About 2.0 hours of narration at ${WORDS_PER_HOUR.toLocaleString()} words an hour.`);
    expect(r.checks.find((c) => /table/.test(c.text))).toMatchObject({ level: "advised", ok: false });
    expect(r.checks.find((c) => /read aloud/.test(c.text))).toBeTruthy();
    expect(r.ready).toBe(true); // advice only
  });

  it("leftover markers block every format", () => {
    for (const f of ["epub", "print", "paperback", "audiobook"] as const) {
      const r = formatReport(f, book({ meta: { isbn: "1", language: "en", trimSize: "6x9", pageCount: "300" } }, "Body [[YOURS: a story]] and [citation needed]."), { cover: true });
      expect(r.checks.find((c) => /2 markers still in the text/.test(c.text))).toMatchObject({ ok: false, sectionId: "c1" });
      expect(r.ready).toBe(false);
    }
  });
});
