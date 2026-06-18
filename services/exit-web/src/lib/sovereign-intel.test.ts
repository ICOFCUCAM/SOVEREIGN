import { describe, it, expect } from "vitest";
import { allListings } from "./listings";
import { SOVEREIGN_INTEL_PRODUCTS, SOVEREIGN_OWNER_ACCOUNT } from "./sovereign-intel";

describe("sovereign intelligence listings", () => {
  it("seeds every Strategic Intelligence Stack product into the exchange", () => {
    const ids = new Set(allListings().map((l) => l.id));
    for (const p of SOVEREIGN_INTEL_PRODUCTS) expect(ids.has(`lst-sov-${p.id}`)).toBe(true);
  });

  it("lists them under the admin account with financials withheld (never fabricated)", () => {
    const sov = allListings().filter((l) => l.id.startsWith("lst-sov-"));
    expect(sov.length).toBe(SOVEREIGN_INTEL_PRODUCTS.length);
    for (const l of sov) {
      expect(l.ownerAccountId).toBe(SOVEREIGN_OWNER_ACCOUNT);
      expect(l.publicView.disclosed).toBe(false);   // no invented revenue/EBITDA
      expect(l.productMeta?.capability).toBeTruthy(); // real capability surfaced
      // real published platform pricing attached as context (not a per-engine price)
      expect(l.productMeta?.pricingNote).toMatch(/\$490\/mo.*\$4,900\/mo/);
    }
  });

  it("carries the real product name and the question it answers", () => {
    const osint = allListings().find((l) => l.id === "lst-sov-osint");
    expect(osint?.code).toBe("OSINT Engine");
    expect(osint?.productMeta?.answers).toMatch(/changed in the world/i);
  });
});
