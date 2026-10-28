import { describe, expect, it } from "vitest";
import { applyFormat, styleAt } from "./markdown-format";

describe("the Writing toolbar", () => {
  const t = "Yahuah is eternal.\nHe had no beginning.\n\nMelchizedek";
  it("makes the selected words bold and italic, and takes it off again", () => {
    const b = applyFormat(t, 10, 17, "bold");
    expect(b.text.startsWith("Yahuah is **eternal**.")).toBe(true);
    expect(applyFormat(b.text, b.start, b.end, "bold").text).toBe(t);
    expect(applyFormat(t, 0, 6, "italic").text.startsWith("*Yahuah* is")).toBe(true);
  });
  it("sets headings, quotations and lists on the selected lines, and back to a paragraph", () => {
    const h = applyFormat(t, 45, 45, "subheading");
    expect(h.text.endsWith("### Melchizedek")).toBe(true);
    expect(styleAt(h.text, h.text.length - 2)).toBe("subheading");
    expect(applyFormat(h.text, h.text.length - 2, h.text.length - 2, "paragraph").text).toBe(t);
    const q = applyFormat(t, 0, 30, "quote");
    expect(q.text.split("\n").slice(0, 2)).toEqual(["> Yahuah is eternal.", "> He had no beginning."]);
    expect(applyFormat(t, 0, 30, "numbers").text.split("\n").slice(0, 2)).toEqual(["1. Yahuah is eternal.", "2. He had no beginning."]);
  });
  it("makes a link of the selection", () => {
    expect(applyFormat(t, 0, 6, "link", "https://example.org").text.startsWith("[Yahuah](https://example.org) is")).toBe(true);
  });
});
