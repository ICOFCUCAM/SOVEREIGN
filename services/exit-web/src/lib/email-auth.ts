import type { Role } from "./access";

// ── EMAIL-LINK SIGN-IN (Supabase Auth, over fetch — no SDK) ────────
// The production sign-in. The person enters their e-mail; Supabase sends a
// one-time link; following it returns here with a session that Supabase has
// issued and that is verified against Supabase (GET /auth/v1/user) before the
// console trusts it. Who someone is comes only from that verified session.
//
// What they may do:
//  * founder / buyer — chosen by the person for their own account and stored in
//    exitos_accounts (the database refuses any other self-chosen role);
//  * operator / counsel / approver — read from exitos_role_grants, which no
//    client can write. A browser value can never grant one.

export interface AuthConfig {
  readonly url: string;
  readonly anonKey: string;
  readonly fetchImpl?: typeof fetch;
}

/** The project the build points at (env first, then the project the rest of the app uses). Null under test. */
export function authConfigFromEnv(): AuthConfig | null {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  if (env.MODE === "test" || env.VITEST) return null;
  const url = env.VITE_SUPABASE_URL ?? "https://qvjdivcdefuprnenedje.supabase.co";
  const anonKey = env.VITE_SUPABASE_ANON_KEY
    ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";
  return { url, anonKey };
}

export type Side = "founder" | "buyer";
export type Grant = "operator" | "counsel" | "approver";

export interface VerifiedSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;         // ms since epoch
  readonly userId: string;
  readonly email: string;
}

const f = (cfg: AuthConfig): typeof fetch => cfg.fetchImpl ?? globalThis.fetch;

async function expectOk(res: Response, what: string): Promise<unknown> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const b = body as { msg?: string; error_description?: string; message?: string };
    throw new Error(`${what} failed: ${b.msg ?? b.error_description ?? b.message ?? res.status}`);
  }
  return body;
}

/** Ask Supabase to e-mail a one-time sign-in link that returns to `redirectTo`. */
export async function sendSignInLink(cfg: AuthConfig, email: string, redirectTo: string): Promise<void> {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Enter a valid e-mail address.");
  const res = await f(cfg)(`${cfg.url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: { apikey: cfg.anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email: e, create_user: true }),
  });
  await expectOk(res, "Sending the sign-in link");
}

/** E-mail and password sign-in (Supabase Auth password grant). */
export async function passwordSignIn(cfg: AuthConfig, email: string, password: string): Promise<VerifiedSession> {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Enter a valid e-mail address.");
  if (!password) throw new Error("Enter your password.");
  const res = await f(cfg)(`${cfg.url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: cfg.anonKey, "content-type": "application/json" }, body: JSON.stringify({ email: e, password }),
  });
  const r = (await expectOk(res, "Signing in")) as { access_token: string; refresh_token: string; expires_in: number };
  const u = await verifyUser(cfg, r.access_token);
  return { accessToken: r.access_token, refreshToken: r.refresh_token, expiresAt: Date.now() + r.expires_in * 1000, userId: u.id, email: u.email };
}

/** E-mail a password-reset link (Supabase Auth recover); it returns to `redirectTo` signed in. */
export async function sendPasswordReset(cfg: AuthConfig, email: string, redirectTo: string): Promise<void> {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("Enter a valid e-mail address.");
  const res = await f(cfg)(`${cfg.url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST", headers: { apikey: cfg.anonKey, "content-type": "application/json" }, body: JSON.stringify({ email: e }),
  });
  await expectOk(res, "Sending the reset link");
}

export type OAuthProvider = "google" | "apple" | "azure";
/** The provider's sign-in page through Supabase Auth; it returns to `redirectTo` with the session in the URL fragment. */
export const oauthUrl = (cfg: AuthConfig, provider: OAuthProvider, redirectTo: string): string =>
  `${cfg.url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;

/** The tokens (or the error) Supabase puts in the URL fragment when a sign-in link is followed. */
export function parseCallback(hash: string): { accessToken: string; refreshToken: string; expiresIn: number } | { error: string } | null {
  const h = new URLSearchParams(hash.replace(/^#/, ""));
  if (h.get("error") || h.get("error_description")) return { error: h.get("error_description") ?? h.get("error") ?? "Sign-in failed." };
  const accessToken = h.get("access_token"), refreshToken = h.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, expiresIn: Number(h.get("expires_in") ?? 3600) };
}

/** Supabase's own answer to "whose token is this?" — never decoded from the token in the browser. */
export async function verifyUser(cfg: AuthConfig, accessToken: string): Promise<{ id: string; email: string }> {
  const res = await f(cfg)(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.anonKey, Authorization: `Bearer ${accessToken}` } });
  const u = (await expectOk(res, "Verifying the session")) as { id?: string; email?: string; email_confirmed_at?: string | null };
  if (!u.id || !u.email) throw new Error("Verifying the session failed: no user.");
  if (!u.email_confirmed_at) throw new Error("This e-mail address has not been confirmed.");
  return { id: u.id, email: u.email };
}

export async function refreshSession(cfg: AuthConfig, refreshToken: string): Promise<VerifiedSession> {
  const res = await f(cfg)(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: { apikey: cfg.anonKey, "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const r = (await expectOk(res, "Restoring the session")) as { access_token: string; refresh_token: string; expires_in: number };
  const u = await verifyUser(cfg, r.access_token);
  return { accessToken: r.access_token, refreshToken: r.refresh_token, expiresAt: Date.now() + r.expires_in * 1000, userId: u.id, email: u.email };
}

export async function signOutRemote(cfg: AuthConfig, accessToken: string): Promise<void> {
  await f(cfg)(`${cfg.url}/auth/v1/logout`, { method: "POST", headers: { apikey: cfg.anonKey, Authorization: `Bearer ${accessToken}` } }).catch(() => undefined);
}

const rest = (cfg: AuthConfig, token: string): Record<string, string> =>
  ({ apikey: cfg.anonKey, Authorization: `Bearer ${token}`, "content-type": "application/json" });

/** The person's own side (founder/buyer) and server-made grants, read under their own token (RLS). */
export async function loadAccess(cfg: AuthConfig, s: Pick<VerifiedSession, "accessToken" | "userId">): Promise<{ side: Side | null; grants: Grant[] }> {
  const id = encodeURIComponent(s.userId);
  const [acc, gr] = await Promise.all([
    f(cfg)(`${cfg.url}/rest/v1/exitos_accounts?id=eq.${id}&select=role`, { headers: rest(cfg, s.accessToken) }),
    f(cfg)(`${cfg.url}/rest/v1/exitos_role_grants?account_id=eq.${id}&select=role`, { headers: rest(cfg, s.accessToken) }),
  ]);
  const accRows = (await expectOk(acc, "Reading the account")) as Array<{ role: string }>;
  const grantRows = (await expectOk(gr, "Reading the account's roles")) as Array<{ role: string }>;
  const side = accRows[0]?.role === "founder" || accRows[0]?.role === "buyer" ? (accRows[0].role as Side) : null;
  const grants = grantRows.map((g) => g.role).filter((r): r is Grant => r === "operator" || r === "counsel" || r === "approver");
  return { side, grants };
}

/** Record the side the person chose for their own account (the database accepts only founder or buyer). */
export async function saveSide(cfg: AuthConfig, s: Pick<VerifiedSession, "accessToken" | "userId" | "email">, side: Side): Promise<void> {
  const res = await f(cfg)(`${cfg.url}/rest/v1/exitos_accounts?on_conflict=id`, {
    method: "POST",
    headers: { ...rest(cfg, s.accessToken), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id: s.userId, role: side, data: { id: s.userId, role: side, name: s.email, createdAt: new Date().toISOString() } }]),
  });
  await expectOk(res, "Saving the account");
}

/** The console role: the operator grant makes an operator (superadmin); otherwise the person's side.
 *  Counsel and approver are capabilities checked server-side, not console roles. */
export function consoleRole(side: Side | null, grants: readonly Grant[]): Role | null {
  if (grants.includes("operator")) return "superadmin";
  return side;
}

// ── the refresh token, kept in this browser between visits ─────────
const STORE = "exitos.auth.v1";
export const storeRefresh = (token: string | null): void => {
  try { if (token) localStorage.setItem(STORE, token); else localStorage.removeItem(STORE); } catch { /* storage unavailable */ }
};
export const storedRefresh = (): string | null => { try { return localStorage.getItem(STORE); } catch { return null; } };
// the side chosen on the sign-in screen, applied when the link brings the person back
const SIDE = "exitos.auth.pendingSide";
export const rememberSide = (s: Side): void => { try { localStorage.setItem(SIDE, s); } catch { /* ignore */ } };
export const takePendingSide = (): Side | null => {
  try { const v = localStorage.getItem(SIDE); localStorage.removeItem(SIDE); return v === "founder" || v === "buyer" ? v : null; } catch { return null; }
};
