import { describe, expect, it } from "vitest";
import type { SectorIndex } from "@exit/engines";
import { sectorSignals, SECTOR_INDEX_MAP } from "./sector-signals.js";
import { ACQ_INDEXES } from "./market-intel.js";

const idx = (sector: string, volume12m: number, trendPct: number | null = null): SectorIndex =>
  ({ sector, volume: volume12m * 10, volume12m, volumePrior12m: 1, trendPct, activeBuyers: 1, disclosedDeals: 0, medianDealUsd: null, totalDisclosedUsd: 0 });

describe("sectorSignals", () => {
  it("puts the company's mapped sectors first, flagged as yours", () => {
    const s = sectorSignals("logistics_freight", 2, [idx("Media", 10), idx("Logistics", 0), idx("AI", 8)]);
    expect(s[0]).toMatchObject({ sector: "Logistics", yours: true });
    expect(s.slice(1).map((x) => x.sector)).toEqual(["Media", "AI"]);
  });

  it("only lists other sectors with 12-month activity, busiest first", () => {
    const s = sectorSignals("other", 3, [idx("A", 0), idx("B", 2), idx("C", 5)]);
    expect(s.map((x) => x.sector)).toEqual(["C", "B"]);
    expect(s.every((x) => !x.yours)).toBe(true);
  });

  it("never duplicates a sector", () => {
    const s = sectorSignals("enterprise_saas");
    expect(new Set(s.map((x) => x.sector)).size).toBe(s.length);
  });

  it("maps only to sectors that exist in the index snapshot", () => {
    const known = new Set(ACQ_INDEXES.indexes.map((i) => i.sector));
    for (const list of Object.values(SECTOR_INDEX_MAP)) for (const s of list) expect(known.has(s)).toBe(true);
  });
});
