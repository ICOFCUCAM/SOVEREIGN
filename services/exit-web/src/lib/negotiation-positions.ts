import { NO_POSITIONS, type NegotiationPositions, type PositionValues } from "./documents/transaction-docs";

// ── NEGOTIATING POSITIONS ───────────────────────────────────────────
// The seller's own positions for one company's deal. Seller-internal: kept in this browser,
// never sent to a buyer except as the terms a counter-proposal states. There are no defaults:
// a position the seller has not set is not proposed anywhere (B-9).

const key = (companyId: string): string => `exitos.positions.${companyId}.v1`;

export function loadPositions(companyId: string | null): NegotiationPositions {
  if (!companyId) return NO_POSITIONS;
  try {
    const raw = localStorage.getItem(key(companyId));
    if (!raw) return NO_POSITIONS;
    const p = JSON.parse(raw) as NegotiationPositions;
    return { values: p.values ?? {}, reviewedBy: p.reviewedBy ?? "nobody", ...(p.setAt ? { setAt: p.setAt } : {}) };
  } catch { return NO_POSITIONS; }
}

/** Keep only the positions actually set (finite, in range); an empty field is unset, never zero. */
export function cleanPositions(v: Record<string, unknown>): PositionValues {
  const out: Record<string, number> = {};
  const pctKeys = ["minCashPct", "maxEscrowPct", "maxIndemnityCapPct", "maxEarnoutPct", "reverseBreakFeePct"];
  for (const [k, raw] of Object.entries(v)) {
    if (raw === "" || raw == null) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) continue;
    if (pctKeys.includes(k) && n > 1) continue;
    out[k] = n;
  }
  return out as PositionValues;
}

export function savePositions(companyId: string, values: PositionValues, reviewedBy: NegotiationPositions["reviewedBy"]): NegotiationPositions {
  const p: NegotiationPositions = { values: cleanPositions(values as Record<string, unknown>), reviewedBy, setAt: new Date().toISOString().slice(0, 10) };
  try { localStorage.setItem(key(companyId), JSON.stringify(p)); } catch { /* storage unavailable: positions apply to this session only */ }
  return p;
}
