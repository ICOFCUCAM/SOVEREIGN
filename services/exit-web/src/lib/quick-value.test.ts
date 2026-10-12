import { describe, it, expect } from "vitest";
import { runInstitutionalValuation } from "@exit/engines";
import { buildProfile, DEFAULT_INTAKE } from "./company-intake.js";
import { fromQuery, quickQuery, quickIntake, quickValue, ARR_SHARE } from "./quick-value.js";

describe("quick value", () => {
  const q = { sector: "vertical_saas" as const, revenueUsd: 40_000_000, growthPct: 0.45 };

  it("equals the console's institutional value for the same inputs", () => {
    const h = runInstitutionalValuation(buildProfile({ ...DEFAULT_INTAKE, ttmRevenueUsd: 40_000_000, arrUsd: 30_000_000, growthPct: 0.45 })).headline;
    expect(quickValue(q)).toEqual({ low: h.low, mid: h.mid, high: h.high });
  });

  it("keeps the intake's defaults apart from the three figures", () => {
    const i = quickIntake({ ...q, revenueUsd: 10_000_000 });
    expect(i.grossMarginPct).toBe(DEFAULT_INTAKE.grossMarginPct);
    expect(i.arrUsd).toBe(Math.round(10_000_000 * ARR_SHARE));
  });

  it("round-trips through the URL", () => {
    expect(fromQuery(quickQuery(q))).toEqual(q);
  });

  it("rejects missing, unknown or out-of-range figures", () => {
    expect(fromQuery("")).toBeNull();
    expect(fromQuery("?sector=banana&revenue=10&growth=20")).toBeNull();
    expect(fromQuery("?sector=vertical_saas&revenue=0&growth=20")).toBeNull();
    expect(fromQuery("?sector=vertical_saas&revenue=10&growth=900")).toBeNull();
  });
});
