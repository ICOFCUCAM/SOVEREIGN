// ExitOS telemetry client. Wraps the exit-telemetry edge function with
// a typed batch interface, a small in-memory queue, and best-effort
// flush semantics — failures never block the SPA. The console fires
// events from runtime hot paths (One-Click Exit start/finish/per-step,
// offer evaluations, page views) and we accumulate the calibration
// surface that powers the Acquisition Intelligence Engine.

import { DEMO_TENANT_ID } from "./data-room";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

const APP_VERSION = "0.1.0";
const FLUSH_INTERVAL_MS = 1500;
const MAX_BATCH = 50;

export type EventKind = "run_started" | "run_completed" | "run_step" | "offer" | "close" | "telemetry" | "buyer_response";

// Source tier — defaults to system_generated for SPA-emitted events.
// Founder-reported updates (e.g. "I just got a verbal LOI") tag
// founder_reported so calibration weighting can de-prioritize them.
export type EventSource = "founder_reported" | "broker_reported" | "verified_filing" | "legal_doc" | "system_generated";

export interface RunStartedEvent { kind: "run_started"; clientRunId: string; startedAt: string; stepsTotal: number; appVersion?: string; source?: EventSource }
export interface RunCompletedEvent {
  kind: "run_completed";
  clientRunId: string;
  status: "complete" | "errored";
  finishedAt: string;
  durationMs: number;
  stepsCompleted: number;
  valuation?: { low?: number; mid?: number; high?: number };
  readiness?: { score?: number; band?: string };
  qualifiedBuyers?: number;
  buyersByType?: Record<string, number>;
  artifactsSummary?: Record<string, unknown>;
  source?: EventSource;
}
export interface RunStepEvent {
  kind: "run_step";
  clientRunId: string;
  stepId: string;
  stepIndex: number;
  status: "pending" | "running" | "done" | "error";
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  summary?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  source?: EventSource;
}
export interface OfferEventInput {
  kind: "offer";
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
  source?: EventSource;
}
export interface CloseEventInput {
  kind: "close";
  outcome: "closed_strategic" | "closed_pe" | "closed_vc_secondary" | "closed_family_office" | "walked_away" | "expired" | "no_deal";
  closedAt: string;
  buyerName?: string;
  buyerType?: string;
  finalPriceUsd?: number;
  finalCashPct?: number;
  finalStockPct?: number;
  finalEarnoutPct?: number;
  clientRunId?: string;
  metadata?: Record<string, unknown>;
  source?: EventSource;
}
export interface TelemetryEventInput {
  kind: "telemetry";
  eventType: string;
  occurredAt?: string;
  sessionId?: string;
  page?: string;
  metadata?: Record<string, unknown>;
  source?: EventSource;
}

export type BuyerResponseStage =
  | "outreach" | "nda_issued" | "nda_signed" | "teaser_sent"
  | "cim_requested" | "cim_sent" | "loi_received" | "loi_countered"
  | "diligence_started" | "diligence_complete" | "closed" | "walked" | "declined";

export interface BuyerResponseEventInput {
  kind: "buyer_response";
  buyerId: string;
  buyerName: string;
  listingId?: string;
  clientRunId?: string;
  stage: BuyerResponseStage;
  occurredAt: string;
  latencyDays?: number;
  metadata?: Record<string, unknown>;
  source?: EventSource;
}

export type TelemetryEvent =
  | RunStartedEvent | RunCompletedEvent | RunStepEvent
  | OfferEventInput | CloseEventInput | TelemetryEventInput
  | BuyerResponseEventInput;

const queue: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let tenantId: string = DEMO_TENANT_ID;

export function setTenant(id: string): void { tenantId = id; }

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { void flush(); }, FLUSH_INTERVAL_MS);
}

export async function flush(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/exit-telemetry`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({ tenantId, events: batch }),
    });
    if (!res.ok && typeof console !== "undefined") {
      // Telemetry must never throw — log + drop.
      const detail = await res.text().catch(() => "");
      console.warn("telemetry batch failed", res.status, detail);
    }
  } catch (err) {
    if (typeof console !== "undefined") console.warn("telemetry batch dropped", err);
  }
  if (queue.length > 0) scheduleFlush();
}

export function emit(event: TelemetryEvent): void {
  queue.push(event);
  if (queue.length >= MAX_BATCH) {
    void flush();
  } else {
    scheduleFlush();
  }
}

export function emitRunStarted(clientRunId: string, stepsTotal: number): void {
  emit({ kind: "run_started", clientRunId, startedAt: new Date().toISOString(), stepsTotal, appVersion: APP_VERSION });
}

export function emitRunStep(
  clientRunId: string, stepId: string, stepIndex: number,
  status: RunStepEvent["status"], summary?: string, durationMs?: number, error?: string,
): void {
  emit({
    kind: "run_step", clientRunId, stepId, stepIndex, status,
    ...(status === "running" ? { startedAt: new Date().toISOString() } : {}),
    ...(status === "done" || status === "error" ? { finishedAt: new Date().toISOString() } : {}),
    ...(summary    ? { summary } : {}),
    ...(durationMs != null ? { durationMs } : {}),
    ...(error      ? { error } : {}),
  });
}

export function emitRunCompleted(
  clientRunId: string,
  status: "complete" | "errored",
  finishedAt: string,
  durationMs: number,
  stepsCompleted: number,
  payload: {
    valuation?: { low?: number; mid?: number; high?: number };
    readiness?: { score?: number; band?: string };
    qualifiedBuyers?: number;
    buyersByType?: Record<string, number>;
    artifactsSummary?: Record<string, unknown>;
  } = {},
): void {
  emit({
    kind: "run_completed", clientRunId, status, finishedAt, durationMs, stepsCompleted,
    ...payload,
  });
}

export function emitOffer(input: Omit<OfferEventInput, "kind">): void {
  emit({ kind: "offer", ...input });
}

export function emitClose(input: Omit<CloseEventInput, "kind">): void {
  emit({ kind: "close", ...input });
}

export function emitTelemetry(eventType: string, metadata?: Record<string, unknown>, page?: string): void {
  emit({
    kind: "telemetry", eventType,
    occurredAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
    ...(page     ? { page } : {}),
  });
}

export function emitBuyerResponse(input: Omit<BuyerResponseEventInput, "kind">): void {
  emit({ kind: "buyer_response", ...input });
}

// Flush on tab close — best effort.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => { void flush(); });
}
