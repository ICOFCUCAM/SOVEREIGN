import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Field } from "../lib/ui";
import { useI18n } from "../lib/i18n";
import { Dial, INSTRUMENT_CSS } from "../components/HeroInstrument";
import type { Side, OAuthProvider } from "../lib/email-auth";
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

const SignIn: React.FC = () => <AccessForm />;

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

// provider marks for the sign-in buttons
const GoogleMark = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.2 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
);
const AppleMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4s-2.4-.9-2.4-3.9zM14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z"/></svg>
);
const MicrosoftMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
);
const PROVIDERS: ReadonlyArray<readonly [OAuthProvider, string, React.FC]> = [["google", "Google", GoogleMark], ["apple", "Apple", AppleMark], ["azure", "Microsoft", MicrosoftMark]];
const SOCIAL = "flex w-full items-center justify-center gap-2.5 rounded-[3px] border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-ex-ivory transition hover:border-ex-bronze/40 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze";
const TEXT_LINK = "rounded text-[12px] font-semibold text-ex-bronze transition hover:text-ex-ivory focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze";

// Sign-in: Google, Apple or Microsoft; e-mail and password with a reset; or a one-time e-mail link.
// Production builds go through Supabase Auth (OAuth, password grant, recover, OTP link); development
// builds open a local session.
const AccessForm: React.FC = () => {
  const { mode, oauth, passwordLogin, createAccount, resetPassword, sendLink, linkSentTo, loading, error } = useAuth();
  const [view, setView] = useState<"signin" | "signup" | "reset">("signin");
  const [confirm, setConfirm] = useState("");
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);
  const [side, setSide] = useState<Side>("founder");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const live = mode === "email_link";
  const signup = view === "signup";
  const mismatch = signup && confirm.length > 0 && confirm !== password;
  const tooShort = signup && password.length > 0 && password.length < 8;
  const canSubmit = !!email && !!password && (!signup || (password.length >= 8 && confirm === password));
  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!canSubmit) return;
    if (signup) void createAccount(email, password, side).then((r) => { if (r === "confirm") setConfirmSentTo(email.trim()); }).catch(() => {});
    else void passwordLogin(email, password, side).catch(() => {});
  };

  if (view === "reset") return (
    <Frame title="Reset your password" lede="Enter the e-mail on your account and we'll send a link to sign you back in.">
      {resetSent ? (
        <div role="status" className="space-y-4">
          <div className="rounded-[3px] border border-ex-bronze/30 bg-ex-bronze/[0.06] p-4 text-[13px] text-white/75">
            <p className="font-semibold text-ex-ivory">Check your inbox</p>
            <p className="mt-1">If an account exists for <span className="font-semibold text-ex-ivory">{email}</span>, a reset link is on its way.</p>
          </div>
          <button type="button" className={PRIMARY} onClick={() => { setView("signin"); setResetSent(false); }}>Back to sign in</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void resetPassword(email).then(() => setResetSent(true)).catch(() => {}); }} className="space-y-5">
          <Field label="Email"><input className={INPUT} type="email" name="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
          {error && <div role="alert" className="rounded-[3px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
          <button type="submit" disabled={loading || !email} className={PRIMARY}>{loading ? "Sending…" : <>Send reset link <span aria-hidden>→</span></>}</button>
          <button type="button" onClick={() => setView("signin")} className={`${TEXT_LINK} block w-full text-center`}>Back to sign in</button>
        </form>
      )}
    </Frame>
  );

  return (
    <Frame title={signup ? "Create your account" : "Access the Exchange"}
      lede={signup ? "Join the exchange as a seller or a buyer. Your workspace is set up the moment you sign in." : undefined}>
      {confirmSentTo ? (
        <div role="status" className="space-y-4">
          <div className="rounded-[3px] border border-ex-bronze/30 bg-ex-bronze/[0.06] p-4 text-[13px] text-white/75">
            <p className="font-semibold text-ex-ivory">Confirm your e-mail</p>
            <p className="mt-1">We sent a confirmation link to <span className="font-semibold text-ex-ivory">{confirmSentTo}</span>. Open it to activate your account; you'll be signed in straight away.</p>
          </div>
          <button type="button" className={PRIMARY} onClick={() => { setConfirmSentTo(null); setView("signin"); }}>Back to sign in</button>
        </div>
      ) : linkSentTo ? (
        <div role="status" className="space-y-2 rounded-[3px] border border-ex-bronze/30 bg-ex-bronze/[0.06] p-4 text-[13px] text-white/75">
          <p className="font-semibold text-ex-ivory">Check your inbox</p>
          <p>We sent a sign-in link to <span className="font-semibold text-ex-ivory">{linkSentTo}</span>. Open it on this device to sign in; it works once and expires within an hour.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <SideChooser value={side} onChange={setSide} legend="I am" />
          <div className="space-y-2.5">
            {PROVIDERS.map(([p, name, Mark]) => (
              <button key={p} type="button" onClick={() => oauth(p, side)} className={SOCIAL}><Mark /> {signup ? "Sign up" : "Continue"} with {name}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/30"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <input className={INPUT} type="email" name="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            {/* the reveal toggle sits outside the label, so the field's name stays "Password" */}
            <div className="relative">
              <Field label="Password">
                <input className={`${INPUT} pr-16`} type={showPw ? "text" : "password"} name="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? "At least 8 characters" : "••••••••"}
                  aria-invalid={tooShort || undefined} aria-describedby={signup ? "pw-hint" : undefined} />
              </Field>
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute bottom-2 right-1.5 rounded px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 hover:text-ex-bronze focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze">{showPw ? "Hide" : "Show"}</button>
            </div>
            {signup ? (<>
              <p id="pw-hint" className={`-mt-2 text-[11.5px] ${tooShort ? "text-red-300" : "text-white/40"}`}>At least 8 characters.</p>
              <Field label="Confirm password">
                <input className={INPUT} type={showPw ? "text" : "password"} name="confirm-password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password"
                  aria-invalid={mismatch || undefined} aria-describedby="pw-match" />
              </Field>
              {mismatch && <p id="pw-match" className="-mt-2 text-[11.5px] text-red-300">The passwords don't match.</p>}
            </>) : (
              <div className="flex justify-end -mt-1"><button type="button" onClick={() => setView("reset")} className={TEXT_LINK}>Forgot password?</button></div>
            )}
            {error && <div role="alert" className="rounded-[3px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            <button type="submit" disabled={loading || !canSubmit} className={PRIMARY}>{loading ? (signup ? "Creating your account…" : "Signing in…") : <>{signup ? "Create account" : "Sign in"} <span aria-hidden>→</span></>}</button>
          </form>
          <p className="text-center text-[12.5px] text-white/50">
            {signup ? "Already have an account?" : "New to ExitOS?"}{" "}
            <button type="button" onClick={() => { setView(signup ? "signin" : "signup"); setConfirm(""); }} className={TEXT_LINK}>{signup ? "Sign in" : "Create an account"}</button>
          </p>
          {live && !signup && (
            <p className="text-center text-[12px] text-white/45">
              Prefer no password?{" "}
              <button type="button" disabled={loading || !email} onClick={() => { void sendLink(email, side).catch(() => {}); }} className={`${TEXT_LINK} disabled:opacity-40`}>E-mail me a sign-in link</button>
            </p>
          )}
        </div>
      )}
    </Frame>
  );
};

export default SignIn;
