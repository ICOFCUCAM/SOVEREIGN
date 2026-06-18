// ── DEAL-FLOW TELEMETRY · the capture spine ─────────────────────────
// The moat is transaction data — behavior ExitOS generates that no one can
// buy or scrape. This is the layer that captures every deal-flow action
// (view → interest → NDA → CIM → meeting → LOI → close) forever, attributed
// to the actor. It writes through a swappable PersistenceAdapter: a
// localStorage adapter today, a network adapter when the backend ships —
// the capture API and the consumers never change. Nothing is fabricated;
// it records only what actually happened on the platform.

export type DealEventKind =
  | "listing_viewed" | "viewed_buyer" | "expressed_interest" | "added_to_outreach"
  | "nda_requested" | "nda_signed" | "cim_viewed" | "meeting_scheduled"
  | "loi_issued" | "diligence_started" | "closed" | "walked_away" | "retraded";

export interface DealEvent {
  readonly id: string;
  readonly at: string;                 // ISO timestamp
  readonly actorRole: string;          // founder | buyer | advisor
  readonly kind: DealEventKind;
  readonly subjectType: "buyer" | "listing";
  readonly subjectId: string;
  readonly subjectName: string;
}

// the ordered deal-flow funnel — Phase-5 canonical stages
export const DEAL_STAGES: ReadonlyArray<{ kind: DealEventKind; label: string }> = [
  { kind: "listing_viewed", label: "Listing viewed" },
  { kind: "expressed_interest", label: "Interest" },
  { kind: "nda_requested", label: "NDA requested" },
  { kind: "nda_signed", label: "NDA signed" },
  { kind: "cim_viewed", label: "CIM viewed" },
  { kind: "meeting_scheduled", label: "Meeting" },
  { kind: "loi_issued", label: "LOI" },
  { kind: "diligence_started", label: "Diligence" },
  { kind: "closed", label: "Close" },
];

// ── persistence adapter (localStorage now, backend-ready) ───────────
export interface PersistenceAdapter {
  read(): DealEvent[];
  write(events: DealEvent[]): void;
}

const KEY = "exitos.dealflow.v1";
const localStorageAdapter: PersistenceAdapter = {
  read() { try { return JSON.parse(globalThis.localStorage?.getItem(KEY) ?? "[]") as DealEvent[]; } catch { return []; } },
  write(e) { try { globalThis.localStorage?.setItem(KEY, JSON.stringify(e)); } catch { /* in-memory only */ } },
};

let adapter: PersistenceAdapter = localStorageAdapter;
/** Swap in a network adapter when the exit-api ships — capture API unchanged. */
export function setPersistenceAdapter(a: PersistenceAdapter): void { adapter = a; cache = null; emit(); }

let cache: DealEvent[] | null = null;
const listeners = new Set<() => void>();
const emit = (): void => listeners.forEach((l) => l());
function load(): DealEvent[] { if (cache == null) cache = adapter.read(); return cache; }

export function captureDealEvent(p: Omit<DealEvent, "id" | "at"> & { at?: string }): DealEvent {
  const e: DealEvent = { id: `de-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: p.at ?? new Date().toISOString(), actorRole: p.actorRole, kind: p.kind, subjectType: p.subjectType, subjectId: p.subjectId, subjectName: p.subjectName };
  cache = [...load(), e];
  adapter.write(cache);
  emit();
  return e;
}

export function allDealEvents(): readonly DealEvent[] { return load(); }
export function subscribe(l: () => void): () => void { listeners.add(l); return () => void listeners.delete(l); }
export function clearDealEvents(): void { cache = []; adapter.write(cache); emit(); }

// ── derived views ───────────────────────────────────────────────────
export interface FunnelStage { readonly kind: DealEventKind; readonly label: string; readonly count: number }
export function dealFlowFunnel(events: readonly DealEvent[] = load()): FunnelStage[] {
  return DEAL_STAGES.map((s) => ({ ...s, count: new Set(events.filter((e) => e.kind === s.kind).map((e) => e.subjectId)).size }));
}

/** Distinct subjects that reached at least the given stage. */
export function subjectsAtStage(kind: DealEventKind, events: readonly DealEvent[] = load()): string[] {
  return [...new Set(events.filter((e) => e.kind === kind).map((e) => e.subjectId))];
}

// ── observed buyer behavior (the moat: learned from real events) ────
// A buyer's behavior profile generated from captured outcomes. Aggregated
// across founders/listings (with a backend), this is proprietary data no
// one else has — "every NDA improves future buyer scoring".
export interface BuyerActivity {
  readonly engagements: number;        // times engaged (viewed / interested)
  readonly ndaRequested: number;
  readonly ndaSigned: number;
  readonly loiIssued: number;
  readonly closed: number;
  readonly walked: number;
  readonly retraded: number;
  readonly ndaConversionPct: number | null;   // signed / requested
  readonly loiConversionPct: number | null;   // loi / signed
  readonly closeRatePct: number | null;        // closed / loi
  readonly hasActivity: boolean;
}

export function buyerActivity(subjectId: string, events: readonly DealEvent[] = load()): BuyerActivity {
  const mine = events.filter((e) => e.subjectId === subjectId);
  const n = (k: DealEventKind): number => mine.filter((e) => e.kind === k).length;
  const ndaRequested = n("nda_requested"), ndaSigned = n("nda_signed"), loiIssued = n("loi_issued"), closed = n("closed");
  const engagements = n("viewed_buyer") + n("listing_viewed") + n("expressed_interest");
  return {
    engagements,
    ndaRequested, ndaSigned, loiIssued, closed,
    walked: n("walked_away"), retraded: n("retraded"),
    ndaConversionPct: ndaRequested > 0 ? Math.round((ndaSigned / ndaRequested) * 100) : null,
    loiConversionPct: ndaSigned > 0 ? Math.round((loiIssued / ndaSigned) * 100) : null,
    closeRatePct: loiIssued > 0 ? Math.round((closed / loiIssued) * 100) : null,
    hasActivity: mine.length > 0,
  };
}
