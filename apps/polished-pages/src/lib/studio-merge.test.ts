import { describe, expect, it } from "vitest";
import { outlineToManuscript, readWizardDraft, wizardDraftToManuscript } from "./studio-merge";
import type { Manuscript } from "./manuscript";
import type { BookOutline } from "@/types/book";

const outline = (titles: string[]): BookOutline => ({
  title: "Demonology", subtitle: "A study", description: "", targetAudience: "", positioning: "", keywords: [], categories: [],
  coverDirection: { style: "", colors: "", typography: "" }, frontMatter: "", backMatter: "",
  chapters: titles.map((t) => ({ title: t, summary: `About ${t}`, keyPoints: ["one"], hook: "" })),
});

describe("outlineToManuscript", () => {
  it("adds chapters in the outline's order with their plan, keeping front and back matter and written text", () => {
    const base: Manuscript = { title: "", history: [], sections: [
      { id: "p", kind: "preface", title: "Preface", body: "Hello." },
      { id: "c", kind: "chapter", title: "Chapter 2: Spirits", body: "Written already." },
      { id: "b", kind: "bibliography", title: "Bibliography", body: "" },
    ] };
    const m = outlineToManuscript(outline(["Origins", "Spirits"]), base);
    expect(m.title).toBe("Demonology");
    expect(m.sections.map((s) => s.title)).toEqual(["Preface", "Origins", "Chapter 2: Spirits", "Bibliography"]);
    expect(m.sections[2]).toMatchObject({ id: "c", body: "Written already.", idea: "About Spirits\nKey points: one" });
    expect(m.sections[1].idea).toMatch(/^About Origins/);
  });
});

describe("Book wizard drafts", () => {
  it("brings chapters, written text, notes, knowledge and production details into the manuscript", () => {
    const m = wizardDraftToManuscript({
      bookTitle: "Demonology", knowledge: { rules: "Use the KJV.", terminology: "", forbidden: "" }, meta: { isbn: "978", author: "T" },
      chapters: [
        { id: "1", title: "Defining the Subject", summary: "Terms", notes: "Keep it short", keyPoints: [], hook: "", status: "complete", content: "## Defining the Subject\n\nThe text." },
        { id: "2", title: "Spirits", summary: "", notes: "", keyPoints: [], hook: "", status: "pending" },
      ],
    });
    expect(m.sections.map((s) => [s.title, s.body])).toEqual([["Defining the Subject", "The text."], ["Spirits", ""]]);
    expect(m.sections[0].idea).toBe("Terms\nMy notes: Keep it short");
    expect([m.knowledge?.rules, m.meta?.isbn, m.author]).toEqual(["Use the KJV.", "978", "T"]);
  });
  it("reads a project's wizard draft from this browser", () => {
    localStorage.setItem("pp:draft:studio.book.t1", JSON.stringify({ data: { chapters: [{ title: "One" }] }, docId: null }));
    expect(readWizardDraft("t1")?.chapters?.[0].title).toBe("One");
    expect(readWizardDraft("none")).toBeNull();
  });
});
