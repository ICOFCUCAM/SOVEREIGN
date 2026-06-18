import { describe, expect, it } from "vitest";
import { networkStats } from "./network-stats.js";
import type { DealEvent, DealEventKind } from "./deal-events.js";

const ev = (kind: DealEventKind, subjectId: string): DealEvent =>
  ({ id: `${kind}-${subjectId}-${Math.random()}`, at: new Date().toISOString(), actorRole: "buyer", kind, subjectType: "listing", subjectId, subjectName: subjectId });

describe("network effects — observed rates from real captured events", () => {
  it("rates are null until the network produces the events to measure them", () => {
    const s = networkStats([]);
    expect(s.actions).toBe(0);
    expect(s.responseRatePct).toBeNull();
    expect(s.closeRatePct).toBeNull();
  });

  it("computes response / meeting / close rates from the captured funnel", () => {
    const events: DealEvent[] = [
      ev("nda_requested", "a"), ev("nda_requested", "b"), ev("nda_requested", "c"), ev("nda_requested", "d"),
      ev("nda_signed", "a"), ev("nda_signed", "b"),          // 2 of 4 requested → 50%
      ev("meeting_scheduled", "a"),                          // 1 of 2 signed → 50%
      ev("loi_issued", "a"), ev("loi_issued", "b"),
      ev("closed", "a"),                                     // 1 of 2 offers → 50%
    ];
    const s = networkStats(events);
    expect(s.responseRatePct).toBe(50);
    expect(s.meetingRatePct).toBe(50);
    expect(s.closeRatePct).toBe(50);
    expect(s.closed).toBe(1);
  });
});
