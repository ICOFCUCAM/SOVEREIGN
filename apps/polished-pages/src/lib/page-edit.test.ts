import { describe, expect, it } from "vitest";
import { findParagraph } from "./page-edit";
import type { Manuscript } from "./manuscript";

describe("edit on the book page", () => {
  it("finds the paragraph a set page shows, through its marks", () => {
    const m = { title: "B", history: [], sections: [{ id: "a", kind: "chapter", title: "One", body: "First paragraph here.\n\nYahuah is **eternal**, immortal and everlasting[^1] (Deuteronomy 33:27).\n\n[^1]: Note." }] } as Manuscript;
    const f = findParagraph(m, "Yahuah is eternal, immortal and everlasting¹ (Deuteronomy 33:27).");
    expect(f).toMatchObject({ sectionId: "a", raw: "Yahuah is **eternal**, immortal and everlasting[^1] (Deuteronomy 33:27)." });
    expect(m.sections[0].body.slice(f!.start, f!.end)).toBe(f!.raw);
    expect(findParagraph(m, "Nothing like this anywhere.")).toBeNull();
  });
});
