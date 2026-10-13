// ExitOS · calibration summary.
//
// Returns the prediction-vs-realized aggregates the internal
// Calibration Dashboard reads. Service-role inside the function
// bypasses RLS on exit_runs / exit_close_events / exit_calibration
// and returns JSON aggregates (no row-level data).
//
// Auth: the signed-in user's access token; the tenant is that user.
// Returns: {
//   ok: true,
//   summary: {
//     totalRuns, totalCloses,
//     meanErrorPct, medianErrorPct, mae, rmse,
//     bySector: [{ sector, n, meanErrorPct }],
//     byBuyerType: [{ buyerType, n, meanErrorPct }],
//     recent: [{ runId, predictedMidUsd, realizedPriceUsd, errorPct, outcome, daysFromRunStart }]
//   }
// }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status, headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

interface CalibrationRow {
  run_id: string;
  predicted_mid_usd: number | null;
  realized_price_usd: number | null;
  predicted_vs_realized_pct: number | null;
  outcome: string | null;
  buyer_type: string | null;
  days_from_run_start: number | null;
  readiness_score: number | null;
  predicted_at: string;
  realized_at: string | null;
}

function mean(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// The tenant is the signed-in user, read from their own access token — never
// from the request body or query, so one company cannot reach another's room.
// The public anon key is not a user and is refused.
async function tenantOf(req: Request, admin: ReturnType<typeof createClient>): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  const id = data.user.id;
  // the data-room rows hang off exit_tenants; a new account gets its row here
  await admin.from('exit_tenants').upsert(
    { id, company_name: 'Unnamed company', company_sector: 'unspecified', jurisdiction: 'unspecified' },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  return id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')   return err(405, 'method not allowed');


  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return err(500, 'server not configured');
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  // the tenant is the signed-in user (a tenantId in the body is ignored)
  const tenantId = await tenantOf(req, admin);
  if (!tenantId) return err(401, 'sign in to read calibration');

  // Total runs (denominator for any "of X runs, Y closed" stats).
  const runsCount = await admin.from('exit_runs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (runsCount.error) return err(500, runsCount.error.message);

  // Pull the calibration view rows we have closes for.
  // Also fetch the tenant's company_sector for the by-sector breakdown.
  const tenant = await admin.from('exit_tenants').select('company_sector').eq('id', tenantId).maybeSingle();
  const tenantSector = tenant.data?.company_sector ?? 'unknown';

  const cal = await admin.from('exit_calibration')
    .select('*')
    .eq('tenant_id', tenantId)
    .not('realized_at', 'is', null)
    .order('realized_at', { ascending: false })
    .limit(200);
  if (cal.error) return err(500, cal.error.message);
  const rows = (cal.data ?? []) as CalibrationRow[];

  const errs = rows
    .map((r) => r.predicted_vs_realized_pct)
    .filter((p): p is number => p != null);

  const meanErrorPct   = mean(errs);
  const medianErrorPct = median(errs);
  const mae  = errs.length === 0 ? null : mean(errs.map(Math.abs));
  const rmse = errs.length === 0 ? null : Math.sqrt(mean(errs.map((e) => e * e))!);

  // By-sector breakdown — single tenant for now, so this collapses
  // to one row, but the shape is forward-compatible for the cross-
  // tenant view we add when the moat fills out.
  const bySector = errs.length === 0 ? [] : [{
    sector: tenantSector,
    n: errs.length,
    meanErrorPct,
  }];

  // By buyer-type — group rows by buyer_type and compute mean error.
  const byBuyerTypeMap = new Map<string, number[]>();
  for (const r of rows) {
    const bt = r.buyer_type ?? 'unknown';
    const e  = r.predicted_vs_realized_pct;
    if (e == null) continue;
    const bucket = byBuyerTypeMap.get(bt) ?? [];
    bucket.push(e);
    byBuyerTypeMap.set(bt, bucket);
  }
  const byBuyerType = Array.from(byBuyerTypeMap.entries()).map(([buyerType, vals]) => ({
    buyerType, n: vals.length, meanErrorPct: mean(vals)!,
  })).sort((a, b) => b.n - a.n);

  const recent = rows.slice(0, 20).map((r) => ({
    runId:                  r.run_id,
    predictedMidUsd:        r.predicted_mid_usd,
    realizedPriceUsd:       r.realized_price_usd,
    errorPct:               r.predicted_vs_realized_pct,
    outcome:                r.outcome,
    buyerType:              r.buyer_type,
    daysFromRunStart:       r.days_from_run_start,
    readinessScore:         r.readiness_score,
    predictedAt:            r.predicted_at,
    realizedAt:             r.realized_at,
  }));

  return new Response(JSON.stringify({
    ok: true,
    summary: {
      totalRuns:        runsCount.count ?? 0,
      totalCloses:      errs.length,
      meanErrorPct,
      medianErrorPct,
      mae,
      rmse,
      bySector,
      byBuyerType,
      recent,
    },
  }), {
    status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});
