// ExitOS · per-buyer live stats.
//
// Returns the tenant's measured-from-real-deals aggregate per buyer,
// which the SPA merges over the static snapshot from BUYER_REGISTRY
// to sharpen the Recommendation Engine. Three sources joined:
//
//   exit_buyer_funnel       → close rate, avg days to close
//   exit_offer_events       → initial LOI prices (stage = 'received'|'scored')
//   exit_close_events       → final close prices
//
// Retrade = (final - initial) / initial, averaged per buyer across
// runs where both an offer and a close exist for that buyer.

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
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

interface FunnelRow {
  buyer_name: string;
  closed_n: number;
  walked_n: number;
  close_rate_pct: number | null;
  avg_days_to_close: number | null;
}

interface OfferRow {
  run_id: string | null;
  buyer_name: string;
  headline_price_usd: number;
}
interface CloseRow {
  run_id: string | null;
  buyer_name: string | null;
  final_price_usd: number | null;
}

function mean(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')   return err(405, 'method not allowed');

  let body: { tenantId?: string };
  try { body = await req.json(); } catch { return err(400, 'invalid json'); }
  const tenantId = String(body.tenantId ?? '');
  if (!tenantId || !isUuid(tenantId)) return err(400, 'tenantId required (uuid)');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return err(500, 'server not configured');
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Funnel rollup per buyer.
  const funnel = await admin.from('exit_buyer_funnel').select('*').eq('tenant_id', tenantId);
  if (funnel.error) return err(500, funnel.error.message);
  const funnelRows = (funnel.data ?? []) as FunnelRow[];

  // Offer + close events for retrade detection.
  const offers = await admin.from('exit_offer_events')
    .select('run_id, buyer_name, headline_price_usd')
    .eq('tenant_id', tenantId);
  if (offers.error) return err(500, offers.error.message);

  const closes = await admin.from('exit_close_events')
    .select('run_id, buyer_name, final_price_usd')
    .eq('tenant_id', tenantId)
    .not('final_price_usd', 'is', null)
    .not('buyer_name', 'is', null);
  if (closes.error) return err(500, closes.error.message);

  // Compute retrade per (buyer, run): final / initial - 1.
  // Initial = min(headline_price_usd) for that (buyer, run) offer set
  // — the earliest LOI is typically the highest in retrade scenarios.
  const initialByKey = new Map<string, number>();              // key: buyer|run → initial LOI
  for (const o of (offers.data ?? []) as OfferRow[]) {
    if (!o.run_id) continue;
    const key = `${o.buyer_name}|${o.run_id}`;
    const prior = initialByKey.get(key);
    // Track the HIGHEST offer per (buyer, run) as "initial" — retrade
    // is measured from the peak LOI down to the final close.
    if (prior == null || o.headline_price_usd > prior) initialByKey.set(key, o.headline_price_usd);
  }
  const retradesByBuyer = new Map<string, number[]>();
  for (const c of (closes.data ?? []) as CloseRow[]) {
    if (!c.run_id || !c.buyer_name || c.final_price_usd == null) continue;
    const initial = initialByKey.get(`${c.buyer_name}|${c.run_id}`);
    if (initial == null || initial <= 0) continue;
    const pct = (c.final_price_usd - initial) / initial;
    const bucket = retradesByBuyer.get(c.buyer_name) ?? [];
    bucket.push(pct);
    retradesByBuyer.set(c.buyer_name, bucket);
  }

  // Merge funnel + retrade, keyed by buyer_name.
  const byBuyerName = new Map<string, {
    buyerName: string;
    closeRatePct: number | null;
    closedCount: number;
    walkedCount: number;
    avgDaysToClose: number | null;
    avgRetradePct: number | null;
    retradeSampleSize: number;
  }>();

  for (const f of funnelRows) {
    byBuyerName.set(f.buyer_name, {
      buyerName: f.buyer_name,
      closeRatePct: f.close_rate_pct == null ? null : Number(f.close_rate_pct),
      closedCount: Number(f.closed_n),
      walkedCount: Number(f.walked_n),
      avgDaysToClose: f.avg_days_to_close == null ? null : Number(f.avg_days_to_close),
      avgRetradePct: null,
      retradeSampleSize: 0,
    });
  }
  for (const [buyerName, vals] of retradesByBuyer) {
    const existing = byBuyerName.get(buyerName) ?? {
      buyerName,
      closeRatePct: null, closedCount: 0, walkedCount: 0,
      avgDaysToClose: null, avgRetradePct: null, retradeSampleSize: 0,
    };
    existing.avgRetradePct = mean(vals);
    existing.retradeSampleSize = vals.length;
    byBuyerName.set(buyerName, existing);
  }

  const stats = Array.from(byBuyerName.values());

  return new Response(JSON.stringify({ ok: true, stats }), {
    status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});
