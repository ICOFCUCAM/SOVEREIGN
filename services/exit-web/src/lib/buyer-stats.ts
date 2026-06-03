// Live per-buyer stats from the tenant's own deal history. Returned
// by the exit-buyer-stats edge function (RLS-locked tables, service-
// role internally). Merged into the static buyer registry by
// mergeLiveStatsIntoCandidates() so the Recommendation Engine's
// expected outcomes drift toward measured tenant data as it accrues.

import {
  computeExpectedOutcome, type BuyerCandidate, type BuyerDealOutcomeRollup,
} from "@exit/engines";
import { DEMO_TENANT_ID } from "./data-room";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

export interface BuyerLiveStat {
  readonly buyerName:        string;
  readonly closeRatePct:     number | null;
  readonly closedCount:      number;
  readonly walkedCount:      number;
  readonly avgDaysToClose:   number | null;
  readonly avgRetradePct:    number | null;
  readonly retradeSampleSize: number;
}

interface Response { ok: boolean; stats?: BuyerLiveStat[]; error?: string }

export async function fetchBuyerStats(tenantId: string = DEMO_TENANT_ID): Promise<readonly BuyerLiveStat[]> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/exit-buyer-stats`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ tenantId }),
  });
  const json = (await res.json()) as Response;
  if (!res.ok || !json.ok) throw new Error(json.error ?? `stats fetch failed: ${res.status}`);
  return json.stats ?? [];
}

// Merge live stats into the candidate list. For each candidate with a
// matching live stat: override the snapshot outcomes (close rate, avg
// close days, retrade) and recompute expectedOutcome. Live stats land
// at confidence tier 'verified' on the underlying rollup so the
// confidence chip flips green when real data exists.
export function mergeLiveStatsIntoCandidates(
  candidates: readonly BuyerCandidate[],
  liveStats: readonly BuyerLiveStat[],
  impliedPriceUsd: number,
): BuyerCandidate[] {
  if (liveStats.length === 0) return [...candidates];
  const byName = new Map(liveStats.map((s) => [s.buyerName, s]));
  return candidates.map((c) => {
    const live = byName.get(c.buyer.name);
    if (!live || (live.closedCount === 0 && live.retradeSampleSize === 0)) return c;
    const mergedOutcomes: BuyerDealOutcomeRollup = {
      ...c.outcomes,
      aggregateTier: "verified",
      ...(live.closeRatePct != null    ? { closeRatePct: live.closeRatePct } : {}),
      ...(live.avgDaysToClose != null  ? { avgCloseDays: Math.round(live.avgDaysToClose), medianCloseDays: Math.round(live.avgDaysToClose) } : {}),
      ...(live.avgRetradePct != null   ? { avgRetradePct: live.avgRetradePct } : {}),
      closedCount:      Math.max(c.outcomes.closedCount, live.closedCount),
      withdrawnCount:   Math.max(c.outcomes.withdrawnCount, live.walkedCount),
      retradeSampleSize: live.retradeSampleSize,
    };
    return {
      ...c,
      outcomes: mergedOutcomes,
      expectedOutcome: computeExpectedOutcome(c.buyer, mergedOutcomes, impliedPriceUsd),
    };
  });
}
