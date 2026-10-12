import { describe, expect, it } from "vitest";
import { liquidityIndex, scenariosFor, heatFor, funnelFor, LIFECYCLE } from "./liquidity-view.js";
import { DEAL_BUYERS, ACTIVE_BUYERS, CURRENT_VALUE_USD, POTENTIAL_VALUE_USD } from "./deal-context.js";

// Same formulas as the pre-redesign DashboardModules/JourneyMap.
describe("liquidity view derivations", () => {
  it("liquidity index is 70 + 4·active, capped at 98", () => {
    expect(liquidityIndex(0)).toBe(70);
    expect(liquidityIndex(3)).toBe(82);
    expect(liquidityIndex(20)).toBe(98);
    expect(liquidityIndex(ACTIVE_BUYERS)).toBe(Math.min(98, 70 + ACTIVE_BUYERS * 4));
  });
  it("scenarios: today, after fixes, ×1.27", () => {
    const s = scenariosFor(CURRENT_VALUE_USD, POTENTIAL_VALUE_USD);
    expect(s.map((x) => x.value)).toEqual([CURRENT_VALUE_USD, POTENTIAL_VALUE_USD, Math.round(POTENTIAL_VALUE_USD * 1.27)]);
  });
  it("heat map tops out at 100 with at most five geographies", () => {
    const h = heatFor(DEAL_BUYERS);
    expect(h.length).toBeLessThanOrEqual(5);
    if (h.length) expect(h[0].score).toBe(100);
  });
  it("funnel marks NDA/offer stages as sample data", () => {
    const f = funnelFor(15, 6, 3, true);
    expect(f.filter((x) => x.sample).map((x) => x.label)).toEqual(["Under NDA", "Offers in hand", "Leading bid"]);
  });
  it("lifecycle keeps all seven stages and their routes", () => {
    expect(LIFECYCLE.map((s) => s.to ?? null)).toEqual([null, "/console/readiness", "/console/intelligence", "/console/banker", "/console/negotiator", "/console/closing", "/console/wealth"]);
  });
});
