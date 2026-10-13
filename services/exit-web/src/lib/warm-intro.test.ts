import { describe, it, expect } from "vitest";
import { runBuyerDiscovery } from "@exit/engines";
import { warmIntro, arrBand } from "./warm-intro";
import { SAMPLE_COMPANY } from "./profile";

describe("warm introduction (pre-NDA)", () => {
  const c = runBuyerDiscovery(SAMPLE_COMPANY, { limit: 3 }).candidates[0];
  const text = warmIntro(c, SAMPLE_COMPANY);

  it("names neither the company nor its exact ARR", () => {
    expect(text).not.toContain(SAMPLE_COMPANY.name);
    const arrM = (SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(0);
    expect(text).not.toContain(`$${arrM}M ARR`);
    expect(text.split("\n")[0]).toMatch(/^Subject: Introduction — a confidential /);
  });

  it("gives the ARR as a band", () => {
    expect(arrBand(3e6)).toBe("under $5M");
    expect(arrBand(12e6)).toBe("$10–25M");
    expect(arrBand(250e6)).toBe("over $100M");
    expect(text).toContain(`${arrBand(SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd)} ARR band`);
  });
});
