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

describe("personalised deal context", () => {
  it("dealContextFor(demo company) reproduces the shared demo constants exactly", async () => {
    const { dealContextFor, DEMO_DEAL_CONTEXT } = await import("./deal-context");
    const { SAMPLE_COMPANY } = await import("./profile");
    const fresh = dealContextFor(SAMPLE_COMPANY);
    const strip = (c: typeof fresh) => ({ ...c, dealBuyers: c.dealBuyers.map((b) => [b.buyer.name, b.probability, b.expectedOutcome.expectedClosingUsd]) });
    expect(strip(fresh)).toEqual(strip(DEMO_DEAL_CONTEXT));
    expect(commanderMetrics(fresh)).toEqual(commanderMetrics());
  });

  it("a different company produces its own figures", async () => {
    const { dealContextFor } = await import("./deal-context");
    const { buildProfile, SAMPLE_INTAKE } = await import("./company-intake");
    const other = buildProfile({ ...SAMPLE_INTAKE, name: "Other Co", arrUsd: SAMPLE_INTAKE.arrUsd * 3, ttmRevenueUsd: SAMPLE_INTAKE.ttmRevenueUsd * 3 });
    const a = commanderMetrics(dealContextFor(other));
    expect(a.companyValue).not.toBe(commanderMetrics().companyValue);
  });
});

describe("exit probability parts", () => {
  it("the three parts add up to the index (within rounding)", async () => {
    const { exitProbabilityParts } = await import("./commander-metrics");
    const p = exitProbabilityParts();
    expect(Math.abs(p.readiness + p.demand + p.leverage - p.total)).toBeLessThanOrEqual(0.5);
    expect(p.total).toBe(commanderMetrics().exitProbability);
  });
});
