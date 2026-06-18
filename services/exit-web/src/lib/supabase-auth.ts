import type { SupabaseConfig } from "./supabase-exit-api";

// ── SUPABASE AUTH (GoTrue over fetch — no dependency) ───────────────
// Real authenticated sessions so the backend's RLS scopes to auth.uid().
// The console's sign-in UX is unchanged; underneath, this obtains a durable
// Supabase session for the browser and hands the JWT + user id to the
// backend. We prefer anonymous sign-in (zero email friction) and persist the
// refresh token, so the same browser keeps the same identity across sessions
// — which is what makes telemetry and listings durably account-scoped.
//
// NOTE: this requires "Anonymous sign-ins" enabled in the project's Auth
// settings. If it's off (or auth is unreachable), activateBackend falls back
// to the durable local backend so the app never breaks.

export interface SupabaseSession { accessToken: string; userId: string }
interface TokenResponse { access_token: string; refresh_token: string; user: { id: string } }

const STORE_KEY = "exitos.supabase.session.v1";
const readStored = (): { refresh_token: string } | null => {
  try { return JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) ?? "null"); } catch { return null; }
};
const writeStored = (refresh_token: string): void => {
  try { globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify({ refresh_token })); } catch { /* ignore */ }
};

async function gotrue(cfg: SupabaseConfig, path: string, body: unknown): Promise<TokenResponse> {
  const f = cfg.fetchImpl ?? globalThis.fetch;
  const res = await f(`${cfg.url}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: cfg.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`gotrue ${path} ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json() as Promise<TokenResponse>;
}

/** Restore a durable session if we have one, else create an anonymous one.
 *  Returns the access token (for backend Authorization) and the user id
 *  (which becomes the account id, == auth.uid() for RLS). */
export async function ensureSupabaseSession(cfg: SupabaseConfig): Promise<SupabaseSession> {
  const stored = readStored();
  if (stored?.refresh_token) {
    try {
      const r = await gotrue(cfg, "token?grant_type=refresh_token", { refresh_token: stored.refresh_token });
      writeStored(r.refresh_token);
      return { accessToken: r.access_token, userId: r.user.id };
    } catch { /* stale refresh token — fall through to a fresh anonymous sign-in */ }
  }
  const r = await gotrue(cfg, "signup", {});   // anonymous sign-in
  writeStored(r.refresh_token);
  return { accessToken: r.access_token, userId: r.user.id };
}
