// ExitOS telemetry · event ingestion.
//
// Accepts a batch of events from the SPA and routes each event to the
// right table (exit_runs, exit_run_steps, exit_offer_events,
// exit_close_events, exit_telemetry_events). Auth: anon JWT (demo).
// Production tightens this to founder-tenant JWT and verifies
// tenantId matches sub.
//
// Body:
//   {
//     tenantId: uuid,
//     events: [
//       { kind: 'run_started' | 'run_completed' | 'run_step' |
//                'offer' | 'close' | 'telemetry', ... }
//     ]
//   }
//
// Returns: { ok: true, accepted: <count>, errors?: <details[]> }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_EVENTS_PER_BATCH = 200;

type EventKind = 'run_started' | 'run_completed' | 'run_step' | 'offer' | 'close' | 'telemetry';

interface BaseEvent { kind: EventKind }

interface RunStartedEvent extends BaseEvent {
  kind: 'run_started';
  clientRunId: string;
  startedAt: string;
  stepsTotal: number;
  appVersion?: string;
}

interface RunCompletedEvent extends BaseEvent {
  kind: 'run_completed';
  clientRunId: string;
  status: 'complete' | 'errored';
  finishedAt: string;
  durationMs: number;
  stepsCompleted: number;
  valuation?: { low?: number; mid?: number; high?: number };
  readiness?: { score?: number; band?: string };
  qualifiedBuyers?: number;
  buyersByType?: Record<string, number>;
  artifactsSummary?: Record<string, unknown>;
}

interface RunStepEvent extends BaseEvent {
  kind: 'run_step';
  clientRunId: string;
  stepId: string;
  stepIndex: number;
  status: 'pending' | 'running' | 'done' | 'error';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  summary?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface OfferEvent extends BaseEvent {
  kind: 'offer';
  offerId: string;
  buyerName: string;
  buyerType: string;
  stage: string;
  occurredAt: string;
  headlinePriceUsd: number;
  cashPct?: number;
  stockPct?: number;
  earnoutPct?: number;
  terms?: unknown;
  evaluationScore?: number;
  reservationViolated?: boolean;
  netNpvUsd?: number;
  clientRunId?: string;
  metadata?: Record<string, unknown>;
}

interface CloseEvent extends BaseEvent {
  kind: 'close';
  outcome: 'closed_strategic' | 'closed_pe' | 'closed_vc_secondary' | 'closed_family_office' | 'walked_away' | 'expired' | 'no_deal';
  closedAt: string;
  buyerName?: string;
  buyerType?: string;
  finalPriceUsd?: number;
  finalCashPct?: number;
  finalStockPct?: number;
  finalEarnoutPct?: number;
  clientRunId?: string;
  metadata?: Record<string, unknown>;
}

interface TelemetryEvent extends BaseEvent {
  kind: 'telemetry';
  eventType: string;
  occurredAt?: string;
  sessionId?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

type IngestEvent = RunStartedEvent | RunCompletedEvent | RunStepEvent | OfferEvent | CloseEvent | TelemetryEvent;

function err(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')   return err(405, 'method not allowed');

  let body: { tenantId?: string; events?: IngestEvent[] };
  try { body = await req.json(); } catch { return err(400, 'invalid json'); }

  const tenantId = String(body.tenantId ?? '');
  const events = Array.isArray(body.events) ? body.events : [];

  if (!tenantId || !isUuid(tenantId)) return err(400, 'tenantId required (uuid)');
  if (events.length === 0)            return err(400, 'events array required');
  if (events.length > MAX_EVENTS_PER_BATCH) return err(413, `max ${MAX_EVENTS_PER_BATCH} events per batch`);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return err(500, 'server not configured');
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Confirm tenant exists — auto-create from a minimal stub for the
  // demo tenant; production replaces this with a hard 404.
  const tenantCheck = await admin.from('exit_tenants').select('id').eq('id', tenantId).maybeSingle();
  if (!tenantCheck.data) return err(404, 'unknown tenant');

  // Cache client_run_id → exit_runs.id within this batch so step
  // events arriving in the same call can resolve their FK.
  const runIdCache = new Map<string, string>();

  async function resolveRunId(clientRunId: string): Promise<string | null> {
    const cached = runIdCache.get(clientRunId);
    if (cached) return cached;
    const found = await admin.from('exit_runs').select('id').eq('tenant_id', tenantId).eq('client_run_id', clientRunId).maybeSingle();
    if (found.data) {
      runIdCache.set(clientRunId, found.data.id as string);
      return found.data.id as string;
    }
    return null;
  }

  const errors: { index: number; error: string }[] = [];
  let accepted = 0;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    try {
      if (ev.kind === 'run_started') {
        const ins = await admin.from('exit_runs').insert({
          tenant_id: tenantId,
          client_run_id: ev.clientRunId,
          status: 'running',
          started_at: ev.startedAt,
          steps_total: ev.stepsTotal ?? 10,
          ...(ev.appVersion ? { app_version: ev.appVersion } : {}),
        }).select('id').single();
        if (ins.error) throw ins.error;
        runIdCache.set(ev.clientRunId, ins.data.id as string);
      } else if (ev.kind === 'run_completed') {
        const upd = await admin.from('exit_runs').update({
          status: ev.status,
          finished_at: ev.finishedAt,
          duration_ms: ev.durationMs,
          steps_completed: ev.stepsCompleted,
          ...(ev.valuation?.low  != null ? { valuation_low_usd:  ev.valuation.low }  : {}),
          ...(ev.valuation?.mid  != null ? { valuation_mid_usd:  ev.valuation.mid }  : {}),
          ...(ev.valuation?.high != null ? { valuation_high_usd: ev.valuation.high } : {}),
          ...(ev.readiness?.score != null ? { readiness_score: ev.readiness.score } : {}),
          ...(ev.readiness?.band  != null ? { readiness_band:  ev.readiness.band  } : {}),
          ...(ev.qualifiedBuyers != null ? { qualified_buyers: ev.qualifiedBuyers } : {}),
          ...(ev.buyersByType    != null ? { buyers_by_type: ev.buyersByType }     : {}),
          ...(ev.artifactsSummary != null ? { artifacts_summary: ev.artifactsSummary } : {}),
        }).eq('tenant_id', tenantId).eq('client_run_id', ev.clientRunId);
        if (upd.error) throw upd.error;
      } else if (ev.kind === 'run_step') {
        const runId = await resolveRunId(ev.clientRunId);
        if (!runId) throw new Error(`run_step references unknown clientRunId ${ev.clientRunId}`);
        const ins = await admin.from('exit_run_steps').insert({
          run_id: runId,
          tenant_id: tenantId,
          step_id: ev.stepId,
          step_index: ev.stepIndex,
          status: ev.status,
          ...(ev.startedAt  ? { started_at: ev.startedAt }   : {}),
          ...(ev.finishedAt ? { finished_at: ev.finishedAt } : {}),
          ...(ev.durationMs != null ? { duration_ms: ev.durationMs } : {}),
          ...(ev.summary    ? { summary: ev.summary } : {}),
          ...(ev.error      ? { error: ev.error }     : {}),
          ...(ev.metadata   ? { metadata: ev.metadata } : {}),
        });
        if (ins.error) throw ins.error;
      } else if (ev.kind === 'offer') {
        let runId: string | null = null;
        if (ev.clientRunId) runId = await resolveRunId(ev.clientRunId);
        const ins = await admin.from('exit_offer_events').insert({
          tenant_id: tenantId,
          ...(runId ? { run_id: runId } : {}),
          offer_id: ev.offerId,
          buyer_name: ev.buyerName,
          buyer_type: ev.buyerType,
          stage: ev.stage,
          occurred_at: ev.occurredAt,
          headline_price_usd: ev.headlinePriceUsd,
          ...(ev.cashPct    != null ? { cash_pct:    ev.cashPct }    : {}),
          ...(ev.stockPct   != null ? { stock_pct:   ev.stockPct }   : {}),
          ...(ev.earnoutPct != null ? { earnout_pct: ev.earnoutPct } : {}),
          ...(ev.terms      != null ? { terms: ev.terms } : {}),
          ...(ev.evaluationScore != null ? { evaluation_score: ev.evaluationScore } : {}),
          ...(ev.reservationViolated != null ? { reservation_violated: ev.reservationViolated } : {}),
          ...(ev.netNpvUsd != null ? { net_npv_usd: ev.netNpvUsd } : {}),
          ...(ev.metadata  != null ? { metadata: ev.metadata } : {}),
        });
        if (ins.error) throw ins.error;
      } else if (ev.kind === 'close') {
        let runId: string | null = null;
        let predictedMid: number | null = null;
        if (ev.clientRunId) {
          runId = await resolveRunId(ev.clientRunId);
          if (runId) {
            const r = await admin.from('exit_runs').select('valuation_mid_usd').eq('id', runId).single();
            predictedMid = (r.data?.valuation_mid_usd as number | null) ?? null;
          }
        }
        const pctSpread = (predictedMid != null && ev.finalPriceUsd != null && predictedMid > 0)
          ? (ev.finalPriceUsd - predictedMid) / predictedMid
          : null;
        const ins = await admin.from('exit_close_events').insert({
          tenant_id: tenantId,
          ...(runId ? { run_id: runId } : {}),
          outcome: ev.outcome,
          closed_at: ev.closedAt,
          ...(ev.buyerName ? { buyer_name: ev.buyerName } : {}),
          ...(ev.buyerType ? { buyer_type: ev.buyerType } : {}),
          ...(ev.finalPriceUsd   != null ? { final_price_usd:   ev.finalPriceUsd }   : {}),
          ...(ev.finalCashPct    != null ? { final_cash_pct:    ev.finalCashPct }    : {}),
          ...(ev.finalStockPct   != null ? { final_stock_pct:   ev.finalStockPct }   : {}),
          ...(ev.finalEarnoutPct != null ? { final_earnout_pct: ev.finalEarnoutPct } : {}),
          ...(predictedMid != null ? { predicted_valuation_mid_usd: predictedMid } : {}),
          ...(pctSpread    != null ? { predicted_vs_realized_pct: pctSpread } : {}),
          ...(ev.metadata  != null ? { metadata: ev.metadata } : {}),
        });
        if (ins.error) throw ins.error;
      } else if (ev.kind === 'telemetry') {
        const ins = await admin.from('exit_telemetry_events').insert({
          tenant_id: tenantId,
          event_type: ev.eventType,
          ...(ev.occurredAt ? { occurred_at: ev.occurredAt } : {}),
          ...(ev.sessionId  ? { session_id:  ev.sessionId }  : {}),
          ...(ev.page       ? { page: ev.page } : {}),
          ...(ev.metadata   ? { metadata: ev.metadata } : {}),
        });
        if (ins.error) throw ins.error;
      } else {
        throw new Error(`unknown event kind: ${(ev as { kind?: string }).kind}`);
      }
      accepted++;
    } catch (e) {
      errors.push({ index: i, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ ok: true, accepted, errors: errors.length > 0 ? errors : undefined }), {
    status: 200,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});
