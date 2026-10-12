import { describe, it, expect } from "vitest";
import { GLOSSARY, searchGlossary } from "./glossary.js";

describe("glossary", () => {
  it("lists each term once, alphabetically", () => {
    const names = GLOSSARY.map((t) => t.term);
    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });

  it("finds a term by its long name", () => {
    expect(searchGlossary("letter of intent").map((t) => t.term)).toEqual(["LOI"]);
  });

  it("returns everything for an empty search", () => {
    expect(searchGlossary("  ")).toBe(GLOSSARY);
  });
});
