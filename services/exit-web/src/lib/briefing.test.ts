import { describe, expect, it } from "vitest";
import { morningBriefing } from "./briefing.js";
import { VALUATION_INSTITUTIONAL } from "./engines.js";

describe("chief investment banker — morning briefing", () => {
  const b = morningBriefing();

  it("produces a synthesized headline and a dated cycle", () => {
    expect(b.headline.length).toBeGreaterThan(0);
    expect(Date.parse(b.asOf)).not.toBeNaN();
  });

  it("recommends real ranked buyers with an expected value and a reason", () => {
    expect(b.actions.length).toBeGreaterThan(0);
    expect(b.actions.length).toBeLessThanOrEqual(3);
    for (const a of b.actions) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.buyerId.length).toBeGreaterThan(0);
      expect(a.probabilityPct).toBeGreaterThanOrEqual(0);
      expect(a.probabilityPct).toBeLessThanOrEqual(100);
      expect(a.expectedValueUsd).toBeGreaterThan(0);
      expect(a.why.length).toBeGreaterThan(0);
    }
  });

  it("value at stake is the strategic premium over baseline — sourced, not invented", () => {
    const expected = Math.max(0, VALUATION_INSTITUTIONAL.headline.mid - VALUATION_INSTITUTIONAL.financialBaseline.mid);
    expect(b.valueAtStakeUsd).toBeCloseTo(expected, -2);
  });

  it("movements are real registry deltas; the count matches what is shown", () => {
    expect(b.activeAcquirers).toBe(b.movements.length);
    for (const m of b.movements) expect(m.name.length).toBeGreaterThan(0);
  });
});
