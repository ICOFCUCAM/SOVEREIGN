import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button, Field, inputCls } from "../lib/ui";
import type { Role } from "../lib/access";
import type { Side } from "../lib/email-auth";
import { ExchangeMark } from "../components/ExchangeMark";

// Sign-in. Production builds sign in with a one-time e-mail link (Supabase
// Auth); the person chooses whether they are selling or buying, and privileged
// roles are granted server-side only. Development builds keep a local form that
// opens a browser-only session and says so. No social sign-in is offered: none
// is connected, so a provider button would claim something that did not happen.


const SideChooser: React.FC<{ value: Side; onChange: (s: Side) => void; legend: string }> = ({ value, onChange, legend }) => (
  <fieldset>
    <legend className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">{legend}</legend>
    <div className="grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-ink-900/60 p-1">
      {SIDES.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`rounded px-2 py-1.5 text-[12px] font-semibold transition ${value === v ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}>{l}</button>
      ))}
    </div>
  </fieldset>
);
const SIDES: Array<[Side, string]> = [["founder", "Selling a company"], ["buyer", "Buying companies"]];

/** A verified account that has not yet said whether it sells or buys. */
export const ChooseSide: React.FC = () => {
  const { chooseSide, session, error } = useAuth();
  const [side, setSide] = useState<Side>("founder");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-ink-800/60 p-6">
        <h1 className="text-lg font-bold text-white">One question before you start</h1>
        <p className="text-[13px] text-white/60">Signed in as <span className="font-semibold text-white">{session?.email}</span>. Are you selling a company or buying companies? This sets your workspace; you can ask us to change it later.</p>
        <SideChooser value={side} onChange={setSide} legend="I am" />
        {error && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
        <Button className="w-full" disabled={busy} onClick={() => { setBusy(true); void chooseSide(side).finally(() => setBusy(false)); }}>Continue</Button>
      </div>
    </div>
  );
};

const SignIn: React.FC = () => {
  const { mode } = useAuth();
  return mode === "email_link" ? <EmailLinkSignIn /> : <DevelopmentSignIn />;
};

const Frame: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  // the tab says where the reader is; the site's title returns when they leave
  useEffect(() => {
    const site = document.title;
    document.title = `${title} · ExitOS`;
    return () => { document.title = site; };
  }, [title]);
  return (
    <div className="relative flex min-h-full items-center justify-center px-4 py-10">
      {/* the way back to the site, for a reader who arrived here by mistake or wants to read first */}
      <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-medium text-white/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400 sm:left-6 sm:top-6">
        <span aria-hidden>←</span> ExitOS home
      </Link>
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <ExchangeMark size={52} detail className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/50">Institutional acquisition infrastructure</p>
        </div>
        {children}
        <p className="mt-4 text-center text-[11px] text-white/30">
          New to ExitOS? Signing in creates your account. Operator, counsel and approver access is granted by ExitOS, never from this screen. By continuing you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

const EmailLinkSignIn: React.FC = () => {
  const { sendLink, linkSentTo, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [side, setSide] = useState<Side>("founder");
  return (
    <Frame title="Sign in to ExitOS">
      <div className="space-y-4 rounded-xl border border-white/10 bg-ink-800/60 p-6">
        {linkSentTo ? (
          <div role="status" className="space-y-2 text-[13px] text-white/75">
            <p className="font-semibold text-white">Check your inbox</p>
            <p>We sent a sign-in link to <span className="font-semibold text-white">{linkSentTo}</span>. Open it on this device to sign in; it works once and expires within an hour.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void sendLink(email, side).catch(() => {}); }} className="space-y-4">
            <SideChooser value={side} onChange={setSide} legend="I am" />
            <Field label="Work e-mail">
              <input className={inputCls} type="email" name="email" autoComplete="email" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            {error && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            <Button type="submit" disabled={loading || !email} className="w-full">{loading ? "Sending…" : "E-mail me a sign-in link"}</Button>
            <p className="text-[11px] text-white/40">No password. The link proves you control this address.</p>
          </form>
        )}
      </div>
    </Frame>
  );
};

/** Development builds only: a local session in this browser, with no server identity. */
const DevelopmentSignIn: React.FC = () => {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<Role>("founder");

  return (
    <Frame title="Sign in (development)">
      <div className="space-y-4 rounded-xl border border-white/10 bg-ink-800/60 p-6">
        <p role="note" className="rounded-md border border-loi-400/40 bg-loi-500/10 px-3 py-2 text-[12px] leading-snug text-loi-300">
          Development build: credentials aren't checked. Any e-mail and password open a local session in this browser, with no server identity. Production builds sign in with an e-mail link.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); signIn(email.trim(), password, role).catch(() => {}); }} className="space-y-4">
          <SideChooser value={role === "buyer" ? "buyer" : "founder"} onChange={(s) => setRole(s)} legend="I am" />
          <Field label="Email">
            <input className={inputCls} type="email" name="email" autoComplete="username" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          {/* the reveal toggle sits outside the label, so the field's name stays "Password" */}
          <div className="relative">
            <Field label="Password">
              <input className={`${inputCls} pr-16`} type={showPw ? "text" : "password"} name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute bottom-1.5 right-1.5 rounded px-2 py-1 text-[11px] font-semibold text-white/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">{showPw ? "Hide" : "Show"}</button>
          </div>
          {error && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
          <Button type="submit" disabled={loading || !email || !password} className="w-full">
            {loading ? "Authenticating…" : "Sign in"}
          </Button>
        </form>
      </div>
    </Frame>
  );
};

export default SignIn;
