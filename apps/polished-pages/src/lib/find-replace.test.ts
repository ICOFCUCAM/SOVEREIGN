import { describe, expect, it } from "vitest";
import { findMatches, replaceMatches } from "./find-replace";
import type { Manuscript } from "./manuscript";

const m: Manuscript = { title: "B", history: [], sections: [
  { id: "a", kind: "chapter", title: "God and Man", body: "God is one. The godly man knows it.\n\nAs it is written, “God so loved the world.”\n\n> God is a Spirit." },
  { id: "b", kind: "chapter", title: "Two", body: "Nothing here." },
] };

describe("find and replace", () => {
  it("finds whole words, marks matches inside quotations, and searches titles when asked", () => {
    const found = findMatches(m, "God", { wholeWord: true });
    expect(found.map((f) => f.quoted)).toEqual([false, true, true]);
    expect(findMatches(m, "god").length).toBe(4);
    expect(findMatches(m, "God", { wholeWord: true, titles: true }).filter((f) => f.field === "title").length).toBe(1);
  });
  it("replaces only the chosen matches and keeps the text before as a version", () => {
    const found = findMatches(m, "God", { wholeWord: true, titles: true });
    const next = replaceMatches(m, found.filter((f) => !f.quoted), "Yahuah");
    const a = next.sections[0];
    expect(a.title).toBe("Yahuah and Man");
    expect(a.body).toMatch(/^Yahuah is one\. The godly man/);
    expect(a.body).toContain("“God so loved the world.”");
    expect(a.versions?.at(-1)).toMatchObject({ label: "Before find and replace", title: "God and Man" });
    expect(next.sections[1]).toBe(m.sections[1]);
  });
});
