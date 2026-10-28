import { describe, expect, it } from "vitest";
import { applyOrganise, manuscriptText, organisePrompt, organisedToManuscript, parseOrganise } from "./organise";
import * as runner from "../../../../services/polished-claude-runner/src/prompts.mjs";

const BOOK = `THE ONENESS OF GOD
© 2014 The Author

PREFACE
This book was written for the church.

CHAPTER 1
THE ONE GOD
Hear, O Israel: the LORD our God is one LORD (Deuteronomy 6:4). The whole of scripture
teaches that there is one God.

Monotheism in the Old Testament
The prophets repeat it again and again, and no other god is beside him.

CHAPTER 2
The name of Jesus
Chapter 4 affirmed that Jesus is God. In this chapter we look at the name itself and its meaning
for the believer today.`;

const PLAN = JSON.stringify({ sections: [
  { kind: "title-page", title: "The Oneness of God", starts: "THE ONENESS OF GOD © 2014 The Author", headings: [] },
  { kind: "preface", title: "Preface", starts: "PREFACE This book was written for the church.", headings: [] },
  { kind: "chapter", title: "The One God", starts: "CHAPTER 1 THE ONE GOD Hear, O Israel", headings: [{ title: "Monotheism in the Old Testament", starts: "Monotheism in the Old Testament The prophets repeat it" }] },
  { kind: "chapter", title: "The Name of Jesus", starts: "CHAPTER 2 The name of Jesus Chapter 4 affirmed", headings: [] },
  { kind: "chapter", title: "A chapter Claude imagined", starts: "This sentence is not in the book at all.", headings: [] },
], notes: "Chapter 3 seems missing." });

describe("organise into chapters and sections", () => {
  it("asks Claude the same on Claude Code and on the API", () => {
    const r = runner as unknown as { organisePrompt: (o: object, w: string) => string; buildRun: (a: string, o: object) => { prompt: string; output: string } };
    expect(organisePrompt({ titles: "improve", instructions: "x" }, "the book")).toBe(r.organisePrompt({ titles: "improve", instructions: "x" }, "the book"));
    expect(r.buildRun("tool", { tool: "organise", text: BOOK }).output).toBe("organise.json");
  });

  it("splits the book where Claude's plan says, without changing a word, and reports what it couldn't place", () => {
    const o = applyOrganise(BOOK, parseOrganise(PLAN));
    expect(o.sections.map((s) => [s.kind, s.title])).toEqual([["title-page", "The Oneness of God"], ["preface", "Preface"], ["chapter", "The One God"], ["chapter", "The Name of Jesus"]]);
    expect(o.sections[2].body).toContain("Hear, O Israel: the LORD our God is one LORD (Deuteronomy 6:4).");
    expect(o.sections[2].body).toContain("### Monotheism in the Old Testament\n\nThe prophets repeat it");
    expect(o.sections[2].body.startsWith("THE ONE GOD")).toBe(false);
    expect(o.sections[3].body.startsWith("The name of Jesus")).toBe(false);
    expect(o.sections[3].body).toContain("Chapter 4 affirmed that Jesus is God.");
    expect(o.missed).toEqual(["A chapter Claude imagined"]);
    expect(o.notes).toBe("Chapter 3 seems missing.");
    // Every word is kept, apart from the heading lines replaced by the new titles.
    expect(o.keptWords + o.removedHeadingWords).toBe(o.totalWords);
  });

  it("keeps the manuscript it replaces, and reads a manuscript back as text", () => {
    const m = { title: "T", history: [], sections: [{ id: "a", kind: "chapter", title: "Chapter 1", body: "All of it." }] };
    expect(manuscriptText(m)).toBe("All of it.");
    const next = organisedToManuscript(applyOrganise(BOOK, parseOrganise(PLAN)), m, "t1");
    expect(next.sections).toHaveLength(4);
    expect(next.archive?.[0]).toMatchObject({ at: "t1", label: "Before organising into chapters" });
    expect(() => parseOrganise("{}")).toThrow(/no chapters/);
  });
});
