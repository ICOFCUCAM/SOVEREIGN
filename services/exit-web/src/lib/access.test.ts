import { describe, expect, it } from "vitest";
import { needsUpgrade } from "./access.js";

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
