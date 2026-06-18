import { describe, expect, it, beforeEach } from "vitest";
import {
  captureDealEvent, allDealEvents, clearDealEvents, dealFlowFunnel,
  buyerActivity, setPersistenceAdapter, type DealEvent,
} from "./deal-events.js";

// in-memory adapter so the test doesn't depend on a DOM localStorage
beforeEach(() => {
  let store: DealEvent[] = [];
  setPersistenceAdapter({ read: () => store, write: (e) => { store = e; } });
  clearDealEvents();
});

describe("deal-flow telemetry capture spine", () => {
  it("captures events with id + timestamp, attributed to the actor", () => {
    const e = captureDealEvent({ actorRole: "founder", kind: "viewed_buyer", subjectType: "buyer", subjectId: "microsoft", subjectName: "Microsoft" });
    expect(e.id).toMatch(/^de-/);
    expect(Date.parse(e.at)).not.toBeNaN();
    expect(allDealEvents()).toHaveLength(1);
    expect(allDealEvents()[0].subjectId).toBe("microsoft");
  });

  it("the funnel counts distinct subjects per Phase-5 stage", () => {
    captureDealEvent({ actorRole: "buyer", kind: "listing_viewed", subjectType: "listing", subjectId: "lst-1", subjectName: "Project A" });
    captureDealEvent({ actorRole: "buyer", kind: "expressed_interest", subjectType: "listing", subjectId: "lst-1", subjectName: "Project A" });
    captureDealEvent({ actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: "lst-1", subjectName: "Project A" });
    captureDealEvent({ actorRole: "buyer", kind: "nda_signed", subjectType: "listing", subjectId: "lst-1", subjectName: "Project A" });
    const f = dealFlowFunnel();
    const by = Object.fromEntries(f.map((s) => [s.kind, s.count]));
    expect(by.listing_viewed).toBe(1);
    expect(by.nda_signed).toBe(1);
  });

  it("generates a buyer behavior profile from observed outcomes", () => {
    // Microsoft: engaged, NDA requested + signed, LOI issued, then closed
    for (const kind of ["viewed_buyer", "expressed_interest", "nda_requested", "nda_signed", "loi_issued", "closed"] as const) {
      captureDealEvent({ actorRole: "founder", kind, subjectType: "buyer", subjectId: "microsoft", subjectName: "Microsoft" });
    }
    const a = buyerActivity("microsoft");
    expect(a.hasActivity).toBe(true);
    expect(a.ndaSigned).toBe(1);
    expect(a.ndaConversionPct).toBe(100);   // 1 signed of 1 requested
    expect(a.loiConversionPct).toBe(100);   // 1 loi of 1 signed
    expect(a.closeRatePct).toBe(100);       // 1 close of 1 loi
  });

  it("a buyer with no captured events has an empty, honest profile", () => {
    const a = buyerActivity("never-touched");
    expect(a.hasActivity).toBe(false);
    expect(a.ndaConversionPct).toBeNull();
    expect(a.closeRatePct).toBeNull();
  });

  it("the persistence adapter is swappable — capture API unchanged", () => {
    // a real backend adapter would simply replace read/write; nothing else moves
    let written = 0;
    setPersistenceAdapter({ read: () => [], write: () => { written++; } });
    clearDealEvents();
    captureDealEvent({ actorRole: "founder", kind: "viewed_buyer", subjectType: "buyer", subjectId: "x", subjectName: "X" });
    expect(written).toBeGreaterThan(0);
  });
});
