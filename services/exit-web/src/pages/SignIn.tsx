import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button, Field, inputCls } from "../lib/ui";
import { ROLE_LABEL, type Role, type Plan } from "../lib/access";

// Sign-in wizard. Founders and buyers self-serve here; admins are provisioned
// from the back office and the superadmin is bootstrapped by email. Social
// SSO + email/password + password reset. Demo: SSO and reset are illustrative.

const WIZARD_ROLES: Role[] = ["founder", "buyer"];

const GoogleMark = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.2 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
);
const AppleMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4s-2.4-.9-2.4-3.9zM14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z"/></svg>
);
const MicrosoftMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
);

const SignIn: React.FC = () => {
  const { signIn, loading, error } = useAuth();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("founder");
  const [plan, setPlan] = useState<Plan>("free");
  const [resetSent, setResetSent] = useState(false);

  const sso = (provider: string) => signIn(`${role}@${provider}.com`, "sso", role, plan).catch(() => {});

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-deal-400 to-deal-700 text-lg font-black text-white shadow-lg shadow-deal-700/30">EX</div>
          <h1 className="text-xl font-bold text-white">{mode === "reset" ? "Reset your password" : "Sign in to ExitOS"}</h1>
          <p className="mt-1 text-sm text-white/50">The operating system for company exits</p>
        </div>

        {mode === "reset" ? (
          <div className="space-y-4 rounded-xl border border-white/10 bg-ink-800/60 p-6">
            {resetSent ? (
              <>
                <div className="rounded-md border border-deal-500/30 bg-deal-600/10 px-4 py-3 text-[13px] text-deal-200">
                  If an account exists for <span className="font-semibold">{email || "that address"}</span>, a password-reset link is on its way.
                </div>
                <Button className="w-full" onClick={() => { setMode("signin"); setResetSent(false); }}>Back to sign in</Button>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setResetSent(true); }} className="space-y-4">
                <Field label="Email">
                  <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
                </Field>
                <Button type="submit" disabled={!email} className="w-full">Send reset link</Button>
                <button type="button" onClick={() => setMode("signin")} className="block w-full text-center text-xs font-semibold text-white/50 hover:text-white">Back to sign in</button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-white/10 bg-ink-800/60 p-6">
            {/* Social SSO */}
            <div className="space-y-2">
              <button onClick={() => sso("google")} className="flex w-full items-center justify-center gap-2.5 rounded-md border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">
                <GoogleMark /> Continue with Google
              </button>
              <button onClick={() => sso("apple")} className="flex w-full items-center justify-center gap-2.5 rounded-md border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">
                <AppleMark /> Continue with Apple
              </button>
              <button onClick={() => sso("microsoft")} className="flex w-full items-center justify-center gap-2.5 rounded-md border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">
                <MicrosoftMark /> Continue with Microsoft
              </button>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); signIn(email.trim(), password, role, plan).catch(() => {}); }} className="space-y-4">
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">I am a</span>
                <div className="grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-ink-900/60 p-1">
                  {WIZARD_ROLES.map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`rounded px-2 py-1.5 text-[12px] font-semibold transition ${role === r ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}>
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Plan</span>
                <div className="grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-ink-900/60 p-1">
                  {(["free", "pro"] as Plan[]).map((p) => (
                    <button key={p} type="button" onClick={() => setPlan(p)}
                      className={`rounded px-2 py-1.5 text-[12px] font-semibold uppercase transition ${plan === p ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Email">
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </Field>
              <div>
                <Field label="Password">
                  <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </Field>
                <button type="button" onClick={() => { setMode("reset"); setResetSent(false); }} className="mt-1.5 block w-full text-right text-[11px] font-semibold text-deal-300 hover:text-deal-200">
                  Forgot password?
                </button>
              </div>

              {error && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
              <Button type="submit" disabled={loading || !email || !password} className="w-full">
                {loading ? "Authenticating…" : "Sign in"}
              </Button>
            </form>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-white/30">
          New to ExitOS? Choosing Founder or Buyer creates your account. Admin access is provisioned by your organization. By continuing you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default SignIn;
