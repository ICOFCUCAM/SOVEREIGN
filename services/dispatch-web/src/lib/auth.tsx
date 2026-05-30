import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bindTokenGetter, exchangeToken, whoami } from "./api";
import { refreshSession, revokeSession } from "./oauth";

// Session model: a bearer token held in MEMORY ONLY (never localStorage),
// appropriate for classified material. Three ways in:
//   - service client credentials (machine / operator) → /v1/token (no refresh)
//   - human SSO redirect → Dispatch session (access + ROTATING refresh token)
//   - paste an identity JWT (no refresh)
// For human SSO the API issues its own short access token + a rotating refresh
// token; the console proactively refreshes before expiry so the session lives
// without re-redirecting to the IdP. Role/scopes/clearance always come from the
// API (/v1/whoami or the refresh response) — never the token's own claims.
interface Session { token: string; refreshToken?: string; tenantId: string; scopes: string[]; clearance: string; expiresAt: number; subject: string; kind: "service" | "user" }

export interface SessionInit { accessToken: string; expiresIn?: number | null; refreshToken?: string;
  principal?: { tenantId: string; role: string; scopes: string[]; clearance: string; actor: string; principalType: "user" | "service" } }

interface AuthCtx {
  session: Session | null;
  signIn: (clientId: string, secret: string) => Promise<void>;
  signInSso: (userJwt: string) => Promise<void>;
  signInWithSession: (init: SessionInit) => void;
  signOut: () => void;
  has: (scope: string) => boolean;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

function tokenExp(token: string, fallbackSec = 900): number {
  try {
    const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return p.exp ? p.exp * 1000 : Date.now() + fallbackSec * 1000;
  } catch { return Date.now() + fallbackSec * 1000; }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bindTokenGetter(() => session?.token ?? null); }, [session]);

  // Build a session from a bearer token by asking the API who we are (used by
  // service-credentials + paste-token paths, which carry no refresh token).
  const establish = useCallback(async (token: string, expiresAt: number) => {
    const me = await whoami(token);
    setSession({ token, tenantId: me.tenantId, scopes: me.scopes, clearance: me.clearance,
      expiresAt, subject: me.actor, kind: me.principalType });
  }, []);

  // Build a session directly from a callback/refresh response (carries the
  // principal + a rotating refresh token).
  const signInWithSession = useCallback((init: SessionInit) => {
    const expiresAt = init.expiresIn ? Date.now() + init.expiresIn * 1000 : tokenExp(init.accessToken);
    const p = init.principal;
    setSession({ token: init.accessToken, refreshToken: init.refreshToken, expiresAt,
      tenantId: p?.tenantId ?? "", scopes: p?.scopes ?? [], clearance: p?.clearance ?? "none",
      subject: p?.actor ?? "user", kind: p?.principalType ?? "user" });
  }, []);

  const signIn = useCallback(async (clientId: string, secret: string) => {
    setLoading(true); setError(null);
    try { const r = await exchangeToken(clientId, secret); await establish(r.access_token, Date.now() + r.expiresIn * 1000); }
    catch (e) { setError(e instanceof Error ? e.message : "sign-in failed"); throw e; }
    finally { setLoading(false); }
  }, [establish]);

  const signInSso = useCallback(async (userJwt: string) => {
    setLoading(true); setError(null);
    try { await establish(userJwt.trim(), tokenExp(userJwt.trim())); }
    catch (e) { setError(e instanceof Error ? e.message : "SSO sign-in failed"); throw e; }
    finally { setLoading(false); }
  }, [establish]);

  const signOut = useCallback(() => {
    if (session?.refreshToken) revokeSession(session.refreshToken); // best-effort server revoke
    setSession(null);
  }, [session]);

  // Proactive refresh: for sessions with a refresh token, rotate ~30s before
  // the access token expires so requests never 401 mid-use. Falls back to
  // signing out if the refresh fails (e.g. family revoked).
  useEffect(() => {
    if (refreshTimer.current) { clearTimeout(refreshTimer.current); refreshTimer.current = null; }
    if (!session) return;
    const lead = 30_000;
    const delay = Math.max(session.expiresAt - Date.now() - lead, 0);
    if (session.refreshToken) {
      refreshTimer.current = setTimeout(async () => {
        try {
          const r = await refreshSession(session.refreshToken!);
          signInWithSession(r);
        } catch { setSession(null); }
      }, delay);
    } else {
      // no refresh token (service / paste): just expire the session
      refreshTimer.current = setTimeout(() => setSession(null), Math.max(session.expiresAt - Date.now(), 0));
    }
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [session, signInWithSession]);

  const has = useCallback((scope: string) => !!session?.scopes.includes(scope), [session]);

  const value = useMemo<AuthCtx>(() => ({ session, signIn, signInSso, signInWithSession, signOut, has, loading, error }),
    [session, signIn, signInSso, signInWithSession, signOut, has, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
