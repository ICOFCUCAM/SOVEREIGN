import { describe, expect, it } from "vitest";
import { matchCompanyToCriteria, exitosSectorOf, type AcquisitionCriteria } from "./acquirer.js";
import { buildProfile, SAMPLE_INTAKE } from "./company-intake.js";

// a German AI company growing 58% on $32M revenue — the user's worked example
const acmeAI = buildProfile({ ...SAMPLE_INTAKE, name: "Acme AI", sector: "ai_infra", jurisdiction: "DE", ttmRevenueUsd: 32_000_000, growthPct: 0.58 });

describe("acquirer-side matching (Buyer → Company)", () => {
  it("maps a company's sector to the ExitOS buyer taxonomy", () => {
    expect(exitosSectorOf(acmeAI)).toBe("AI");
  });

  it("a company inside the full mandate is a qualified opportunity, itemized", () => {
    const c: AcquisitionCriteria = { sectors: ["AI", "Software", "Developer Tools"], minRevUsd: 5e6, maxRevUsd: 500e6, regions: ["North America", "Europe"], minGrowthPct: 0.2 };
    const m = matchCompanyToCriteria(acmeAI, c);
    expect(m.qualified).toBe(true);
    expect(m.score).toBe(100);
    expect(m.reasons.every((r) => r.ok)).toBe(true);
    // every criterion is explained against the real figure
    expect(m.reasons.find((r) => r.label === "Growth")!.detail).toMatch(/58%/);
  });

  it("a sector miss disqualifies even when other criteria pass — earned, not asserted", () => {
    const c: AcquisitionCriteria = { sectors: ["Logistics"], minRevUsd: 5e6, maxRevUsd: 500e6, regions: [], minGrowthPct: 0 };
    const m = matchCompanyToCriteria(acmeAI, c);
    expect(m.qualified).toBe(false);
    expect(m.reasons.find((r) => r.label === "Sector")!.ok).toBe(false);
  });

  it("revenue and region bands are enforced against the company's actual figures", () => {
    const tooSmall: AcquisitionCriteria = { sectors: [], minRevUsd: 100e6, maxRevUsd: 500e6, regions: [], minGrowthPct: 0 };
    expect(matchCompanyToCriteria(acmeAI, tooSmall).reasons.find((r) => r.label === "Revenue")!.ok).toBe(false);
    const wrongRegion: AcquisitionCriteria = { sectors: [], minRevUsd: 0, maxRevUsd: 1e12, regions: ["Asia"], minGrowthPct: 0 };
    expect(matchCompanyToCriteria(acmeAI, wrongRegion).reasons.find((r) => r.label === "Region")!.ok).toBe(false);
  });

  it("empty sectors/regions mean 'any' — no false negatives", () => {
    const open: AcquisitionCriteria = { sectors: [], minRevUsd: 0, maxRevUsd: 1e12, regions: [], minGrowthPct: 0 };
    const m = matchCompanyToCriteria(acmeAI, open);
    expect(m.score).toBe(100);
    expect(m.qualified).toBe(true);
  });
});
