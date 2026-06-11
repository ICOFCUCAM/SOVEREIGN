import { describe, expect, it } from "vitest";
import { SEAT, PORTAL_OPPORTUNITIES, PORTAL_NEGOTIATIONS, PORTAL_STATS, SEAT_MANDATE } from "./buyer-portal.js";
import { MODULE_FACTS, ENGINE_COUNTS } from "./module-stats.js";

describe("buyer portal data", () => {
  it("resolves a real seat from the registry", () => {
    expect(SEAT.entry).toBeDefined();
    expect(SEAT.rank).toBeGreaterThan(0);
    expect(SEAT_MANDATE).toMatch(/check \$/);
  });
  it("derives the opportunity from the live listing", () => {
    const o = PORTAL_OPPORTUNITIES[0];
    expect(o.ask).toBeGreaterThan(0);
    expect(o.fit).toBeGreaterThan(0);
    expect(o.fit).toBeLessThanOrEqual(100);
    // Absolute revenue only renders once the seat's NDA is active.
    if (o.revenue != null) expect(o.hasDataRoom).toBe(true);
  });
  it("negotiations mirror the seat's own offers exactly", () => {
    if (SEAT.offer) {
      expect(PORTAL_NEGOTIATIONS).toHaveLength(1);
      expect(PORTAL_NEGOTIATIONS[0].offer).toBe(SEAT.offer.headlinePriceUsd);
    } else {
      expect(PORTAL_NEGOTIATIONS).toHaveLength(0);
    }
    expect(PORTAL_STATS.negotiations).toBe(PORTAL_NEGOTIATIONS.length);
  });
  it("module facts are computed, non-empty and engine-true", () => {
    for (const v of Object.values(MODULE_FACTS)) expect(v).not.toMatch(/undefined|NaN/);
    expect(ENGINE_COUNTS.diligencePackages).toBe(7);
    expect(ENGINE_COUNTS.registryFirms).toBeGreaterThan(0);
    expect(PORTAL_STATS.diligencePackages).toBe(7);
  });
});
