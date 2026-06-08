import { describe, it, expect } from "vitest";
import {
  EXIT_SCORE, READINESS_CATEGORIES, VALUE_LEFT_USD,
  CURRENT_VALUE_USD, POTENTIAL_VALUE_USD, DEAL_BUYERS, ACTIVE_BUYERS, STRATEGIC_ACTIVE,
} from "./deal-context";

describe("deal-context", () => {
  it("Exit Score reconciles with the category breakdown (weighted average)", () => {
    const w = READINESS_CATEGORIES.reduce((s, c) => s + c.weight, 0);
    const avg = Math.round(READINESS_CATEGORIES.reduce((s, c) => s + c.score * c.weight, 0) / w);
    expect(EXIT_SCORE).toBe(avg);
  });

  it("Exit Score is within 0..100", () => {
    expect(EXIT_SCORE).toBeGreaterThanOrEqual(0);
    expect(EXIT_SCORE).toBeLessThanOrEqual(100);
  });

  it("value-left is non-negative and equals potential minus current", () => {
    expect(VALUE_LEFT_USD).toBeGreaterThanOrEqual(0);
    expect(VALUE_LEFT_USD).toBe(Math.max(0, POTENTIAL_VALUE_USD - CURRENT_VALUE_USD));
  });

  it("there is one non-empty buyer pool with bounded active counts", () => {
    expect(DEAL_BUYERS.length).toBeGreaterThan(0);
    expect(ACTIVE_BUYERS).toBeGreaterThanOrEqual(0);
    expect(ACTIVE_BUYERS).toBeLessThanOrEqual(DEAL_BUYERS.length);
    expect(STRATEGIC_ACTIVE).toBeLessThanOrEqual(ACTIVE_BUYERS);
  });

  it("buyer economics anchor to the implied price — no inflated headlines", () => {
    // expected headline should sit within a sane band of the strategic mid,
    // not the engine's raw ARR-derived multiple (the bug this guards against).
    for (const c of DEAL_BUYERS) {
      expect(Number.isFinite(c.expectedOutcome.expectedHeadlineUsd)).toBe(true);
      expect(c.expectedOutcome.expectedHeadlineUsd).toBeLessThanOrEqual(POTENTIAL_VALUE_USD * 4);
    }
  });
});
