import { describe, it, expect } from "vitest";
import { allListings } from "./listings";
import { SOVEREIGN_PRODUCTS, SOVEREIGN_OWNER_ACCOUNT } from "./sovereign-intel";

describe("sovereign product listings", () => {
  it("seeds every published Sovereign product into the exchange", () => {
    const ids = new Set(allListings().map((l) => l.id));
    for (const p of SOVEREIGN_PRODUCTS) expect(ids.has(`lst-sov-${p.id}`)).toBe(true);
    expect(SOVEREIGN_PRODUCTS.length).toBeGreaterThanOrEqual(40);
  });

  it("lists them under the admin account with the real published value (no invented revenue)", () => {
    const sov = allListings().filter((l) => l.id.startsWith("lst-sov-"));
    for (const l of sov) {
      expect(l.ownerAccountId).toBe(SOVEREIGN_OWNER_ACCOUNT);
      expect(l.publicView.disclosed).toBe(false);     // no fabricated revenue/EBITDA
      expect(l.productMeta?.capability).toBeTruthy();
    }
  });

  it("carries the real deployment values verbatim", () => {
    const find = (id: string) => allListings().find((l) => l.id === `lst-sov-${id}`);
    expect(find("national-shell")?.productMeta?.valueText).toBe("$300M–$500M");
    expect(find("exitos")?.productMeta?.valueText).toBe("$4M–$8M");
    expect(find("usa-relocation")?.productMeta?.valueText).toBe("$18M");
  });

  it("surfaces featured acquisition-ready asks where published", () => {
    const norway = allListings().find((l) => l.id === "lst-sov-norway-relocation");
    expect(norway?.productMeta?.acquisitionReadyText).toBe("$5.9M");
    expect(norway?.productMeta?.coverage).toContain("Oslo");
  });
});
