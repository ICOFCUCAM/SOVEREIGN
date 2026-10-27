import { describe, expect, it } from "vitest";
import { BOOK_TYPES, DESIGN_RULES, designBrief, designToManuscript, parseDesign, restoreArchived, resultToManuscript, sectionsToWrite } from "./book-design";
import { sectionContext } from "./studio-backend";
import type { Manuscript } from "./manuscript";
import * as runner from "../../../../services/polished-claude-runner/src/prompts.mjs";

const r = runner as unknown as { DESIGN_RULES: string[]; BOOK_TYPES: typeof BOOK_TYPES; designBrief: (d: object) => string; buildRun: (a: string, o: object) => { prompt: string; output: string } };

const DESIGN = JSON.stringify({
  title: "Demonology I", subtitle: "A course", reader: "Students", rationale: "From foundations to practice.",
  sections: [
    { kind: "introduction", title: "Introduction", summary: "How to use the book.", keyPoints: [], draws: "Preface, p. 1", apparatus: "" },
    { kind: "part", title: "Part One: Foundations", summary: "" },
    { kind: "chapter", title: "The reality of the unseen", summary: "Why it matters.", keyPoints: ["Ephesians 6:12"], draws: "Introduction; ch. 3", apparatus: "Learning outcomes, summary, review questions" },
    { kind: "weird", title: "Kinds of spirits", summary: "Names and ranks." },
    { kind: "glossary", title: "Glossary", summary: "Terms." },
    { kind: "chapter", title: "" },
  ],
  unplaced: [{ what: "A duplicated list of names", where: "p. 40", why: "Repeats ch. 2" }, { where: "nothing" }],
  missing: ["The course schedule the contents promise"],
});

const m: Manuscript = { title: "Demonology I", sections: [{ id: "a", kind: "chapter", title: "Old one", body: "The author's text.", versions: [{ id: "v", at: "x", kind: "snapshot", title: "Old one", body: "older" }] }], history: [], rules: "Yahusha instead of Jesus", meta: { isbn: "123" }, libraryId: "lib-1" };
const brief = { bookType: "course" as const, instructions: "A university course", approach: "mine" as const };

describe("rebuild as a professional book", () => {
  it("uses the same standard and book types on Claude Code and on the API", () => {
    expect(DESIGN_RULES).toEqual(r.DESIGN_RULES);
    expect(BOOK_TYPES).toEqual(r.BOOK_TYPES);
    expect(designBrief(brief)).toBe(r.designBrief(brief));
  });

  it("reads Claude's design: unknown kinds become chapters, untitled sections and empty notes are dropped", () => {
    const d = parseDesign("```json\n" + DESIGN + "\n```");
    expect(d.sections.map((s) => s.kind)).toEqual(["introduction", "part", "chapter", "chapter", "glossary"]);
    expect(d.unplaced).toEqual([{ what: "A duplicated list of names", where: "p. 40", why: "Repeats ch. 2" }]);
    expect(d.missing).toEqual(["The course schedule the contents promise"]);
    expect(() => parseDesign("no json")).toThrow(/wasn't valid/);
    expect(() => parseDesign(JSON.stringify({ sections: [{ kind: "introduction", title: "Intro" }] }))).toThrow(/no chapters/);
  });

  it("lays the manuscript out to the design, keeping the book's details and the replaced manuscript", () => {
    const d = parseDesign(DESIGN);
    const next = designToManuscript(d, m, brief, "2026-10-27T10:00:00Z");
    expect(next.sections.map((s) => s.title)).toEqual(["Introduction", "Part One: Foundations", "The reality of the unseen", "Kinds of spirits", "Glossary"]);
    expect(next.sections.every((s) => s.body === "")).toBe(true);
    expect(next.sections[2].idea).toContain("Draws on: Introduction; ch. 3");
    expect(next.sections[2].idea).toContain("Includes: Learning outcomes");
    expect(next).toMatchObject({ rules: m.rules, meta: m.meta, libraryId: "lib-1", design: { ...brief, at: "2026-10-27T10:00:00Z" } });
    expect(next.archive).toEqual([{ at: "2026-10-27T10:00:00Z", label: "Before the rebuild", sections: [{ id: "a", kind: "chapter", title: "Old one", body: "The author's text." }] }]);
    // Chapters are written first; the introduction and glossary summarise them. A part divider with no plan is only its title.
    const ids = sectionsToWrite(next).map((id) => next.sections.find((s) => s.id === id)!.title);
    expect(ids).toEqual(["The reality of the unseen", "Kinds of spirits", "Introduction", "Glossary"]);
  });

  it("restores the earlier manuscript and keeps the rebuilt one, so nothing is lost", () => {
    const next = designToManuscript(parseDesign(DESIGN), m, brief, "t1");
    const back = restoreArchived(next, 0, "t2");
    expect(back.sections).toEqual([{ id: "a", kind: "chapter", title: "Old one", body: "The author's text." }]);
    expect(back.design).toBeUndefined();
    expect(back.archive).toHaveLength(1);
    expect(back.archive![0].sections).toHaveLength(5);
    expect(sectionsToWrite(back)).toEqual([]);
  });

  it("gives every designed section the book's design on both engines", () => {
    const next = designToManuscript(parseDesign(DESIGN), m, brief);
    const ctx = sectionContext(next, next.sections[2]);
    expect(ctx).toContain("rebuilt as a professional book");
    expect(ctx).toContain("Course textbook");
    expect(ctx).toContain("A university course");
    expect(ctx).toContain("Draws on: Introduction; ch. 3");
    const run = r.buildRun("tool", { tool: "book-design", ...brief, _hasManuscript: true, _book: { rules: "Yahusha instead of Jesus" } });
    expect(run.output).toBe("book-design.json");
    expect(run.prompt).toContain("not a copy of the manuscript's order");
    expect(run.prompt).toContain("./manuscript/");
    expect(run.prompt).toContain("Yahusha instead of Jesus");
    expect(run.prompt).toContain(DESIGN_RULES[1]);
  });

  it("makes a whole-book result the book's manuscript, keeping the earlier one to restore", () => {
    const designed = designToManuscript(parseDesign(DESIGN), m, brief, "t1");
    const next = resultToManuscript("# Demonology I\n\n## Introduction\n\nOpening.\n\n## The reality of the unseen\n\nThe rewritten chapter.", designed, "Rewritten book", "t2");
    expect(next.sections.map((s) => [s.kind, s.title, s.body])).toEqual([["introduction", "Introduction", "Opening."], ["chapter", "The reality of the unseen", "The rewritten chapter."]]);
    expect(next.design).toBeUndefined();
    expect(next.archive!.at(-1)).toMatchObject({ at: "t2", label: "Before “Rewritten book” became the manuscript" });
    expect(next).toMatchObject({ rules: m.rules, meta: m.meta, libraryId: "lib-1" });
    expect(() => resultToManuscript("", m, "Empty")).toThrow(/no sections/);
  });
});
