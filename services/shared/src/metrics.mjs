// Sovereign Dispatch — in-process metrics + structured logging (Epic 10).
//
// Dependency-free, content-free observability. Counters/durations are kept in
// memory and exposed as JSON via the API's /v1/metrics. logEvent() emits one
// structured JSON line per stage transition or error — NEVER document content,
// PII, tokens, or signed-URL secrets (only ids, counts, durations, codes,
// classification level). This is the classification-aware logging the spec
// requires from day one.

const counters = new Map();
const durations = new Map(); // name → { count, totalMs, maxMs }
const startedAt = Date.now();

export function inc(name, by = 1) {
  counters.set(name, (counters.get(name) || 0) + by);
}

export function observe(name, ms) {
  const d = durations.get(name) || { count: 0, totalMs: 0, maxMs: 0 };
  d.count += 1; d.totalMs += ms; d.maxMs = Math.max(d.maxMs, ms);
  durations.set(name, d);
}

/** A simple timer: const end = timer("render_ms"); ...; end(); */
export function timer(name) {
  const t0 = Date.now();
  return () => { observe(name, Date.now() - t0); return Date.now() - t0; };
}

export function snapshot() {
  const dur = {};
  for (const [k, v] of durations) dur[k] = { count: v.count, avgMs: Math.round(v.totalMs / v.count), maxMs: v.maxMs };
  return {
    uptimeMs: Date.now() - startedAt,
    counters: Object.fromEntries(counters),
    durations: dur,
    ts: new Date().toISOString(),
  };
}

// ---- structured logging (one JSON object per line) -------------------------
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN = LEVELS[(process.env.DISPATCH_LOG_LEVEL || "info").toLowerCase()] ?? 20;

// Defense-in-depth: a key whitelist for log fields, so content/PII/secrets can
// never be logged even if a caller passes them by mistake.
const ALLOWED = new Set([
  "service", "workerId", "requestId", "jobId", "correlationId", "tenantId",
  "documentId", "artifactId", "stage", "outcome", "state", "attempt",
  "durationMs", "code", "status", "method", "path", "format", "classification",
  "blocksRendered", "pages", "outputs", "principalType", "msg",
]);

export function logEvent(level, fields = {}) {
  if ((LEVELS[level] ?? 20) < MIN) return;
  const clean = { ts: new Date().toISOString(), level };
  for (const [k, v] of Object.entries(fields)) {
    if (!ALLOWED.has(k)) continue;
    if (k === "tenantId" && typeof v === "string") clean[k] = v.slice(0, 8); // truncate, never full
    else clean[k] = v;
  }
  try { process.stdout.write(JSON.stringify(clean) + "\n"); } catch { /* ignore */ }
}

export const log = {
  info: (f) => logEvent("info", f),
  warn: (f) => logEvent("warn", f),
  error: (f) => logEvent("error", f),
};
