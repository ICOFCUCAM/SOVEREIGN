// Launch Phase 1 — lightweight behavioural beacons.
//
// Fire-and-forget, never throws, no PII. A stable anonymous id (localStorage)
// lets a returning visitor's funnel be followed WITHOUT identifying them; a
// per-tab session id groups a single visit. Uses navigator.sendBeacon so an
// "abandoned" event still lands as the tab is closing. These are signal, not a
// record of authority — the server keeps them out of the audit trail entirely.

const BASE = import.meta.env.VITE_DISPATCH_API_URL ?? "";
const ANON_KEY = "sd_anon";
const SESS_KEY = "sd_session";

function newId(): string {
  try { return crypto.randomUUID(); } catch { return String(Math.floor(Math.random() * 1e16)); }
}
function stored(store: Storage | undefined, key: string): string {
  try {
    if (!store) return "anon";
    let id = store.getItem(key);
    if (!id) { id = newId(); store.setItem(key, id); }
    return id;
  } catch { return "anon"; }
}
const anonId = () => stored(typeof localStorage !== "undefined" ? localStorage : undefined, ANON_KEY);
const sessionId = () => stored(typeof sessionStorage !== "undefined" ? sessionStorage : undefined, SESS_KEY);

// Authenticated surfaces can attribute events to a tenant; bound from the auth
// context so we never thread tenant ids through every call site.
let tenantGetter: () => string | null = () => null;
export function bindAnalyticsTenant(fn: () => string | null): void { tenantGetter = fn; }

/** Emit a behavioural event. Allowlisted names only (server drops the rest). */
export function track(event: string, props?: Record<string, unknown>): void {
  try {
    const tenantId = tenantGetter() ?? undefined;
    const payload = JSON.stringify({ event, anonId: anonId(), sessionId: sessionId(), tenantId, props });
    const url = BASE + "/v1/analytics/events";
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* analytics must never surface to a user */ }
}
