import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Session model. ExitOS auth will exchange a Supabase user JWT against
// exit-api once that service exists; for now the console accepts any
// non-empty (email, password) and synthesizes a session token, so the
// 10 console surfaces can be exercised end-to-end. The wire format is
// stable — when exit-api ships, only this file changes.

interface Session {
  token: string;
  founderId: string;
  email: string;
  workspace: string;
  scopes: string[];
  expiresAt: number;
}

interface AuthCtx {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  has: (scope: string) => boolean;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

const DEFAULT_SCOPES = [
  "exit:read",
  "exit:write",
  "exit:dataroom",
  "exit:buyers",
  "exit:investors",
  "exit:negotiate",
  "exit:documents",
  "exit:close",
];

function fakeToken(email: string): string {
  // Browser-safe synthetic JWT — header.payload.signature, payload only
  // base64-encoded for display. Replaced by real exit-api token at sign-in.
  const payload = btoa(JSON.stringify({
    sub: email, scopes: DEFAULT_SCOPES, exp: Math.floor(Date.now() / 1000) + 8 * 3600,
  }));
  return `dev.${payload}.dev`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      if (!email || !password) throw new Error("email and password required");
      await new Promise((r) => setTimeout(r, 250));
      setSession({
        token: fakeToken(email),
        founderId: email.split("@")[0] ?? "founder",
        email,
        workspace: "primary",
        scopes: DEFAULT_SCOPES,
        expiresAt: Date.now() + 8 * 3600 * 1000,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
      throw e;
    } finally { setLoading(false); }
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  useEffect(() => {
    if (!session) return;
    const ms = session.expiresAt - Date.now() - 5000;
    const t = setTimeout(() => setSession(null), Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [session]);

  const has = useCallback((scope: string) => !!session?.scopes.includes(scope), [session]);

  const value = useMemo<AuthCtx>(() => ({ session, signIn, signOut, has, loading, error }),
    [session, signIn, signOut, has, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
