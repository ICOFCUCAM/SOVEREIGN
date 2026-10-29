import { describe, expect, it } from "vitest";
import { frontMatterChecks, putInOrder } from "./front-matter-check";
import type { Manuscript } from "./manuscript";

const S = "This sentence about the oneness of Yahuah is long enough to count as one.";
const base = (): Manuscript => ({ title: "B", author: "A", history: [], sections: [
  { id: "p", kind: "preface", title: "Preface", body: "I wrote this book after many years of teaching the scriptures to my people." },
  { id: "i", kind: "introduction", title: "Introduction", body: S },
  { id: "1", kind: "chapter", title: "One Yahuah", body: "Text." },
  { id: "2", kind: "chapter", title: "The Nature of Yahuah", body: "Text." },
  { id: "g", kind: "glossary", title: "Glossary", body: "Shema: the confession." },
] });
const failing = (m: Manuscript) => frontMatterChecks(m).filter((c) => !c.ok).map((c) => c.text);

describe("front matter check before the book is complete", () => {
  it("passes a book in order, with the Introduction followed by Chapter 1", () => {
    expect(failing(base())).toEqual([]);
    expect(frontMatterChecks(base()).map((c) => c.text).join(" ")).toMatch(/Introduction is followed by Chapter 1; 2 chapters in order/);
  });
  it("finds pages out of order, twice, empty or unfilled, a Preface repeating the Introduction, and misnumbered chapters", () => {
    const m = base();
    m.sections = [m.sections[4], ...m.sections.slice(0, 4)]; // the glossary first
    m.sections.push({ id: "p2", kind: "preface", title: "Preface", body: "Another." }, { id: "d", kind: "dedication", title: "Dedication", body: "" }, { id: "a", kind: "about-author", title: "About the author", body: "[[YOURS: where you live]]" });
    m.sections[1] = { ...m.sections[1], body: S }; // preface = introduction
    m.sections[3] = { ...m.sections[3], title: "2. One Yahuah" };
    const f = failing(m).join(" | ");
    expect(f).toMatch(/out of the usual order/);
    expect(f).toMatch(/twice: Preface/);
    expect(f).toMatch(/Empty: Dedication/);
    expect(f).toMatch(/Still to fill in: About the author/);
    expect(f).toMatch(/Preface repeats the Introduction/);
    expect(f).toMatch(/“2\. One Yahuah” is chapter 1/);
  });
  it("ignores a page the author left out", () => {
    const m = base(); m.sections.push({ id: "d", kind: "dedication", title: "Dedication", body: "", omit: true });
    expect(failing(m)).toEqual([]);
  });
});

describe("putting the book in order", () => {
  it("moves front and back matter to their places, keeps the chapters' order, and the check then passes", () => {
    const m = base();
    m.sections = [m.sections[4], m.sections[2], m.sections[0], m.sections[3], m.sections[1]];
    const fixed = putInOrder(m);
    expect(fixed.sections.map((s) => s.id)).toEqual(["p", "i", "1", "2", "g"]);
    expect(failing(fixed)).toEqual([]);
  });
  it("says when a given ISBN isn't a real one", () => {
    expect(failing({ ...base(), meta: { isbn: "978-0-00-000000-1" } }).join(" ")).toMatch(/isn't a valid ISBN/);
    expect(failing({ ...base(), meta: { isbn: "978-0-306-40615-7" } })).toEqual([]);
  });
});
