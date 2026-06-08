import { describe, it, expect } from "vitest";
import { discoverFindings, buildBuyerReport, buildSellerReport, allReports } from "./diligence-intel";

const findings = discoverFindings();

describe("discoverFindings", () => {
  it("surfaces findings across Financial, Legal and Operational", () => {
    const cats = new Set(findings.map((f) => f.category));
    expect(cats.has("Financial")).toBe(true);
    expect(cats.has("Legal")).toBe(true);
    expect(cats.has("Operational")).toBe(true);
  });

  it("every finding has a valid severity and a finite, non-negative impact", () => {
    for (const f of findings) {
      expect(["high", "medium", "low"]).toContain(f.severity);
      expect(Number.isFinite(f.impactUsd)).toBe(true);
      expect(f.impactUsd).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("reports", () => {
  it("buyer + seller reports tally severities to the finding count", () => {
    for (const r of [buildBuyerReport(findings), buildSellerReport(findings)]) {
      const total = r.bySeverity.high + r.bySeverity.medium + r.bySeverity.low;
      expect(total).toBe(findings.length);
      expect(r.totalImpactUsd).toBeGreaterThanOrEqual(0);
    }
  });

  it("allReports returns the six named reports, well-formed", () => {
    const r = allReports(findings);
    expect(r.map((x) => x.key)).toEqual(["buyer", "seller", "readiness", "redflag", "valuation", "legal"]);
    for (const rep of r) {
      expect(rep.title.length).toBeGreaterThan(0);
      expect(rep.headline.length).toBeGreaterThan(0);
      expect(rep.recommendation.length).toBeGreaterThan(0);
      expect(["buyer", "seller"]).toContain(rep.accent);
    }
  });
});
