import { describe, expect, it } from "vitest";
import { buildOutreachPlan } from "./outreach-plan.js";
import { sectorTokensFor } from "./buyer-dna.js";

const tokens = sectorTokensFor("enterprise_saas");
const plan = buildOutreachPlan(100_000_000, tokens, 20);

describe("buyer outreach plan (the banker's targeted program)", () => {
  it("targets a disciplined ~20 buyers, never a mass list", () => {
    expect(plan.totalBuyers).toBeGreaterThan(0);
    expect(plan.totalBuyers).toBeLessThanOrEqual(20);
    expect(plan.summary.length).toBeGreaterThan(0);
  });

  it("sequences into ordered waves with the highest-probability anchors first", () => {
    expect(plan.waves[0].tier).toBe(1);
    expect(plan.waves[0].label).toBe("Lead bidders");
    // wave 1's top buyer is the highest-probability buyer overall
    const allProbs = plan.waves.flatMap((w) => w.buyers.map((b) => b.probabilityPct));
    expect(plan.waves[0].buyers[0].probabilityPct).toBe(Math.max(...allProbs));
    // probabilities are non-increasing across the sequenced order
    for (let i = 1; i < allProbs.length; i++) expect(allProbs[i]).toBeLessThanOrEqual(allProbs[i - 1]);
  });

  it("every targeted buyer carries a contact path, expected value and confidence", () => {
    for (const w of plan.waves) {
      for (const b of w.buyers) {
        expect(b.contactPath.length).toBeGreaterThan(0);
        expect(b.expectedValueUsd).toBeGreaterThan(0);
        expect(["High", "Medium", "Low"]).toContain(b.confidence);
        expect(b.buyerId.length).toBeGreaterThan(0);
      }
    }
  });

  it("a tighter limit produces a tighter plan", () => {
    const small = buildOutreachPlan(100_000_000, tokens, 5);
    expect(small.totalBuyers).toBeLessThanOrEqual(5);
    expect(small.totalBuyers).toBeLessThanOrEqual(plan.totalBuyers);
  });
});
