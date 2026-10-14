import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Role, Plan } from "./access";
import { activateBackend, type AccountRole } from "./exit-api";
import {
  authConfigFromEnv, sendSignInLink, parseCallback, verifyUser, refreshSession, signOutRemote,
  loadAccess, saveSide, consoleRole, storeRefresh, storedRefresh, rememberSide, takePendingSide,
  passwordSignIn, passwordSignUp, sendPasswordReset, oauthUrl,
  type Side, type Grant, type VerifiedSession, type OAuthProvider,
} from "./email-auth";

// ── SESSIONS ────────────────────────────────────────────────────────
// Two modes, decided at build time:
//  * "email_link" — every production build. Who someone is comes from a
//    Supabase Auth session that Supabase itself verifies; privileged roles
//    (operator, counsel, approver) come only from server-side grants.
//  * "development" — only in a development build (`import.meta.env.DEV`), and
//    only unless VITE_EXITOS_AUTH=email_link. Any e-mail opens a local session
//    in this browser; it has no server identity and the sign-in screen says so.

export type AuthMode = "email_link" | "development";
export const authMode = (): AuthMode =>
  import.meta.env.DEV && import.meta.env.VITE_EXITOS_AUTH !== "email_link" ? "development" : "email_link";

// Session role → backend AccountRole. Operators act as advisors over the
// network; a verified account's row only ever holds founder or buyer.
const accountRoleOf = (role: Role): AccountRole =>
  role === "founder" ? "founder" : role === "buyer" ? "buyer" : "advisor";

interface Session {
  mode: AuthMode;
  /** Present only for a verified (email_link) session. */
  verified: VerifiedSession | null;
  founderId: string;
  email: string;
  scopes: string[];
  role: Role;
  /** Server-made grants (email_link only); development sessions have none. */
  grants: Grant[];
  /** The side the person chose for their own account; null until chosen. */
  side: Side | null;
  plan: Plan;
  expiresAt: number;
}

interface AuthCtx {
  session: Session | null;
  mode: AuthMode;
  /** development mode only */
  signIn: (email: string, password: string, role?: Role, plan?: Plan) => Promise<void>;
  /** email_link mode: e-mail a sign-in link; the chosen side applies when the person returns */
  sendLink: (email: string, side: Side) => Promise<void>;
  /** e-mail and password sign-in (development: a local session) */
  passwordLogin: (email: string, password: string, side: Side) => Promise<void>;
  /** create an account with e-mail and password; resolves "confirm" when the address must be confirmed first */
  createAccount: (email: string, password: string, side: Side) => Promise<"signed_in" | "confirm">;
  /** e-mail a password-reset link */
  resetPassword: (email: string) => Promise<void>;
  /** continue with LinkedIn, Google, Microsoft or Apple (development: a local session) */
  oauth: (provider: OAuthProvider, side: Side) => void;
  /** email_link mode: the e-mail a link was just sent to */
  linkSentTo: string | null;
  /** email_link mode: a verified account that has not chosen founder or buyer yet */
  chooseSide: (side: Side) => Promise<void>;
  signOut: () => void;
  upgrade: () => void;                 // → pro (kept for existing callers)
  upgradeTo: (plan: Plan) => void;     // set any plan (starter / pro)
  has: (scope: string) => boolean;
  loading: boolean;
  /** false while a returning sign-in link or a stored session is being verified */
  ready: boolean;
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

// ── Development operator ────────────────────────────────────────────
// A development session is synthesized in the browser, so any role granted
// here could be claimed by any visitor. Only development builds have this
// branch (`import.meta.env.DEV` is false in production and the code is
// removed at build time). Production operators come from exitos_role_grants.
export function devOperatorEmail(): string {
  if (!import.meta.env.DEV) return "";
  return String(import.meta.env.VITE_EXITOS_DEV_OPERATOR_EMAIL ?? "").trim().toLowerCase();
}

export function isDevOperator(email: string, operatorEmail: string): boolean {
  return operatorEmail !== "" && email.trim().toLowerCase() === operatorEmail;
}

/** A verified session plus what the server says the person may do → a console session. */
async function verifiedConsoleSession(cfg: NonNullable<ReturnType<typeof authConfigFromEnv>>, v: VerifiedSession, plan: Plan): Promise<Session> {
  const access = await loadAccess(cfg, v);
  const { grants } = access;
  let { side } = access;
  const pending = takePendingSide();
  if (!side && pending) { await saveSide(cfg, v, pending); side = pending; }
  const role = consoleRole(side, grants) ?? "founder";
  return {
    mode: "email_link", verified: v, founderId: v.userId, email: v.email, scopes: DEFAULT_SCOPES,
    role, grants, side, plan: grants.includes("operator") ? "pro" : plan, expiresAt: v.expiresAt,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = authMode();
  const cfg = useMemo(() => authConfigFromEnv(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(mode !== "email_link");
  const [error, setError] = useState<string | null>(null);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  // email_link: complete a sign-in link that brought the person back, or restore the last session
  useEffect(() => {
    if (mode !== "email_link") return;
    if (!cfg) { setReady(true); setError("Sign-in is not configured for this build."); return; }
    let alive = true;
    void (async () => {
      try {
        const cb = typeof window !== "undefined" ? parseCallback(window.location.hash) : null;
        let v: VerifiedSession | null = null;
        // clear the link's tokens (or error) from the address bar before anything else
        if (cb) history.replaceState(null, "", window.location.pathname + window.location.search);
        if (cb && "error" in cb) throw new Error(cb.error);
        if (cb) {
          const u = await verifyUser(cfg, cb.accessToken);
          v = { accessToken: cb.accessToken, refreshToken: cb.refreshToken, expiresAt: Date.now() + cb.expiresIn * 1000, userId: u.id, email: u.email };
        } else {
          const stored = storedRefresh();
          if (stored) v = await refreshSession(cfg, stored).catch(() => { storeRefresh(null); return null; });
        }
        if (!v) return;
        storeRefresh(v.refreshToken);
        const s = await verifiedConsoleSession(cfg, v, "free");
        if (alive) setSession(s);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Sign-in failed.");
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [mode, cfg]);

  const signIn = useCallback(async (email: string, password: string, role: Role = "founder", plan: Plan = "free") => {
    if (mode !== "development") throw new Error("Use the e-mail sign-in link.");
    setLoading(true); setError(null);
    try {
      if (!email || !password) throw new Error("email and password required");
      await new Promise((r) => setTimeout(r, 250));
      // Operator elevation is local-development only (see devOperatorEmail).
      const isSuper = isDevOperator(email, devOperatorEmail());
      setSession({
        mode: "development", verified: null,
        founderId: email.split("@")[0] ?? "founder",
        email,
        scopes: DEFAULT_SCOPES,
        role: isSuper ? "superadmin" : role,
        grants: [], side: role === "buyer" ? "buyer" : "founder",
        plan: isSuper ? "pro" : plan,
        expiresAt: Date.now() + 8 * 3600 * 1000,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
      throw e;
    } finally { setLoading(false); }
  }, [mode]);

  const sendLink = useCallback(async (email: string, side: Side) => {
    if (mode !== "email_link" || !cfg) throw new Error("E-mail sign-in is not configured for this build.");
    setLoading(true); setError(null); setLinkSentTo(null);
    try {
      rememberSide(side);
      await sendSignInLink(cfg, email, `${window.location.origin}/console`);
      setLinkSentTo(email.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the sign-in link.");
      throw e;
    } finally { setLoading(false); }
  }, [mode, cfg]);

  const passwordLogin = useCallback(async (email: string, password: string, side: Side) => {
    if (mode !== "email_link" || !cfg) { await signIn(email.trim(), password, side); return; }
    setLoading(true); setError(null);
    try {
      rememberSide(side);
      const v = await passwordSignIn(cfg, email, password);
      storeRefresh(v.refreshToken);
      setSession(await verifiedConsoleSession(cfg, v, "free"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
      throw e;
    } finally { setLoading(false); }
  }, [mode, cfg, signIn]);

  const createAccount = useCallback(async (email: string, password: string, side: Side): Promise<"signed_in" | "confirm"> => {
    if (mode !== "email_link" || !cfg) { await signIn(email.trim(), password, side); return "signed_in"; }
    setLoading(true); setError(null);
    try {
      rememberSide(side);
      const v = await passwordSignUp(cfg, email, password, `${window.location.origin}/console`);
      if (!v) return "confirm";
      storeRefresh(v.refreshToken);
      setSession(await verifiedConsoleSession(cfg, v, "free"));
      return "signed_in";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the account.");
      throw e;
    } finally { setLoading(false); }
  }, [mode, cfg, signIn]);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    if (mode !== "email_link" || !cfg) return;      // development: nothing to reset
    setLoading(true);
    try { await sendPasswordReset(cfg, email, `${window.location.origin}/console`); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send the reset link."); throw e; }
    finally { setLoading(false); }
  }, [mode, cfg]);

  const oauth = useCallback((provider: OAuthProvider, side: Side) => {
    if (mode !== "email_link" || !cfg) { void signIn(`${side}@${provider === "azure" ? "microsoft" : provider}.com`, "sso", side).catch(() => {}); return; }
    rememberSide(side);
    window.location.assign(oauthUrl(cfg, provider, `${window.location.origin}/console`));
  }, [mode, cfg, signIn]);

  const chooseSide = useCallback(async (side: Side) => {
    if (!cfg || !session?.verified) return;
    await saveSide(cfg, session.verified, side);
    setSession(await verifiedConsoleSession(cfg, session.verified, session.plan));
  }, [cfg, session]);

  const signOut = useCallback(() => {
    if (cfg && session?.verified) void signOutRemote(cfg, session.verified.accessToken);
    storeRefresh(null);
    setSession(null);
  }, [cfg, session]);
  // Plans are a commercial setting held in this browser; they grant no approval, review or execution rights.
  const upgradeTo = useCallback((plan: Plan) => setSession((s) => (s ? { ...s, plan } : s)), []);
  const upgrade = useCallback(() => upgradeTo("pro"), [upgradeTo]);

  // keep a verified session fresh; a development session ends after 8 hours and says why
  useEffect(() => {
    if (!session) return;
    const ms = session.expiresAt - Date.now() - 60_000;
    const t = setTimeout(() => {
      if (session.mode === "email_link" && cfg && session.verified) {
        void refreshSession(cfg, session.verified.refreshToken)
          .then(async (v) => { storeRefresh(v.refreshToken); setSession(await verifiedConsoleSession(cfg, v, session.plan)); })
          .catch(() => { storeRefresh(null); setSession(null); setError("Your session expired. Sign in again with a new link."); });
      } else {
        setSession(null); setError("Your session ended after 8 hours, so you were signed out. Sign in again to continue.");
      }
    }, Math.max(ms, 0));
    return () => clearTimeout(t);
  }, [session, cfg]);

  // Activate the account-scoped backend: a verified session runs as its own
  // Supabase user (RLS scopes to auth.uid()); a development session uses this browser.
  useEffect(() => {
    if (!session) return;
    void activateBackend({
      id: session.founderId,
      role: session.verified ? (session.side ?? "founder") : accountRoleOf(session.role),
      name: session.email,
      createdAt: new Date().toISOString(),
    }, session.verified ? { accessToken: session.verified.accessToken, userId: session.verified.userId } : undefined);
  }, [session]);

  const has = useCallback((scope: string) => !!session?.scopes.includes(scope), [session]);

  const value = useMemo<AuthCtx>(() => ({ session, mode, signIn, sendLink, passwordLogin, createAccount, resetPassword, oauth, linkSentTo, chooseSide, signOut, upgrade, upgradeTo, has, loading, ready, error }),
    [session, mode, signIn, sendLink, passwordLogin, createAccount, resetPassword, oauth, linkSentTo, chooseSide, signOut, upgrade, upgradeTo, has, loading, ready, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
