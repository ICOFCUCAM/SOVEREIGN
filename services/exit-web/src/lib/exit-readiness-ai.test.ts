import { describe, it, expect } from "vitest";
import { exitReadinessCategories } from "./exit-readiness-ai";

describe("exitReadinessCategories", () => {
  const valueLeft = 58_000_000;
  const cats = exitReadinessCategories(valueLeft);

  it("returns the ten buyer-underwritten categories", () => {
    expect(cats.length).toBe(10);
  });

  it("every score is finite and within 0..100", () => {
    for (const c of cats) {
      expect(Number.isFinite(c.score)).toBe(true);
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
    }
  });

  it("every priced impact is finite and non-negative", () => {
    for (const c of cats) {
      expect(Number.isFinite(c.impactUsd)).toBe(true);
      expect(c.impactUsd).toBeGreaterThanOrEqual(0);
    }
  });

  it("impacts sum to the value-left-on-the-table (within 100k rounding per category)", () => {
    const sum = cats.reduce((s, c) => s + c.impactUsd, 0);
    expect(Math.abs(sum - valueLeft)).toBeLessThanOrEqual(cats.length * 100_000);
  });

  it("categories already at or above target carry no fix impact", () => {
    for (const c of cats) if (c.score >= 85) expect(c.impactUsd).toBe(0);
  });

  it("weights sum to ~1", () => {
    const w = cats.reduce((s, c) => s + c.weight, 0);
    expect(Math.abs(w - 1)).toBeLessThan(1e-9);
  });

  it("zero value-left produces zero impacts (no fabricated dollars)", () => {
    for (const c of exitReadinessCategories(0)) expect(c.impactUsd).toBe(0);
  });
});
