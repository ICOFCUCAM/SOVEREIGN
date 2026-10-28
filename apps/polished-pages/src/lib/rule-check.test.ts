import { describe, expect, it } from "vitest";
import { fixHits, parseRules, ruleHits } from "./rule-check";

describe("the live rule checker", () => {
  it("reads the book's naming rules", () => {
    expect(parseRules("Write Yahusha instead of Jesus\nWrite Yahuah instead of God (never Jehovah or Yahweh)\nMessiah → Mashiach\nUse church, not assembly.")).toEqual([
      { wrong: "Jesus", right: "Yahusha" }, { wrong: "God", right: "Yahuah" }, { wrong: "Jehovah", right: "Yahuah" }, { wrong: "Yahweh", right: "Yahuah" },
      { wrong: "Messiah", right: "Mashiach" }, { wrong: "assembly", right: "church" },
    ]);
  });
  it("finds words that break them outside quotations, and fixes only those", () => {
    const rules = parseRules("Write Yahuah instead of God (never Jehovah or Yahweh)");
    const text = "God is one, and the godly know Jehovah.\n\nAs it is written, “God so loved the world.”";
    const hits = ruleHits(text, rules);
    expect(hits.map((h) => [h.rule.wrong, h.matches.length])).toEqual([["God", 1], ["Jehovah", 1]]);
    expect(fixHits(text, hits)).toBe("Yahuah is one, and the godly know Yahuah.\n\nAs it is written, “God so loved the world.”");
  });
});
