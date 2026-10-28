import { describe, expect, it } from "vitest";
import { openingIndex } from "./BookPageView";
import { titleFromFileName, type Manuscript } from "@/lib/manuscript";

describe("the book page", () => {
  it("finds a section among the openings the typesetter makes, front matter first and the title page aside", () => {
    const m = { title: "B", history: [], sections: [
      { id: "c1", kind: "chapter", title: "One", body: "x" },
      { id: "tp", kind: "title-page", title: "Title", body: "" },
      { id: "in", kind: "introduction", title: "Introduction", body: "x" },
      { id: "gl", kind: "glossary", title: "Glossary", body: "x" },
    ] } as Manuscript;
    expect(["in", "c1", "gl", "tp"].map((id) => openingIndex(m, m.sections.find((s) => s.id === id)!))).toEqual([0, 1, 2, -1]);
  });
  it("names a book from its file without underscores", () => {
    expect(titleFromFileName("The_Oneness_of_Yahuah_Complete_Manuscript.pdf")).toBe("The Oneness of Yahuah Complete Manuscript");
    expect(titleFromFileName("Demonology - The Battle of Angels.docx")).toBe("Demonology - The Battle of Angels");
  });
});
