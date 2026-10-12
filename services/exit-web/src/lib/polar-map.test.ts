import { describe, expect, it } from "vitest";
import { LAND_COAST, LAND_FILL, POLAR, parallel } from "./polar-map";

describe("polar map (HX6)", () => {
  it("is an azimuthal equidistant projection about the North Pole, cut at 60°S", () => {
    expect(parallel(90)).toBe(0);
    expect(parallel(POLAR.edge)).toBeCloseTo(POLAR.r);
    expect(parallel(0) - parallel(30)).toBeCloseTo(parallel(30) - parallel(60)); // equal spacing of parallels
  });

  it("keeps every coastline point inside the disc", () => {
    for (const d of [LAND_FILL, LAND_COAST]) {
      // walk the path (absolute M, relative l; tenths of a unit)
      let x = 0, y = 0, n = 0;
      for (const [, cmd, a, b] of d.matchAll(/([Ml])(-?\d+)\s?(-?\d+)/g)) {
        if (cmd === "M") { x = +a; y = +b; } else { x += +a; y += +b; }
        expect(Math.hypot(x / 10 - POLAR.c, y / 10 - POLAR.c)).toBeLessThanOrEqual(POLAR.r + 0.5);
        n++;
      }
      expect(n).toBeGreaterThan(1000);
    }
  });
});
