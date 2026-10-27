// @vitest-environment node
import { describe, expect, it } from "vitest";
import { countChanges, diffText } from "./word-diff";

const flat = (blocks: ReturnType<typeof diffText>) => blocks.map((b) => b.parts.map((p) => (p.kind === "same" ? p.text : `${p.kind === "add" ? "+" : "-"}[${p.text.trim()}]`)).join(""));

describe("diffText", () => {
  it("marks word changes inside a paragraph", () => {
    const d = diffText("God's people lived among nations.", "Yahuah's people lived among many nations.");
    expect(flat(d)).toEqual(["-[God's]+[Yahuah's]people lived among +[many]nations."]);
    expect(countChanges(d)).toBe(2);
  });
  it("keeps unchanged paragraphs whole and shows added and removed ones", () => {
    const d = diffText("One.\n\nTwo.\n\nThree.", "One.\n\nThree.\n\nFour.");
    expect(flat(d)).toEqual(["One.", "-[Two.]", "Three.", "+[Four.]"]);
  });
  it("joins back to the new text when removals are dropped", () => {
    const before = "In Babylon the priests wrote long incantations.\n\nThese spirits had names.";
    const after = "In Babylon, priests composed long incantations against fever.\n\nThese spirits had names and roles.";
    const text = diffText(before, after).map((b) => b.parts.filter((p) => p.kind !== "del").map((p) => p.text).join("")).join("\n\n");
    expect(text).toBe(after);
  });
  it("stays fast on a whole chapter", () => {
    const para = (i: number) => `Paragraph ${i} ${"word ".repeat(120)}end.`;
    const before = Array.from({ length: 60 }, (_, i) => para(i)).join("\n\n");
    const after = before.replace("Paragraph 30 word", "Paragraph 30 changed word");
    const t = performance.now();
    const d = diffText(before, after);
    expect(performance.now() - t).toBeLessThan(1000);
    expect(countChanges(d)).toBe(1);
  });
});
