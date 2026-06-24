import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bindTokenGetter, exchangeToken } from "./api";

// Session model: a Dispatch service token (client-credentials) held in memory.
// We decode the JWT payload (unverified, client-side, display-only) to surface
// scopes/tenant in the UI — the API is the real authority on every call.
interface Session { token: string; tenantId: string; scopes: string[]; expiresAt: number; subject: string }

interface AuthCtx {
  session: Session | null;
  signIn: (clientId: string, secret: string) => Promise<void>;
  signOut: () => void;
  has: (scope: string) => boolean;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

function decodeScopes(token: string): { scopes: string[]; subject: string } {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return { scopes: payload.scopes ?? [], subject: payload.sub ?? payload.client_id ?? "service" };
  } catch { return { scopes: [], subject: "service" }; }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The api client pulls the current token through this getter on every request.
  // We bind ONCE to a ref that is updated synchronously during render (below),
  // not via an effect keyed on `session`. React flushes child effects before
  // parent effects, so an effect-bound getter would still be the stale (null)
  // closure when a freshly-mounted page (e.g. the Dashboard a user lands on
  // right after signup) fires its first requests — yielding "missing
  // Authorization". A ref read during render is current before any child effect runs.
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;
  useEffect(() => { bindTokenGetter(() => sessionRef.current?.token ?? null); }, []);

  const signIn = useCallback(async (clientId: string, secret: string) => {
    setLoading(true); setError(null);
    try {
      const r = await exchangeToken(clientId, secret);
      const { scopes, subject } = decodeScopes(r.access_token);
      setSession({ token: r.access_token, tenantId: r.tenantId, scopes: r.scopes?.length ? r.scopes : scopes,
        expiresAt: Date.now() + r.expiresIn * 1000, subject });
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
      throw e;
    } finally { setLoading(false); }
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  // Auto sign-out a moment before expiry so the UI doesn't 401 mid-action.
  useEffect(() => {
    if (!session) return;
    const ms = session.expiresAt - Date.now() - 5000;
    const t = setTimeout(() => setSession(null), Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [session]);

  const has = useCallback((scope: string) => !!session?.scopes.includes(scope), [session]);

  const value = useMemo<AuthCtx>(() => ({ session, signIn, signOut, has, loading, error }), [session, signIn, signOut, has, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
