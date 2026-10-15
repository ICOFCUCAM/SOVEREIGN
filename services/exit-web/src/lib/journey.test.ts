import { describe, it, expect } from "vitest";
import { canAccess, NAV } from "./access.js";
import { BUYER_JOURNEY, SELLER_JOURNEY, NO_SIGNALS, journeyFor, stepStatus, currentStep, stepOnPage, finished, type JourneySignals } from "./journey.js";

const sig = (s: Partial<JourneySignals>): JourneySignals => ({ ...NO_SIGNALS, ...s });

describe("guided journey", () => {
  it("every step is a page its side can open, on the free plan", () => {
    for (const s of SELLER_JOURNEY) expect(canAccess(s.to, "founder"), s.to).toBe(true);
    for (const s of BUYER_JOURNEY) expect(canAccess(s.to, "buyer"), s.to).toBe(true);
    for (const r of ["founder", "buyer"] as const) expect(NAV.some((n) => n.to === "/console/journey" && n.roles.includes(r))).toBe(true);
  });

  it("a step is done only by its record; opening a page never completes a 'do' step", () => {
    const list = SELLER_JOURNEY.find((s) => s.id === "list")!;
    expect(stepStatus(list, sig({ visited: ["/console/intake"] }))).toBe("todo");
    expect(stepStatus(list, sig({ listed: true }))).toBe("done");
    const readiness = SELLER_JOURNEY.find((s) => s.id === "readiness")!;
    expect(stepStatus(readiness, NO_SIGNALS)).toBe("todo");
    expect(stepStatus(readiness, sig({ visited: ["/console/readiness"] }))).toBe("reviewed");
  });

  it("signing counts once the deal is signed or closed; closing only when closed", () => {
    const sign = BUYER_JOURNEY.find((s) => s.id === "sign")!, close = BUYER_JOURNEY.find((s) => s.id === "close")!;
    expect(stepStatus(sign, sig({ txnClosed: true }))).toBe("done");
    expect(stepStatus(close, sig({ txnSigned: true }))).toBe("todo");
  });

  it("the current step is the first unfinished one, and the page's own step wins where two share a page", () => {
    expect(SELLER_JOURNEY[currentStep(SELLER_JOURNEY, NO_SIGNALS)]!.id).toBe("value");
    const s = sig({ intakeSaved: true, visited: ["/console/readiness", "/console/valuation", "/console/buyers"] });
    expect(SELLER_JOURNEY[currentStep(SELLER_JOURNEY, s)]!.id).toBe("story");
    // the intake page holds both "value" and "list": once the figures are saved it is the listing step
    expect(SELLER_JOURNEY[stepOnPage(SELLER_JOURNEY, "/console/intake", s)]!.id).toBe("list");
    expect(stepOnPage(SELLER_JOURNEY, "/console/somewhere-else", s)).toBe(-1);
  });

  it("finishes only when every step is done or reviewed", () => {
    expect(finished(BUYER_JOURNEY, sig({ mandateSaved: true, ndaRequested: true, ndaExecuted: true, offerMade: true, txnSigned: true, txnClosed: true }))).toBe(false);
    expect(finished(BUYER_JOURNEY, sig({ mandateSaved: true, ndaRequested: true, ndaExecuted: true, offerMade: true, txnSigned: true, txnClosed: true, visited: ["/console/marketplace"] }))).toBe(true);
  });
});

describe("guided journey · shared pages", () => {
  it("Next to a step on a page shared with an earlier step lands on that step, not back on the earlier one", () => {
    const req = BUYER_JOURNEY.findIndex((s) => s.id === "request");
    expect(stepOnPage(BUYER_JOURNEY, "/console/acquisition-radar", NO_SIGNALS)).toBe(0);
    expect(stepOnPage(BUYER_JOURNEY, "/console/acquisition-radar", NO_SIGNALS, req)).toBe(req);
    // an intended step that is not on this page is ignored
    expect(stepOnPage(BUYER_JOURNEY, "/console/marketplace", NO_SIGNALS, req)).toBe(1);
  });
});

describe("guided journey · the banker and WealthOS", () => {
  it("open with the investment banker and end with WealthOS, without holding the journey back", () => {
    expect(SELLER_JOURNEY[0]!.to).toBe("/console/commander");
    expect(SELLER_JOURNEY[SELLER_JOURNEY.length - 1]!.to).toBe("/console/wealth");
    const all = sig({ intakeSaved: true, listed: true, ndaExecuted: true, offerAccepted: true, txnSigned: true, txnClosed: true,
      storySaved: true, dataRoomComplete: true, cimSaved: true, teaserSaved: true,
      visited: ["/console/readiness", "/console/valuation", "/console/buyers", "/console/investors", "/console/diligence-ai", "/console/market-map", "/console/exit-timing"] });
    expect(finished(SELLER_JOURNEY, all)).toBe(true);
  });
});

describe("guided journey · prepare for market", () => {
  const ids = (xs: readonly { id: string }[]) => xs.map((x) => x.id);
  it("sits between meeting buyers and listing, in order", () => {
    const all = ids(SELLER_JOURNEY);
    expect(all.slice(all.indexOf("buyers") + 1, all.indexOf("list"))).toEqual(["story", "captable", "diligence", "dataroom", "documents", "market", "timing"]);
    expect(SELLER_JOURNEY.filter((s) => s.section === "Prepare for market")).toHaveLength(7);
  });
  it("each step is done only by its own record", () => {
    const step = (id: string) => SELLER_JOURNEY.find((s) => s.id === id)!;
    expect(stepStatus(step("story"), sig({ visited: ["/console/company-story"] }))).toBe("todo");
    expect(stepStatus(step("story"), sig({ storySaved: true }))).toBe("done");
    expect(stepStatus(step("documents"), sig({ cimSaved: true }))).toBe("todo");
    expect(stepStatus(step("documents"), sig({ cimSaved: true, teaserSaved: true }))).toBe("done");
    expect(stepStatus(step("dataroom"), sig({ visited: ["/console/data-room"] }))).toBe("todo");
    expect(stepStatus(step("dataroom"), sig({ dataRoomComplete: true }))).toBe("done");
  });
  it("on the free plan the Preparation steps are optional and never hold the journey back; on Preparation they lead", () => {
    const base = sig({ intakeSaved: true, storySaved: true, visited: ["/console/readiness", "/console/valuation", "/console/buyers", "/console/investors"] });
    const free = journeyFor("founder", "free"), prep = journeyFor("founder", "prep");
    expect(free.find((s) => s.id === "dataroom")!.optional).toBe(true);
    expect(free[currentStep(free, base)]!.id).toBe("list");
    expect(prep.find((s) => s.id === "dataroom")!.optional).toBeFalsy();
    expect(prep[currentStep(prep, base)]!.id).toBe("diligence");
    // Exit Timing is part of Preparation
    expect(prep.find((s) => s.id === "timing")!.optional).toBeFalsy();
  });
});
