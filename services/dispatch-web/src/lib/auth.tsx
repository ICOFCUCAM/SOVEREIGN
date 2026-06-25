import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bindTokenGetter, exchangeToken , humanError} from "./api";
import { bindAnalyticsTenant } from "./analytics";

// Session model: a Dispatch service token (client-credentials) held in memory.
// We decode the JWT payload (unverified, client-side, display-only) to surface
// scopes/tenant in the UI — the API is the real authority on every call.
interface Session { token: string; tenantId: string; scopes: string[]; expiresAt: number; subject: string }

interface AuthCtx {
  session: Session | null;
  signIn: (clientId: string, secret: string) => Promise<void>;
  signInWithToken: (token: string, tenantId?: string) => void;
  signOut: () => void;
  has: (scope: string) => boolean;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

function decodePayload(token: string): Record<string, unknown> {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); }
  catch { return {}; }
}
function decodeScopes(token: string): { scopes: string[]; subject: string } {
  const p = decodePayload(token) as { scopes?: string[]; email?: string; sub?: string; client_id?: string };
  return { scopes: p.scopes ?? [], subject: p.email ?? p.sub ?? p.client_id ?? "service" };
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
  useEffect(() => {
    bindTokenGetter(() => sessionRef.current?.token ?? null);
    bindAnalyticsTenant(() => sessionRef.current?.tenantId ?? null);
  }, []);

  const signIn = useCallback(async (clientId: string, secret: string) => {
    setLoading(true); setError(null);
    try {
      const r = await exchangeToken(clientId, secret);
      const { scopes, subject } = decodeScopes(r.access_token);
      setSession({ token: r.access_token, tenantId: r.tenantId, scopes: r.scopes?.length ? r.scopes : scopes,
        expiresAt: Date.now() + r.expiresIn * 1000, subject });
    } catch (e) {
      setError(humanError(e, "sign-in failed"));
      throw e;
    } finally { setLoading(false); }
  }, []);

  // Establish a session from a Dispatch-issued token (institutional SSO). The API
  // redirects back with #sso_token=… after federating the institution's IdP.
  const signInWithToken = useCallback((token: string, tenantId?: string) => {
    const { scopes, subject } = decodeScopes(token);
    const p = decodePayload(token) as { tenant_id?: string; exp?: number };
    setSession({ token, tenantId: tenantId ?? p.tenant_id ?? "", scopes, subject,
      expiresAt: p.exp ? p.exp * 1000 : Date.now() + 3600_000 });
  }, []);

  // Consume an SSO redirect once, on load: #sso_token=…&tenant=… → a session,
  // then scrub the fragment so the token never lingers in the URL/history.
  useEffect(() => {
    const h = window.location.hash;
    if (!h.includes("sso_token=")) return;
    const params = new URLSearchParams(h.slice(1));
    const token = params.get("sso_token");
    if (token) signInWithToken(token, params.get("tenant") ?? undefined);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [signInWithToken]);

  const signOut = useCallback(() => setSession(null), []);

  // Auto sign-out a moment before expiry so the UI doesn't 401 mid-action.
  useEffect(() => {
    if (!session) return;
    const ms = session.expiresAt - Date.now() - 5000;
    const t = setTimeout(() => setSession(null), Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [session]);

  const has = useCallback((scope: string) => !!session?.scopes.includes(scope), [session]);

  const value = useMemo<AuthCtx>(() => ({ session, signIn, signInWithToken, signOut, has, loading, error }), [session, signIn, signInWithToken, signOut, has, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
