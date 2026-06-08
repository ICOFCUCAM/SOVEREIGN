import { describe, it, expect } from "vitest";
import { commanderMetrics } from "./commander-metrics";

describe("commanderMetrics", () => {
  const m = commanderMetrics();

  it("exit probability and confidence stay within range", () => {
    expect(m.exitProbability).toBeGreaterThanOrEqual(0);
    expect(m.exitProbability).toBeLessThanOrEqual(100);
    expect(m.confidencePct).toBeGreaterThanOrEqual(0);
    expect(m.confidencePct).toBeLessThanOrEqual(92);
  });

  it("dollar figures are finite and non-negative", () => {
    for (const v of [m.companyValue, m.potential, m.expectedIncreaseUsd]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it("readiness score is within 0..100 and a recommended action is present", () => {
    expect(m.readinessScore).toBeGreaterThanOrEqual(0);
    expect(m.readinessScore).toBeLessThanOrEqual(100);
    expect(m.recommendedAction.length).toBeGreaterThan(0);
  });
});
