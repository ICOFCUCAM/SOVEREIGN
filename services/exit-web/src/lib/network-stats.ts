import { allDealEvents, type DealEvent, type DealEventKind } from "./deal-events";

// ── NETWORK EFFECTS ─────────────────────────────────────────────────
// What the platform has LEARNED from real captured transactions. Every
// completed action (view → interest → NDA → meeting → IOI/LOI → close) is a
// real event in the stream; these aggregates are the compounding moat — the
// response/close rates that no banker or database has, and that sharpen with
// each transaction. Nothing is modelled or fabricated: a rate is null until
// the network has produced the events to measure it.

export interface NetworkStats {
  readonly actions: number;
  readonly interest: number;
  readonly ndaRequested: number;
  readonly ndaSigned: number;
  readonly meetings: number;
  readonly offers: number;          // IOI / LOI (loi_issued)
  readonly closed: number;
  readonly walked: number;
  readonly responseRatePct: number | null;   // ndaSigned / ndaRequested
  readonly meetingRatePct: number | null;     // meetings / ndaSigned
  readonly closeRatePct: number | null;       // closed / offers
}

const pct = (n: number, d: number): number | null => (d > 0 ? Math.round((n / d) * 100) : null);

export function networkStats(events: readonly DealEvent[] = allDealEvents()): NetworkStats {
  const n = (k: DealEventKind): number => events.filter((e) => e.kind === k).length;
  const ndaRequested = n("nda_requested"), ndaSigned = n("nda_signed");
  const meetings = n("meeting_scheduled"), offers = n("loi_issued"), closed = n("closed");
  return {
    actions: events.length,
    interest: n("expressed_interest"),
    ndaRequested, ndaSigned, meetings, offers, closed,
    walked: n("walked_away"),
    responseRatePct: pct(ndaSigned, ndaRequested),
    meetingRatePct: pct(meetings, ndaSigned),
    closeRatePct: pct(closed, offers),
  };
}
