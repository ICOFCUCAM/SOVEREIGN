import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { bindTokenGetter, exchangeToken, whoami } from "./api";

// Session model: a bearer token held in MEMORY ONLY (never localStorage),
// appropriate for classified material. Two ways in:
//   - service client credentials (machine / operator) → /v1/token
//   - human SSO: an identity-provider (Supabase) user JWT
// In BOTH cases the role / scopes / clearance are resolved from the API via
// /v1/whoami — the server is the authority (a user JWT cannot self-assert its
// role). We never trust the token's own claims for authorization.
interface Session { token: string; tenantId: string; scopes: string[]; clearance: string; expiresAt: number; subject: string; kind: "service" | "user" }

interface AuthCtx {
  session: Session | null;
  signIn: (clientId: string, secret: string) => Promise<void>;
  signInSso: (userJwt: string) => Promise<void>;
  signInWithToken: (token: string, expiresInSec?: number | null) => Promise<void>;
  signOut: () => void;
  has: (scope: string) => boolean;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

// JWT `exp` (seconds) for the in-memory expiry timer; falls back to a short TTL.
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

  // The api client pulls the current token through this getter on every request.
  useEffect(() => { bindTokenGetter(() => session?.token ?? null); }, [session]);

  // Build a session from a bearer token by asking the API who we are.
  const establish = useCallback(async (token: string, expiresAt: number) => {
    const me = await whoami(token); // server is the authority on role/scopes/clearance
    setSession({ token, tenantId: me.tenantId, scopes: me.scopes, clearance: me.clearance,
      expiresAt, subject: me.actor, kind: me.principalType });
  }, []);

  const signIn = useCallback(async (clientId: string, secret: string) => {
    setLoading(true); setError(null);
    try {
      const r = await exchangeToken(clientId, secret);
      await establish(r.access_token, Date.now() + r.expiresIn * 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
      throw e;
    } finally { setLoading(false); }
  }, [establish]);

  const signInSso = useCallback(async (userJwt: string) => {
    setLoading(true); setError(null);
    try {
      await establish(userJwt.trim(), tokenExp(userJwt.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "SSO sign-in failed");
      throw e;
    } finally { setLoading(false); }
  }, [establish]);

  // Establish a session from a token already obtained out-of-band (OAuth code
  // exchange). expiresIn falls back to the token's own exp.
  const signInWithToken = useCallback(async (token: string, expiresInSec?: number | null) => {
    setLoading(true); setError(null);
    try {
      await establish(token, expiresInSec ? Date.now() + expiresInSec * 1000 : tokenExp(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
      throw e;
    } finally { setLoading(false); }
  }, [establish]);

  const signOut = useCallback(() => setSession(null), []);

  // Auto sign-out a moment before expiry so the UI doesn't 401 mid-action.
  useEffect(() => {
    if (!session) return;
    const ms = session.expiresAt - Date.now() - 5000;
    const t = setTimeout(() => setSession(null), Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [session]);

  const has = useCallback((scope: string) => !!session?.scopes.includes(scope), [session]);

  const value = useMemo<AuthCtx>(() => ({ session, signIn, signInSso, signInWithToken, signOut, has, loading, error }),
    [session, signIn, signInSso, signInWithToken, signOut, has, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
