import { describe, expect, it } from "vitest";
import { runInstitutionalValuation } from "@exit/engines";
import { buildProfile, SECTORS, SAMPLE_INTAKE, DEFAULT_INTAKE } from "./company-intake.js";

describe("company intake → instant institutional report", () => {
  it("builds an engine-ready profile from simple inputs", () => {
    const p = buildProfile(SAMPLE_INTAKE);
    expect(p.name.length).toBeGreaterThan(0);
    expect(p.sector).toBe(SAMPLE_INTAKE.sector);
    expect(p.revenue.trailingTwelveMonthsRevenueUsd).toBe(SAMPLE_INTAKE.ttmRevenueUsd);
    // required nested fields are all present
    expect(p.market.addressableMarketUsd).toBeGreaterThan(0);
    expect(p.team.headcount).toBeGreaterThan(0);
    expect(p.cap.fullyDilutedShares).toBeGreaterThan(0);
  });

  it("the valuation constitution runs on ANY sector's intake and stays internally consistent", () => {
    for (const sector of SECTORS) {
      const r = runInstitutionalValuation(buildProfile({ ...DEFAULT_INTAKE, sector }));
      expect(r.headline.low, sector).toBeLessThanOrEqual(r.headline.mid);
      expect(r.headline.mid, sector).toBeLessThanOrEqual(r.headline.high);
      expect(r.confidence.score, sector).toBeGreaterThanOrEqual(0);
      expect(r.confidence.score, sector).toBeLessThanOrEqual(100);
      // the explained-conclusion invariant holds for every sector
      const expectedMid = r.financialBaseline.mid * (1 + r.premium.appliedPct);
      expect(Math.abs(r.headline.mid - expectedMid) / expectedMid, sector).toBeLessThan(0.001);
      // mandatory outputs are all present
      expect(Object.keys(r.mandatoryOutputs).length).toBe(10);
    }
  });

  it("higher inputs produce a higher valuation — the report responds to the founder", () => {
    const base = runInstitutionalValuation(buildProfile({ ...DEFAULT_INTAKE, ttmRevenueUsd: 20_000_000 }));
    const bigger = runInstitutionalValuation(buildProfile({ ...DEFAULT_INTAKE, ttmRevenueUsd: 80_000_000 }));
    expect(bigger.headline.mid).toBeGreaterThan(base.headline.mid);
  });
});
