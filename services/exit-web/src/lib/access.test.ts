import { describe, expect, it } from "vitest";
import { needsUpgrade, canAccess } from "./access.js";

describe("plan gating", () => {
  it("free founders must upgrade for any pro surface", () => {
    expect(needsUpgrade("/console/autopilot", "founder", "free")).toBe(true);
    expect(needsUpgrade("/console/banker", "founder", "free")).toBe(true);
    expect(needsUpgrade("/console/valuation", "founder", "free")).toBe(false); // free surface
  });

  it("starter unlocks the prepare/list/discover surfaces only", () => {
    // starter-included
    expect(needsUpgrade("/console/autopilot", "founder", "starter")).toBe(false);
    expect(needsUpgrade("/console/diligence-ai", "founder", "starter")).toBe(false);
    expect(needsUpgrade("/console/buyer-copilot", "founder", "starter")).toBe(false);
    expect(needsUpgrade("/console/documents", "founder", "starter")).toBe(false);
    expect(needsUpgrade("/console/data-room", "founder", "starter")).toBe(false);
    // still Pro-gated for starter (communicate / negotiate / close)
    expect(needsUpgrade("/console/banker", "founder", "starter")).toBe(true);
    expect(needsUpgrade("/console/negotiator", "founder", "starter")).toBe(true);
    expect(needsUpgrade("/console/closing", "founder", "starter")).toBe(true);
    expect(needsUpgrade("/console/wealth", "founder", "starter")).toBe(true);
  });

  it("prep unlocks prepare/list/discover, keeps engage/close Pro-gated", () => {
    expect(needsUpgrade("/console/diligence-ai", "founder", "prep")).toBe(false);
    expect(needsUpgrade("/console/documents", "founder", "prep")).toBe(false);
    expect(needsUpgrade("/console/data-room", "founder", "prep")).toBe(false);
    expect(needsUpgrade("/console/banker", "founder", "prep")).toBe(true);
    expect(needsUpgrade("/console/closing", "founder", "prep")).toBe(true);
  });

  it("pro unlocks everything; admins bypass", () => {
    expect(needsUpgrade("/console/banker", "founder", "pro")).toBe(false);
    expect(needsUpgrade("/console/closing", "founder", "pro")).toBe(false);
    expect(needsUpgrade("/console/banker", "admin", "free")).toBe(false);
  });
});

describe("counterparty actions are free on every plan (O-17)", () => {
  it("both parties reach their NDAs and transactions on the free plan", () => {
    for (const role of ["founder", "buyer"] as const) {
      expect(canAccess("/console/deals", role), role).toBe(true);
      for (const plan of ["free", "starter", "prep", "pro"] as const) expect(needsUpgrade("/console/deals", role, plan), `${role}/${plan}`).toBe(false);
    }
  });
  it("the premium tools keep their plans", () => {
    expect(needsUpgrade("/console/closing", "founder", "free")).toBe(true);
    expect(needsUpgrade("/console/nda", "founder", "free")).toBe(true);
    expect(needsUpgrade("/console/negotiator", "founder", "free")).toBe(true);
    expect(needsUpgrade("/console/deal-room", "buyer", "free")).toBe(true);
    expect(needsUpgrade("/console/nda", "buyer", "free")).toBe(true);
  });
  it("an account with no role on the page is still refused (the free page grants nothing by itself)", () => {
    expect(canAccess("/console/deals", "admin")).toBe(false);
  });
});

describe("requiredEngagement", () => {
  it("names the engagement only when an upgrade is needed", async () => {
    const { requiredEngagement } = await import("./access");
    expect(requiredEngagement("/console/autopilot", "founder", "free")).toBe("Preparation or Active Mandate");
    expect(requiredEngagement("/console/banker", "founder", "free")).toBe("Active Mandate");
    expect(requiredEngagement("/console/autopilot", "founder", "prep")).toBeNull();
    expect(requiredEngagement("/console/banker", "founder", "prep")).toBe("Active Mandate");
    expect(requiredEngagement("/console/readiness", "founder", "free")).toBeNull();
    expect(requiredEngagement("/console/banker", "founder", "pro")).toBeNull();
  });
});
