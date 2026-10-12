import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { BRAND_FILES, TIERS, insigniaSvg, ticks } from "./insignia";

const PUBLIC = path.resolve(__dirname, "../../public");

describe("ExitOS insignia (HX2)", () => {
  it("the static brand files in /public match the master geometry", () => {
    for (const [f, svg] of Object.entries(BRAND_FILES)) {
      expect(fs.readFileSync(path.join(PUBLIC, f), "utf8").trim(), `${f} is stale: run npx vite-node scripts/brand-assets.ts`).toBe(svg);
    }
  });

  it("the registration ticks cross the market ring in every tier", () => {
    for (const T of Object.values(TIERS)) {
      expect(T.tick[0]).toBeLessThan(T.r);
      expect(T.tick[1]).toBeGreaterThan(T.r);
    }
  });

  it("every tier stays inside the tile with a margin", () => {
    for (const T of Object.values(TIERS)) {
      for (const [, , x, y] of ticks(T.tick[0], T.tick[1])) {
        expect(Math.min(x, y, 100 - x, 100 - y) - T.tickW / 2).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("the mono variant is a single colour; the tile carries the ice core", () => {
    const mono = insigniaSvg({ tier: "standard", variant: "mono", color: "#111310" });
    expect(new Set(mono.match(/#[0-9A-Fa-f]{6}/g)).size).toBe(1);
    expect(insigniaSvg({ tier: "micro", variant: "tile" })).toContain("#7FC2CE");
  });
});
