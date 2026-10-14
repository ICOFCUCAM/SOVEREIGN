import { describe, it, expect } from "vitest";
import { NAV } from "./access.js";
import { menuSummary } from "./menu-summaries.js";

describe("menu summaries", () => {
  it("every menu entry has a summary for each role that sees it", () => {
    for (const n of NAV) for (const r of n.roles) expect(menuSummary(n.to, r)?.what, `${n.to} (${r})`).toBeTruthy();
  });

  it("the five desks say what they are and what they need", () => {
    expect(menuSummary("/console/journey", "founder")).toMatchObject({ kind: "Real", plan: "Free" });
    expect(menuSummary("/console/journey", "buyer")?.what).toMatch(/buying a company/);
    expect(menuSummary("/console/commander", "founder")).toMatchObject({ kind: "Real", plan: "Active Mandate" });
    expect(menuSummary("/console/autopilot", "founder")).toMatchObject({ kind: "Simulation", plan: "Preparation or Active Mandate" });
    expect(menuSummary("/console/banker", "founder")?.kind).toBe("Preview");
    expect(menuSummary("/console/wealth", "founder")?.what).toMatch(/money arrives/);
  });

  it("other entries use the page's own purpose, with no real/preview tag", () => {
    const s = menuSummary("/console/intake", "founder");
    expect(s?.kind).toBeUndefined();
    expect(s?.plan).toBe("Free");
  });
});
