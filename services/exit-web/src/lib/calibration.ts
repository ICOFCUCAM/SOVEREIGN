// Calibration client. Wraps the exit-calibration edge function which
// returns aggregated prediction-vs-realized stats from exit_runs +
// exit_close_events (RLS-locked; service-role inside the function).

import { DEMO_TENANT_ID } from "./data-room";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

export interface CalibrationRecent {
  readonly runId: string;
  readonly predictedMidUsd: number | null;
  readonly realizedPriceUsd: number | null;
  readonly errorPct: number | null;
  readonly outcome: string | null;
  readonly buyerType: string | null;
  readonly daysFromRunStart: number | null;
  readonly readinessScore: number | null;
  readonly predictedAt: string;
  readonly realizedAt: string | null;
}

export interface CalibrationSummary {
  readonly totalRuns:      number;
  readonly totalCloses:    number;
  readonly meanErrorPct:   number | null;
  readonly medianErrorPct: number | null;
  readonly mae:            number | null;
  readonly rmse:           number | null;
  readonly bySector:       ReadonlyArray<{ sector: string; n: number; meanErrorPct: number | null }>;
  readonly byBuyerType:    ReadonlyArray<{ buyerType: string; n: number; meanErrorPct: number }>;
  readonly recent:         readonly CalibrationRecent[];
}

interface Response { ok: boolean; summary?: CalibrationSummary; error?: string }

export async function fetchCalibration(tenantId: string = DEMO_TENANT_ID): Promise<CalibrationSummary> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/exit-calibration`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ tenantId }),
  });
  const json = (await res.json()) as Response;
  if (!res.ok || !json.ok || !json.summary) {
    throw new Error(json.error ?? `calibration fetch failed: ${res.status}`);
  }
  return json.summary;
}
