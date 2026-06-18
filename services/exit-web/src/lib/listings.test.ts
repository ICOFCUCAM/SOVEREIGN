import { describe, expect, it, beforeEach } from "vitest";
import { allListings, listCompany, listingFromCompany, setListingsAdapter, type Listing } from "./listings.js";
import { matchCompanyToCriteria } from "./acquirer.js";
import { buildProfile, SAMPLE_INTAKE } from "./company-intake.js";

beforeEach(() => {
  let store: Listing[] = [];
  setListingsAdapter({ read: () => store, write: (l) => { store = l; } });
});

describe("listings repository — the supply side of the exchange", () => {
  it("always has the demo baseline so the pool is never empty", () => {
    expect(allListings().length).toBeGreaterThanOrEqual(1);
  });

  it("a listing's public view is anonymized — sector/region/revenue, never the name", () => {
    const l = listingFromCompany(buildProfile({ ...SAMPLE_INTAKE, name: "Acme Secret Co", sector: "ai_infra" }));
    expect(l.code).toMatch(/^Project /);
    expect(JSON.stringify(l.publicView)).not.toContain("Acme Secret Co");
    expect(l.publicView.sector).toBe("AI");
  });

  it("listing a company adds it to the pool", () => {
    const before = allListings().length;
    listCompany(buildProfile({ ...SAMPLE_INTAKE, name: "NewCo", sector: "fintech_payments" }));
    expect(allListings().length).toBe(before + 1);
    expect(allListings().some((l) => l.profile.name === "NewCo")).toBe(true);
  });

  it("a buyer mandate scores against the whole pool via the same matcher", () => {
    listCompany(buildProfile({ ...SAMPLE_INTAKE, name: "AIco", sector: "ai_infra", jurisdiction: "US", ttmRevenueUsd: 40e6, growthPct: 0.5 }));
    const criteria = { sectors: ["AI"], minRevUsd: 5e6, maxRevUsd: 500e6, regions: ["North America" as const], minGrowthPct: 0.2 };
    const scored = allListings().map((l) => matchCompanyToCriteria(l.profile, criteria));
    expect(scored.some((m) => m.qualified)).toBe(true);   // AIco qualifies
  });
});
