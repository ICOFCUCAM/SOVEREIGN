import type { NdaInstance } from '../nda/types.js';
import type { Offer } from '../negotiation/types.js';

// ── MANDATE TELEMETRY — the buyer-response moat ─────────────────────
// The canonical event model for what happens AFTER a match: NDA requested
// and signed, LOI issued, diligence, close or walk-away. Aggregated per
// buyer, this becomes intelligence neither PitchBook nor a banker has —
// "who responds fast, who pays premiums, who retrades, who closes" — and it
// strengthens with every real process. Nothing here is invented: events are
// derived from the platform's own NDA and offer artifacts (each timestamped).

export type MandateEventKind =
  | 'matched' | 'nda_requested' | 'nda_signed'
  | 'loi_issued' | 'diligence_started' | 'closed' | 'walked_away';

export interface MandateEvent {
  readonly buyerId: string;        // normalized buyer key
  readonly buyerName: string;
  readonly listingId: string;
  readonly kind: MandateEventKind;
  readonly at: string;             // ISO timestamp
}

const norm = (s: string): string => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
const day = (a: string, b: string): number | null => {
  const ta = new Date(a).getTime(), tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb) || tb < ta) return null;
  return Math.round((tb - ta) / 86_400_000);
};
const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
};

/** Derive a typed event stream from the platform's process artifacts. */
export function mandateEventsFrom(input: {
  listingId: string;
  matchedBuyers?: ReadonlyArray<{ id?: string; name: string }>;
  ndas?: readonly NdaInstance[];
  offers?: readonly Offer[];
}): MandateEvent[] {
  const ev: MandateEvent[] = [];
  const { listingId } = input;

  for (const b of input.matchedBuyers ?? []) {
    ev.push({ buyerId: b.id ?? norm(b.name), buyerName: b.name, listingId, kind: 'matched', at: '' });
  }
  for (const n of input.ndas ?? []) {
    const name = n.receiving.name;
    const id = norm(name);
    ev.push({ buyerId: id, buyerName: name, listingId: n.listingId ?? listingId, kind: 'nda_requested', at: n.issuedAt });
    const signed = n.signatureEvents.find((s) => s.party === 'receiving');
    if (signed) ev.push({ buyerId: id, buyerName: name, listingId: n.listingId ?? listingId, kind: 'nda_signed', at: signed.at });
    if (n.state === 'revoked' || n.state === 'breached') ev.push({ buyerId: id, buyerName: name, listingId: n.listingId ?? listingId, kind: 'walked_away', at: signed?.at ?? n.issuedAt });
  }
  for (const o of input.offers ?? []) {
    const id = norm(o.buyerName);
    ev.push({ buyerId: id, buyerName: o.buyerName, listingId, kind: 'loi_issued', at: o.receivedAt });
    if (o.stage === 'accepted') ev.push({ buyerId: id, buyerName: o.buyerName, listingId, kind: 'closed', at: o.receivedAt });
    if (o.stage === 'declined' || o.stage === 'expired') ev.push({ buyerId: id, buyerName: o.buyerName, listingId, kind: 'walked_away', at: o.receivedAt });
  }
  return ev;
}

export interface BuyerResponseStats {
  readonly buyerId: string;
  readonly buyerName: string;
  readonly matched: boolean;
  readonly ndaSigned: boolean;
  readonly loiIssued: boolean;
  readonly closed: boolean;
  readonly walkedAway: boolean;
  readonly timeToNdaDays: number | null;     // from first touch to signed NDA
  readonly timeToLoiDays: number | null;     // from first touch to LOI
  readonly timeToCloseDays: number | null;   // from first touch to close
}

/** Per-buyer response record across the event stream. */
export function aggregateBuyerResponse(events: readonly MandateEvent[]): BuyerResponseStats[] {
  const byBuyer = new Map<string, MandateEvent[]>();
  for (const e of events) {
    const arr = byBuyer.get(e.buyerId) ?? [];
    arr.push(e); byBuyer.set(e.buyerId, arr);
  }
  const out: BuyerResponseStats[] = [];
  for (const [buyerId, evs] of byBuyer) {
    const at = (k: MandateEventKind): string | undefined => evs.filter((e) => e.kind === k && e.at).map((e) => e.at).sort()[0];
    const touch = [at('matched'), at('nda_requested')].filter((x): x is string => !!x).sort()[0];
    const nda = at('nda_signed'), loi = at('loi_issued'), close = at('closed');
    out.push({
      buyerId,
      buyerName: evs[0]!.buyerName,
      matched: evs.some((e) => e.kind === 'matched') || !!at('nda_requested'),
      ndaSigned: !!nda,
      loiIssued: !!loi,
      closed: !!close,
      walkedAway: evs.some((e) => e.kind === 'walked_away'),
      timeToNdaDays: touch && nda ? day(touch, nda) : null,
      timeToLoiDays: touch && loi ? day(touch, loi) : null,
      timeToCloseDays: touch && close ? day(touch, close) : null,
    });
  }
  return out;
}

export interface ProcessFunnel {
  readonly matched: number;
  readonly ndaSigned: number;
  readonly loiIssued: number;
  readonly closed: number;
  readonly walkedAway: number;
  readonly ndaConversionPct: number | null;     // signed / matched
  readonly loiConversionPct: number | null;      // loi / signed
  readonly medianTimeToNdaDays: number | null;
  readonly medianTimeToLoiDays: number | null;
  readonly medianTimeToCloseDays: number | null;
}

/** Population funnel across all buyers in the stream. */
export function processFunnel(stats: readonly BuyerResponseStats[]): ProcessFunnel {
  const matched = stats.filter((s) => s.matched).length;
  const ndaSigned = stats.filter((s) => s.ndaSigned).length;
  const loiIssued = stats.filter((s) => s.loiIssued).length;
  return {
    matched, ndaSigned, loiIssued,
    closed: stats.filter((s) => s.closed).length,
    walkedAway: stats.filter((s) => s.walkedAway).length,
    ndaConversionPct: matched > 0 ? Math.round((ndaSigned / matched) * 100) : null,
    loiConversionPct: ndaSigned > 0 ? Math.round((loiIssued / ndaSigned) * 100) : null,
    medianTimeToNdaDays: median(stats.map((s) => s.timeToNdaDays).filter((x): x is number => x != null)),
    medianTimeToLoiDays: median(stats.map((s) => s.timeToLoiDays).filter((x): x is number => x != null)),
    medianTimeToCloseDays: median(stats.map((s) => s.timeToCloseDays).filter((x): x is number => x != null)),
  };
}
