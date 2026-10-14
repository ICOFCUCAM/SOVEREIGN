import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Field } from "../lib/ui";
import { useI18n } from "../lib/i18n";
import { Dial, INSTRUMENT_CSS } from "../components/HeroInstrument";
import type { Role } from "../lib/access";
import type { Side } from "../lib/email-auth";
import { ExchangeMark } from "../components/ExchangeMark";

// Sign-in. Production builds sign in with a one-time e-mail link (Supabase
// Auth); the person chooses whether they are selling or buying, and privileged
// roles are granted server-side only. Development builds keep a local form that
// opens a browser-only session and says so. No social sign-in is offered: none
// is connected, so a provider button would claim something that did not happen.
//
// The page is the threshold of the exchange: a graphite panel carrying the homepage's living
// instrument (decorative, no market data) and the five steps of an exit, beside the form.

// the form's own controls, in the console's graphite and bronze
const INPUT = "block w-full rounded-[3px] border border-white/10 bg-black/30 px-3 py-2.5 text-[14px] text-ex-ivory placeholder:text-white/25 transition focus:border-ex-bronze/70 focus:outline-none focus:ring-2 focus:ring-ex-bronze/20";
const PRIMARY = "flex w-full items-center justify-center gap-2 rounded-[3px] bg-ex-bronze px-4 py-2.5 text-[13.5px] font-semibold text-[#17150f] shadow-[0_8px_24px_-12px_rgba(180,154,117,0.8)] transition hover:bg-ex-ivory disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121311]";


const SideChooser: React.FC<{ value: Side; onChange: (s: Side) => void; legend: string }> = ({ value, onChange, legend }) => (
  <fieldset>
    <legend className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{legend}</legend>
    <div className="grid grid-cols-2 gap-1 rounded-[3px] border border-white/10 bg-black/30 p-1">
      {SIDES.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`rounded-[2px] px-2 py-2 text-[12.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze ${value === v ? "bg-ex-bronze/15 text-ex-ivory shadow-[inset_0_0_0_1px_rgba(180,154,117,0.55)]" : "text-white/50 hover:text-white/85"}`}>{l}</button>
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
    <Frame title="One question before you start" lede={<>Signed in as <span className="font-semibold text-ex-ivory">{session?.email}</span>. Are you selling a company or buying companies? This sets your workspace; you can ask us to change it later.</>}>
      <div className="space-y-5">
        <SideChooser value={side} onChange={setSide} legend="I am" />
        {error && <div role="alert" className="rounded-[3px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
        <button type="button" className={PRIMARY} disabled={busy} onClick={() => { setBusy(true); void chooseSide(side).finally(() => setBusy(false)); }}>Continue <span aria-hidden>→</span></button>
      </div>
    </Frame>
  );
};

const SignIn: React.FC = () => {
  const { mode } = useAuth();
  return mode === "email_link" ? <EmailLinkSignIn /> : <DevelopmentSignIn />;
};

const Frame: React.FC<{ title: string; lede?: React.ReactNode; children: React.ReactNode }> = ({ title, lede, children }) => {
  // the tab says where the reader is; the site's title returns when they leave
  useEffect(() => {
    const site = document.title;
    document.title = `${title} · ExitOS`;
    return () => { document.title = site; };
  }, [title]);
  const { t } = useI18n();
  const { mode } = useAuth();
  const steps = [1, 2, 3, 4, 5].map((k) => t(`hx.s${k}`));
  const [cap, setCap] = useState<number | null>(null);
  return (
    <div className="grid min-h-full bg-[#121311] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <style>{INSTRUMENT_CSS}</style>
      {/* the threshold: the exchange's instrument and the shape of an exit (decorative; no market data) */}
      <aside aria-label="ExitOS" className="relative hidden overflow-hidden border-r border-ex-hair bg-[#1a1b19] lg:flex lg:flex-col"
        style={{ backgroundImage: "radial-gradient(70% 55% at 62% 46%, rgba(180,154,117,0.14), transparent 70%), radial-gradient(40% 30% at 0% 100%, rgba(180,154,117,0.08), transparent 70%)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(232,224,210,0.6) 0 1px, transparent 1px 96px), repeating-linear-gradient(0deg, rgba(232,224,210,0.6) 0 1px, transparent 1px 96px)", maskImage: "radial-gradient(ellipse at 60% 45%, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 60% 45%, #000, transparent 75%)" }} />
        <div className="relative flex items-center justify-between px-10 pt-9">
          <Link to="/" className="flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze">
            <ExchangeMark size={30} />
            <span className="text-[15px] font-bold tracking-tight text-ex-ivory">ExitOS</span>
          </Link>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-ex-bronze/80">A sovereign infrastructure</span>
        </div>
        <div className="relative flex flex-1 items-center justify-center px-10">
          <div className="h-[min(36vw,480px)] w-[min(36vw,480px)]"><Dial active={cap} onPoint={setCap} labels={steps} /></div>
        </div>
        <div className="relative px-10 pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ex-bronze">Intelligence · Opportunities · Execution</p>
          <h2 className="mt-3 max-w-md text-[26px] font-semibold leading-[1.15] tracking-tight text-ex-ivory">The exchange where companies are prepared, discovered and sold.</h2>
          <ol className="mt-6 grid grid-cols-5 gap-px overflow-hidden rounded-[3px] border border-ex-hair bg-ex-hair">
            {steps.map((label, i) => (
              <li key={label} onMouseEnter={() => setCap(i)} onMouseLeave={() => setCap(null)}
                className={`bg-[#1a1b19] px-3 py-2.5 transition ${cap === i ? "bg-[#23231f]" : ""}`}>
                <span className={`block font-mono text-[10px] tabular-nums ${cap === i ? "text-ex-bronze" : "text-white/35"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-white/70">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* the door */}
      <main className="relative flex min-h-full flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          {/* the way back to the site, for a reader who arrived here by mistake or wants to read first */}
          <Link to="/" className="inline-flex items-center gap-1.5 rounded px-1 py-1 text-[12px] font-medium text-white/50 transition hover:text-ex-ivory focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze">
            <span aria-hidden>←</span> ExitOS home
          </Link>
          <span className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.24em] text-white/35">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${mode === "email_link" ? "bg-ex-bronze shadow-[0_0_8px_rgba(180,154,117,0.9)]" : "bg-loi-400"}`} />{mode === "email_link" ? "E-mail link sign-in" : "Development build"}
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <ExchangeMark size={44} detail className="mb-6 lg:hidden" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ex-bronze">Access the exchange</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ex-ivory">{title}</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{lede ?? "Institutional acquisition infrastructure: value, buyers, NDAs and the transaction, in one place."}</p>
          </div>
          {children}
          <p className="mt-8 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-white/35">
            New to ExitOS? Signing in creates your account. Operator, counsel and approver access is granted by ExitOS, never from this screen. By continuing you agree to the Terms and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
};

const EmailLinkSignIn: React.FC = () => {
  const { sendLink, linkSentTo, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [side, setSide] = useState<Side>("founder");
  return (
    <Frame title="Sign in to ExitOS">
      <div>
        {linkSentTo ? (
          <div role="status" className="space-y-2 rounded-[3px] border border-ex-bronze/30 bg-ex-bronze/[0.06] p-4 text-[13px] text-white/75">
            <p className="font-semibold text-ex-ivory">Check your inbox</p>
            <p>We sent a sign-in link to <span className="font-semibold text-white">{linkSentTo}</span>. Open it on this device to sign in; it works once and expires within an hour.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void sendLink(email, side).catch(() => {}); }} className="space-y-5">
            <SideChooser value={side} onChange={setSide} legend="I am" />
            <Field label="Work e-mail">
              <input className={INPUT} type="email" name="email" autoComplete="email" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            {error && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            <button type="submit" disabled={loading || !email} className={PRIMARY}>{loading ? "Sending…" : <>E-mail me a sign-in link <span aria-hidden>→</span></>}</button>
            <p className="flex items-center gap-2 text-[11.5px] text-white/40"><svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>No password. The link proves you control this address.</p>
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
      <div className="space-y-5">
        <p role="note" className="rounded-[3px] border border-loi-400/40 bg-loi-500/10 px-3 py-2 text-[12px] leading-snug text-loi-300">
          Development build: credentials aren't checked. Any e-mail and password open a local session in this browser, with no server identity. Production builds sign in with an e-mail link.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); signIn(email.trim(), password, role).catch(() => {}); }} className="space-y-5">
          <SideChooser value={role === "buyer" ? "buyer" : "founder"} onChange={(s) => setRole(s)} legend="I am" />
          <Field label="Email">
            <input className={INPUT} type="email" name="email" autoComplete="username" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          {/* the reveal toggle sits outside the label, so the field's name stays "Password" */}
          <div className="relative">
            <Field label="Password">
              <input className={`${INPUT} pr-16`} type={showPw ? "text" : "password"} name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute bottom-2 right-1.5 rounded px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 hover:text-ex-bronze focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze">{showPw ? "Hide" : "Show"}</button>
          </div>
          {error && <div role="alert" className="rounded-[3px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
          <button type="submit" disabled={loading || !email || !password} className={PRIMARY}>
            {loading ? "Authenticating…" : <>Sign in <span aria-hidden>→</span></>}
          </button>
        </form>
      </div>
    </Frame>
  );
};

export default SignIn;
