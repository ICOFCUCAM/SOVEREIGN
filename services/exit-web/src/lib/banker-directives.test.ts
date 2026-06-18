import { describe, it, expect } from "vitest";
import type { BuyerCandidate } from "@exit/engines";
import {
  parseDirective, mergePreferences, applyToBuyers, outreachPosture, valuationGuardrail,
  type BankerDirective,
} from "./banker-directives";

const dir = (raw: string): BankerDirective => {
  const p = parseDirective(raw);
  return { id: raw, raw, createdAt: "", source: "deterministic", effects: p.effects, preferences: p.preferences, understood: p.understood };
};

const buyer = (name: string, buyerType: string, opts: Partial<{ sectorsActive: string[]; thesis: string; probability: number; checkHigh: number }> = {}): BuyerCandidate => ({
  buyer: { name, buyerType, sectorsActive: opts.sectorsActive ?? [], thesis: opts.thesis ?? "" },
  probability: opts.probability ?? 0.5,
  estimatedCheck: { low: 0, high: opts.checkHigh ?? 500_000_000, currency: "USD" },
} as unknown as BuyerCandidate);

describe("banker directive parser", () => {
  it("boosts the named buyer type when prioritized", () => {
    const p = parseDirective("Prioritize strategic buyers");
    expect(p.understood).toBe(true);
    expect((p.preferences.buyerTypeWeights ?? {}).strategic).toBeGreaterThan(1);
  });

  it("penalizes private equity when told to avoid it", () => {
    const p = parseDirective("Avoid private equity");
    expect(p.understood).toBe(true);
    expect((p.preferences.buyerTypeWeights ?? {}).pe).toBeLessThan(1);
  });

  it("excludes a type on an explicit exclude", () => {
    const p = parseDirective("Exclude private equity entirely");
    expect(p.preferences.excludedBuyerTypes).toContain("pe");
  });

  it("captures a sector focus", () => {
    const p = parseDirective("Target logistics consolidators");
    expect(p.preferences.sectorFocusTokens).toContain("logistics");
  });

  it("parses a valuation floor", () => {
    const p = parseDirective("Minimum valuation $100M");
    expect(p.preferences.minValuationUsd).toBe(100_000_000);
  });

  it("parses an outreach hold with the timeframe", () => {
    const p = parseDirective("Avoid outreach before Q4");
    expect(p.preferences.outreachHold?.label).toMatch(/q4/i);
  });

  it("marks an unparseable note as not understood", () => {
    const p = parseDirective("hello there");
    expect(p.understood).toBe(false);
    expect(p.effects).toHaveLength(0);
  });
});

describe("preference application", () => {
  it("ranks a boosted type above a neutral one", () => {
    const prefs = mergePreferences([dir("prioritize strategic buyers")]);
    const { included } = applyToBuyers([buyer("PE One", "pe"), buyer("Strat One", "strategic")], prefs);
    expect(included[0].candidate.buyer.name).toBe("Strat One");
    expect(included[0].adjustedProbability).toBeGreaterThan(included[0].baseProbability);
  });

  it("removes excluded types from the active set", () => {
    const prefs = mergePreferences([dir("exclude private equity")]);
    const { included, excluded } = applyToBuyers([buyer("PE One", "pe"), buyer("Strat One", "strategic")], prefs);
    expect(included.map((r) => r.candidate.buyer.name)).toEqual(["Strat One"]);
    expect(excluded.map((r) => r.candidate.buyer.name)).toEqual(["PE One"]);
  });

  it("deprioritizes buyers below a valuation floor", () => {
    const prefs = mergePreferences([dir("minimum valuation $100M")]);
    const { included } = applyToBuyers([buyer("Small", "strategic", { checkHigh: 50_000_000 }), buyer("Big", "strategic", { checkHigh: 1_000_000_000 })], prefs);
    expect(included[0].candidate.buyer.name).toBe("Big");
  });

  it("surfaces outreach hold and valuation guardrail from merged prefs", () => {
    const prefs = mergePreferences([dir("hold outreach until Q4"), dir("minimum valuation $100M")]);
    expect(outreachPosture(prefs).held).toBe(true);
    expect(valuationGuardrail(prefs).floor).toBe(100_000_000);
  });
});
