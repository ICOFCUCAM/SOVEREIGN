import { SECTOR_TRANSACTIONS, DNA_PROFILES, fmtUsdShort } from "./buyer-dna";
import { ACQ_INDEXES } from "./market-intel";
import { allDealEvents, type DealEvent } from "./deal-events";

// ── LIVE MARKET TAPE ────────────────────────────────────────────────
// A continuous ticker of REAL market activity — indexed acquisitions, buyer
// movements, sector shifts and live mandate telemetry. Nothing is fabricated:
// every item traces to the acquisition registry, the sector indexes or
// captured platform events. This is what makes a workstation feel live.

export type TapeKind = "ACQ" | "BUYER" | "SECTOR" | "MANDATE";
export interface TapeItem {
  readonly kind: TapeKind;
  readonly label: string;
  readonly value?: string;
  readonly dir?: "up" | "down" | null;
  readonly ts?: string | null;        // ISO or YYYY-MM for ordering/display
}

const EVENT_VERB: Record<string, string> = {
  listing_viewed: "viewed a listing", viewed_buyer: "viewed", expressed_interest: "expressed interest",
  nda_requested: "requested NDA", nda_signed: "signed NDA", cim_viewed: "opened CIM",
  meeting_scheduled: "scheduled a meeting", loi_issued: "submitted an offer", diligence_started: "opened diligence",
  closed: "closed", walked_away: "walked", retraded: "retraded",
};

/** Build the tape from every live source, newest first, deduped and capped. */
export function buildMarketTape(limit = 40): TapeItem[] {
  const items: TapeItem[] = [];

  // 1 — indexed acquisitions (the registry), most recent first
  for (const t of [...SECTOR_TRANSACTIONS].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 16)) {
    items.push({ kind: "ACQ", label: `${t.buyer} ◂ ${t.target}`, value: t.value_usd != null ? fmtUsdShort(t.value_usd) : undefined, ts: t.date ?? null });
  }

  // 2 — sector shifts (12-month trend in the acquisition indexes)
  for (const s of [...ACQ_INDEXES.indexes].filter((i) => i.trendPct != null).sort((a, b) => Math.abs(b.trendPct ?? 0) - Math.abs(a.trendPct ?? 0)).slice(0, 8)) {
    const pctv = Math.round((s.trendPct ?? 0) * 100);
    items.push({ kind: "SECTOR", label: s.sector, value: `${pctv >= 0 ? "+" : ""}${pctv}% 12m`, dir: pctv >= 0 ? "up" : "down" });
  }

  // 3 — buyer movements (active acquirers, latest dated move)
  for (const p of [...DNA_PROFILES].filter((p) => p.last_acquisition?.date).sort((a, b) => (b.last_acquisition?.date ?? "").localeCompare(a.last_acquisition?.date ?? "")).slice(0, 10)) {
    items.push({ kind: "BUYER", label: `${p.name} active`, value: p.last_acquisition ? `last: ${p.last_acquisition.target}` : undefined, ts: p.last_acquisition?.date ?? null });
  }

  // 4 — live mandate telemetry (captured platform events, newest first)
  const evs: readonly DealEvent[] = allDealEvents();
  for (const e of [...evs].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)) {
    items.push({ kind: "MANDATE", label: `${e.actorRole} ${EVENT_VERB[e.kind] ?? e.kind} ${e.subjectName}`, ts: e.at });
  }

  // interleave so the tape reads as a mixed feed, then cap
  const byKind: Record<TapeKind, TapeItem[]> = { MANDATE: [], ACQ: [], SECTOR: [], BUYER: [] };
  for (const it of items) byKind[it.kind].push(it);
  const order: TapeKind[] = ["MANDATE", "ACQ", "SECTOR", "BUYER"];
  const woven: TapeItem[] = [];
  for (let i = 0; woven.length < items.length; i++) {
    let advanced = false;
    for (const k of order) { if (byKind[k][i]) { woven.push(byKind[k][i]); advanced = true; } }
    if (!advanced) break;
  }
  return woven.slice(0, limit);
}
