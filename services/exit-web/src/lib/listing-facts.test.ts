import { describe, it, expect } from "vitest";
import { missingFacts, missingIn, missingTagged, PROFILE_SECTIONS, normalizeFacts, askingText, splitList, type ListingFacts } from "./listing-facts";
import { normalizeListing } from "./listings";
import { SOVEREIGN_PRODUCTS } from "./sovereign-intel";

const FULL: ListingFacts = {
  summary: "A marketplace that connects households with vetted movers, handling quotes, booking and payment for every job in one place.",
  stage: "revenue", forSale: ["source_code_ip", "brand_domain"], models: ["commission"], builtWith: ["React", "PostgreSQL"],
  basedIn: "Norway", region: "Europe", markets: ["Norway"], askingMode: "range", askingLowUsd: 2e6, askingHighUsd: 3e6,
};

describe("listing facts", () => {
  it("a complete set is ready to list", () => expect(missingFacts(FULL)).toEqual([]));
  it("each gap belongs to exactly one profile page, and the pages together cover them all", () => {
    const empty = {};
    expect(PROFILE_SECTIONS.flatMap((x) => missingIn(x, empty))).toEqual(expect.arrayContaining(missingFacts(empty)));
    expect(PROFILE_SECTIONS.reduce((n, x) => n + missingIn(x, empty).length, 0)).toBe(missingTagged(empty).length);
    expect(missingIn("overview", { ...FULL, stage: undefined })).toEqual(["The stage"]);
    expect(missingIn("financial", { ...FULL, askingMode: undefined })).toEqual(["The asking price"]);
    expect(missingIn("transaction", { ...FULL, basedIn: "" })).toEqual(["Where it is based"]);
    for (const x of PROFILE_SECTIONS) expect(missingIn(x, FULL)).toEqual([]);
  });
  it("names everything still needed", () => {
    const m = missingFacts({ summary: "too short" });
    expect(m).toEqual(expect.arrayContaining(["The stage", "What is for sale", "How it makes money", "Where it is based", "The asking price"]));
  });
  it("a range needs low below high, a price needs a price", () => {
    expect(missingFacts({ ...FULL, askingHighUsd: 1e6 })).toContain("A price range (low below high)");
    expect(missingFacts({ ...FULL, askingMode: "price", askingLowUsd: undefined })).toContain("The price");
    expect(missingFacts({ ...FULL, askingMode: "on_request" })).toEqual([]);
  });
  it("reads the asking price as a buyer sees it", () => {
    expect(askingText(FULL)).toBe("$2M–$3M");
    expect(askingText({ askingMode: "price", askingLowUsd: 5.9e6 })).toBe("$5.9M");
    expect(askingText({ askingMode: "offers" })).toBe("Open to offers");
  });
  it("cleans stored facts: unknown values dropped, lists bounded", () => {
    const f = normalizeFacts({ ...FULL, stage: "unicorn", forSale: ["source_code_ip", "everything"], builtWith: Array(30).fill("x").map((x, i) => x + i), askingHighUsd: -5 })!;
    expect(f.stage).toBeUndefined();
    expect(f.forSale).toEqual(["source_code_ip"]);
    expect(f.builtWith.length).toBe(12);
    expect(f.askingHighUsd).toBeUndefined();
    expect(normalizeFacts({ stage: "live" })).toBeUndefined(); // no description, no facts
  });
  it("splits typed lists", () => expect(splitList("React, Node.js,\nReact , ")).toEqual(["React", "Node.js"]));
  it("survives a round trip through stored listings", () => {
    const l = normalizeListing({ id: "lst-x", code: "Project X", listedAt: "2026-10-14", facts: FULL, publicView: { sector: "Software", region: "Europe" } });
    expect(l.facts).toEqual(FULL);
  });
  it("every catalog listing carries facts with a description and a market", () => {
    for (const p of SOVEREIGN_PRODUCTS) {
      expect(p.facts?.summary.length, p.id).toBeGreaterThan(20);
      expect(p.facts?.markets.length, p.id).toBeGreaterThan(0);
      expect(p.facts?.models.length, p.id).toBeGreaterThan(0);
    }
    expect(new Set(SOVEREIGN_PRODUCTS.map((p) => p.id)).size).toBe(SOVEREIGN_PRODUCTS.length);
    expect(SOVEREIGN_PRODUCTS.find((p) => p.id === "osint")?.category).toBe("Strategic Intelligence");
    expect(SOVEREIGN_PRODUCTS.find((p) => p.id === "norway-relocation")?.facts).toMatchObject({ basedIn: "Norway", region: "Europe", askingLowUsd: 5.9e6 });
  });
});
