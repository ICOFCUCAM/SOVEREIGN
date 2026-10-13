import { describe, expect, it, beforeEach } from "vitest";
import { allListings, listCompany, listingFromCompany, setListingsAdapter, setListingOwner, normalizeListing, findOwnListing, legacyListingId, type Listing } from "./listings.js";
import { matchListingToCriteria } from "./acquirer.js";
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
    expect(findOwnListing(buildProfile({ ...SAMPLE_INTAKE, name: "NewCo", sector: "fintech_payments" }))).toBeTruthy();
  });

  it("a listed company is stamped with the connected owner — drives write RLS", () => {
    setListingOwner("acct-founder-7");
    const l = listCompany(buildProfile({ ...SAMPLE_INTAKE, name: "OwnedCo", sector: "ai_infra" }));
    expect(l.ownerAccountId).toBe("acct-founder-7");
    setListingOwner(undefined);   // reset for other tests
  });

  it("a buyer mandate scores against the whole pool via the same matcher", () => {
    listCompany(buildProfile({ ...SAMPLE_INTAKE, name: "AIco", sector: "ai_infra", jurisdiction: "US", ttmRevenueUsd: 40e6, growthPct: 0.5 }));
    const criteria = { sectors: ["AI"], minRevUsd: 5e6, maxRevUsd: 500e6, regions: ["North America" as const], minGrowthPct: 0.2 };
    const scored = allListings().map((l) => matchListingToCriteria(l.publicView, criteria));
    expect(scored.some((m) => m.qualified)).toBe(true);   // AIco qualifies
  });
});

describe("withdrawing a listing", () => {
  it("unlistCompany removes it and isListed reflects that", async () => {
    const { unlistCompany, isListed } = await import("./listings.js");
    const { buildProfile, SAMPLE_INTAKE } = await import("./company-intake.js");
    const l = listCompany(buildProfile({ ...SAMPLE_INTAKE, name: "Withdraw Me Co" }));
    expect(isListed(l.id)).toBe(true);
    unlistCompany(l.id);
    expect(isListed(l.id)).toBe(false);
    expect(allListings().some((x) => x.id === l.id)).toBe(false);
  });
});

describe("listing origin", () => {
  it("separates founder listings from the demo and catalog seeds", async () => {
    const { listingOrigin } = await import("./listings.js");
    const all = allListings();
    expect(all.filter((l) => listingOrigin(l) === "demo").map((l) => l.id)).toEqual(["lst-demo-helios"]);
    expect(all.filter((l) => listingOrigin(l) === "catalog").every((l) => l.id.startsWith("lst-sov-"))).toBe(true);
    expect(listingOrigin({ id: "lst-acme" })).toBe("founder");
  });
});

describe("a listing carries public fields only (shared with every buyer)", () => {
  const secret = buildProfile({ ...SAMPLE_INTAKE, name: "Acme Secret Co", sector: "ai_infra", ttmRevenueUsd: 37_400_000, growthPct: 0.43 });

  it("holds no profile, no name and no exact figure — brackets only", () => {
    const json = JSON.stringify(listingFromCompany(secret));
    expect(json).not.toContain("Acme Secret Co");
    expect(json).not.toContain("acme");
    expect(json).not.toContain("37400000");
    expect(json).not.toContain("0.43");
    expect(json).not.toContain('"profile"');
    expect(listingFromCompany(secret).publicView.revenueBand?.label).toBe("$25–50M");
  });

  it("is not identified by the company name", () => {
    expect(listingFromCompany(secret).id).not.toContain("acme");
    expect(legacyListingId(secret)).toContain("acme");     // the old scheme, kept only to find old listings
  });

  it("strips the profile and exact figures from a listing stored by an earlier version", () => {
    const old = { id: "lst-acme-secret-co", code: "Project Atlas", listedAt: "t", ownerAccountId: "u1",
      profile: secret, publicView: { sector: "AI", region: "North America", revenueUsd: 37_400_000, growthPct: 0.43, ebitdaMarginPct: 0.2, disclosed: true } };
    const n = normalizeListing(old);
    const json = JSON.stringify(n);
    expect(json).not.toContain("Acme Secret Co");
    expect(json).not.toContain("37400000");
    expect(n.publicView.revenueBand?.label).toBe("$25–50M");
    expect(n.publicView.growthBand?.label).toBe("25–50%");
  });

  it("listing again replaces the copy stored under the old name-derived id", () => {
    let store: Listing[] = [normalizeListing({ id: legacyListingId(secret), code: "Project Atlas", listedAt: "t", publicView: { sector: "AI", region: "North America" } })];
    setListingsAdapter({ read: () => store, write: (l) => { store = l; } });
    listCompany(secret);
    expect(store.filter((l) => l.id === legacyListingId(secret))).toHaveLength(0);
    expect(findOwnListing(secret)?.id).toBe(listingFromCompany(secret).id);
  });
});
