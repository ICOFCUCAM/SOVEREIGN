import { describe, it, expect } from "vitest";
import { toTerms, EMPTY_IOI } from "./IoiTerms";

describe("structured IOI terms", () => {
  it("keep only what the bidder stated: blank is not stated, never zero", () => {
    expect(toTerms(EMPTY_IOI)).toEqual({});
    expect(toTerms({ ...EMPTY_IOI, cash: "85", escrow: "8", escrowMonths: "18", exclusivity: "60", financing: "cash_on_hand", conditions: "Diligence\n\nFounder retention", validUntil: "2026-11-15" }))
      .toEqual({ cashPct: 0.85, escrowPct: 0.08, escrowMonths: 18, exclusivityDays: 60, financing: "cash_on_hand", conditions: ["Diligence", "Founder retention"], validUntil: "2026-11-15" });
  });
  it("drop values out of range rather than store nonsense", () => {
    expect(toTerms({ ...EMPTY_IOI, cash: "150", exclusivity: "-3", validUntil: "soon" })).toEqual({});
  });
});
