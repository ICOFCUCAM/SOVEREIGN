import { describe, it, expect, beforeEach } from "vitest";
import { guideState, markVisited, setGuideHidden, stepsFor, FOUNDER_STEPS, BUYER_STEPS } from "./onboarding.js";

// in-memory localStorage shim (the test env is node, not jsdom); no window,
// so the change event is skipped (write() guards it)
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
});

describe("onboarding guide state", () => {

  it("starts empty and visible", () => {
    expect(guideState()).toEqual({ visited: [], hidden: false });
  });

  it("records each opened page once", () => {
    markVisited("/console/readiness");
    markVisited("/console/readiness");
    expect(guideState().visited).toEqual(["/console/readiness"]);
  });

  it("remembers hiding and showing", () => {
    setGuideHidden(true);
    expect(guideState().hidden).toBe(true);
    setGuideHidden(false);
    expect(guideState().hidden).toBe(false);
  });

  it("ignores a corrupt stored value", () => {
    localStorage.setItem("exitos.guide.v1", "{not json");
    expect(guideState()).toEqual({ visited: [], hidden: false });
  });

  it("gives founders and buyers their own steps", () => {
    expect(stepsFor("founder")).toBe(FOUNDER_STEPS);
    expect(stepsFor("buyer")).toBe(BUYER_STEPS);
    expect(FOUNDER_STEPS[0]!.signal).toBe("intake");
  });
});
