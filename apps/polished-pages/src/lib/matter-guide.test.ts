import { describe, expect, it } from "vitest";
import * as runner from "../../../../services/polished-claude-runner/src/prompts.mjs";
import { MATTER_STEPS, matterProgress, matterPrompt, setIncluded, setPage, stepStatus } from "./matter-guide";
import type { Manuscript } from "./manuscript";

describe("front and back matter, page by page", () => {
  it("asks the same question on Claude Code and the API, and never lets Claude add a fact", () => {
    const o = { kind: "preface", label: "Preface", notes: "why i wrote it", title: "The Oneness of Yahuah", subtitle: "S", author: "A", rules: "Yahusha, not Jesus", guidance: "The author's note.", fromBook: true };
    const where = { notes: "./matter/notes.md", book: "./matter/book.md" };
    expect(matterPrompt(o, where)).toBe(runner.matterPrompt(o, where));
    expect(matterPrompt(o, where)).toMatch(/Add no facts of your own/);
    expect(matterPrompt(o, where)).toMatch(/Yahusha, not Jesus/);
  });
  it("goes through the pages in the order a book prints them, front then back", () => {
    const k = MATTER_STEPS.map((s) => s.kind);
    expect(k.slice(0, 3)).toEqual(["half-title", "title-page", "copyright"]);
    expect(k.indexOf("dedication")).toBeLessThan(k.indexOf("preface"));
    expect(k.indexOf("contents")).toBeLessThan(k.indexOf("introduction"));
    expect(k.indexOf("introduction")).toBeLessThan(k.indexOf("conclusion"));
    expect(k.indexOf("glossary")).toBeLessThan(k.indexOf("about-author"));
  });
  it("shows a page the manuscript already has as done, one turned off as off", () => {
    const m: Manuscript = { title: "B", author: "A", history: [], sections: [{ id: "1", kind: "introduction", title: "Introduction", body: "Text." }, { id: "2", kind: "dedication", title: "Dedication", body: "To Ann.", omit: true }] };
    const st = (kind: string) => stepStatus(m, MATTER_STEPS.find((s) => s.kind === kind)!);
    expect([st("introduction"), st("dedication"), st("preface"), st("contents")]).toEqual(["done", "off", "to-do", "done"]);
  });
});

describe("setting the pages", () => {
  const m0: Manuscript = { title: "B", author: "A", history: [], sections: [{ id: "p", kind: "preface", title: "Preface", body: "My first words." }, { id: "c", kind: "chapter", title: "One", body: "Text." }] };
  it("adds a missing page in its place and keeps a page's earlier text as a version", () => {
    let m = setPage(m0, "dedication", "To Ann.");
    expect(m.sections.map((s) => s.kind)).toEqual(["dedication", "preface", "chapter"]);
    m = setPage(m, "preface", "Why I wrote this book.");
    const p = m.sections.find((s) => s.kind === "preface")!;
    expect(p.body).toBe("Why I wrote this book.");
    expect(p.versions?.at(-1)?.body).toBe("My first words.");
  });
  it("leaves a page out without losing its text, and counts what is still to do", () => {
    const m = setIncluded(m0, "preface", false);
    expect(m.sections.find((s) => s.kind === "preface")).toMatchObject({ omit: true, body: "My first words." });
    expect(setIncluded(m, "preface", true).sections.find((s) => s.kind === "preface")?.omit).toBe(false);
    const p = matterProgress(m0);
    expect(p.total).toBeGreaterThan(p.done);
  });
});
