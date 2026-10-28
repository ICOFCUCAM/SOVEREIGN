import { describe, expect, it } from "vitest";
import { parseResearch, researchPrompt, searchSources } from "./research";

describe("research this section", () => {
  it("keeps only well-formed results and drops a scholar link that isn't one", () => {
    const r = parseResearch('```json\n{"scripture":[{"ref":"Genesis 16:7-13","note":"The angel speaks to Hagar","translation":"KJV"},{"note":"no ref"}],"topics":[{"title":"Theophanies","line":"Appearances"}],"scholars":[{"name":"Dyrness","work":"Themes in OT Theology","line":"1979","url":"javascript:alert(1)"}]}\n```');
    expect(r.scripture.map((s) => s.ref)).toEqual(["Genesis 16:7-13"]);
    expect(r.topics).toHaveLength(1);
    expect(r.scholars[0].url).toBeUndefined();
    expect(researchPrompt("angel of the LORD", "scripture", "./x.md")).toMatch(/never invent/);
  });
  it("finds the words in my sources with context", () => {
    const hits = searchSources([{ name: "book.pdf", text: "Before. The angel of the LORD appeared to Moses in a flame. After." }], "angel of the lord");
    expect(hits).toEqual([{ name: "book.pdf", excerpt: "…Before. The angel of the LORD appeared to Moses in a flame. After.…" }]);
  });
});
