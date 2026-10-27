import { describe, expect, it } from "vitest";
import { authorshipNotes, compile, importText, insertSection, moveSection, type Manuscript } from "./manuscript";

const base = (): Manuscript => ({ title: "Walking by Faith", author: "T. Chamer", history: [], sections: [
  { id: "c1", kind: "chapter", title: "The First Step", body: "One." },
  { id: "c2", kind: "chapter", title: "The Long Road", body: "Two." },
] });

describe("manuscript", () => {
  it("puts new sections where publishing convention expects them", () => {
    let m = base();
    m = insertSection(m, "bibliography").manuscript;
    m = insertSection(m, "dedication").manuscript;
    m = insertSection(m, "preface").manuscript;
    m = insertSection(m, "copyright").manuscript;
    m = insertSection(m, "chapter").manuscript;
    m = insertSection(m, "about-author").manuscript;
    m = insertSection(m, "glossary").manuscript;
    expect(m.sections.map((s) => s.kind)).toEqual(["copyright", "dedication", "preface", "chapter", "chapter", "chapter", "glossary", "bibliography", "about-author"]);
    expect(m.sections[5].title).toBe("Chapter 3");
  });

  it("moves sections only within their group", () => {
    let m = insertSection(base(), "preface").manuscript;
    m = moveSection(m, "c1", -1); // would cross into front matter
    expect(m.sections[1].id).toBe("c1");
    m = moveSection(m, "c1", 1);
    expect(m.sections.map((s) => s.id).slice(1)).toEqual(["c2", "c1"]);
  });

  it("imports a book: title, chapters and known front/back matter", () => {
    const m = importText("x", "# My Book\n\n## Dedication\n\nTo Ann.\n\n## Chapter One\n\nFirst.\n\n## Bibliography\n\n- A book.");
    expect(m.title).toBe("My Book");
    expect(m.sections.map((s) => [s.kind, s.title])).toEqual([["dedication", "Dedication"], ["chapter", "Chapter One"], ["bibliography", "Bibliography"]]);
  });

  it("compiles in publishing order with a table of contents after the dedication", () => {
    let m = base();
    m = insertSection(m, "dedication").manuscript; m.sections[0].body = "To Ann.";
    m = insertSection(m, "bibliography").manuscript;
    const md = compile(m, { contents: true });
    expect(md.split("\n")[0]).toBe("# Walking by Faith");
    const order = [...md.matchAll(/^## (.+)$/gm)].map((x) => x[1]);
    expect(order).toEqual(["Dedication", "Contents", "The First Step", "The Long Road", "Bibliography"]);
    expect(md).toMatch(/## Contents\n\n- The First Step\n- The Long Road\n- Bibliography/);
  });

  it("writes authorship notes from the history", () => {
    const m = { ...base(), history: [{ sectionId: "c1", op: "expand", engine: "claude-code" as const, at: new Date().toISOString(), accepted: true }] };
    expect(authorshipNotes(m)).toMatch(/\| The First Step \| expand \| Claude Code \| accepted \|/);
  });
});

import { isChapterLine } from "./manuscript";
describe("chapter headings in plain text from a PDF", () => {
  it("takes real headings and leaves sentences that start with the word", () => {
    for (const ok of ["CHAPTER 1", "Chapter 3", "Chapter 3: The Name of God", "CHAPTER 12 THE NEW BIRTH", "Part II", "Chapter Four", "Chapter 2 — Baptism"]) expect(isChapterLine(ok)).toBe(true);
    for (const no of ["chapter 9.) In short, the Book of Revelation tells us", "Chapter 4 affirmed that Jesus is God. In this chap-", "Chapter 4 discussed the biblical concept of the", "Chapter 5, we saw that", "Part of the problem is this"]) expect(isChapterLine(no)).toBe(false);
  });
});
