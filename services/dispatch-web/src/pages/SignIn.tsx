import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ssoStartUrl, signInMethod, passwordSignIn, humanError } from "../lib/api";
import { Button, Field, inputCls } from "../lib/ui";
import { DispatchMark, FilmGrain } from "../components/brand";
import { Icon } from "../components/console/icons";

// Sign-in — three doors, each named for who it is for, so nobody has to guess which form is theirs:
//   • People at an institution: their work email. Where the email's domain has an identity-provider
//     connection, they go to their institution's own sign-in (Dispatch never sees that password);
//     otherwise they enter the password they set from their invitation. The domain alone decides which —
//     the form never reveals whether an address has an account.
//   • A new institution: create the institution's account (/signup).
//   • An administrator key: the key issued when the institution was created, or an integration's key.
// All three end in the same in-memory session; what it can do is decided by the API on every call.
type Door = "person" | "new" | "key";

const DOORS: { id: Door; title: string; line: string; icon: keyof typeof Icon }[] = [
  { id: "person", title: "I work at an institution", line: "Sign in with your work email.", icon: "user" },
  { id: "new", title: "Set up a new institution", line: "Create your institution's account.", icon: "building" },
  { id: "key", title: "Administrator or system key", line: "The key from your institution's creation, or an integration's.", icon: "lock" },
];

const SignIn: React.FC = () => {
  const { signIn, signInPerson, loading, error, notice } = useAuth();
  const [door, setDoor] = useState<Door>("person");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(() => {
    const h = new URLSearchParams(window.location.hash.slice(1));
    const e = h.get("sso_error");
    if (e) history.replaceState(null, "", window.location.pathname + window.location.search);
    return e ? ssoErrorCopy(e) : null;
  });
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");

  const continueWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr.includes("@")) { setMsg("Enter your full work email address."); return; }
    setMsg(null);
    if (step === "password") {
      setBusy(true);
      try { signInPerson(await passwordSignIn(addr, password)); }
      catch (err) { setMsg(humanError(err, "Sign-in could not be completed. Please try again.")); }
      finally { setBusy(false); }
      return;
    }
    setBusy(true);
    try {
      const { method } = await signInMethod(addr);
      if (method === "sso") { window.location.href = ssoStartUrl(addr, window.location.origin + "/console"); return; }
      setStep("password");
    } catch (err) { setMsg(humanError(err, "Sign-in could not be started. Please try again.")); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-12">
      <FilmGrain />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_0%,rgba(233,200,120,0.07),transparent_70%)]" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-7 text-center">
          <a href="/" className="mb-4 inline-flex items-center justify-center gap-2.5">
            <DispatchMark className="h-8 w-8 text-seal-light" />
            <span className="text-lg font-bold tracking-tight text-white">SOVEREIGN <span className="text-seal-light">DISPATCH</span></span>
          </a>
          <p className="mt-1 text-sm text-white/50">From information to official record.</p>
        </div>

        {notice && <div role="status" className="mb-4 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{notice}</div>}

        {/* the three doors */}
        <div role="tablist" aria-label="How you sign in" className="mb-3 grid gap-2">
          {DOORS.map((d) => {
            const on = door === d.id;
            return (
              <button key={d.id} role="tab" type="button" aria-selected={on} aria-controls={`door-${d.id}`} id={`tab-${d.id}`}
                onClick={() => { setDoor(d.id); setMsg(null); }}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal-light/60 ${on ? "border-seal-light/45 bg-seal/15" : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"}`}>
                <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ${on ? "text-seal-light ring-seal-light/50" : "text-white/45 ring-white/15"}`}>
                  {React.createElement(Icon[d.icon], { className: "h-4 w-4" })}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[13.5px] font-semibold ${on ? "text-white" : "text-white/75"}`}>{d.title}</span>
                  <span className="block text-[12px] leading-snug text-white/45">{d.line}</span>
                </span>
                <span aria-hidden className={`h-3.5 w-3.5 shrink-0 rounded-full border ${on ? "border-seal-light bg-seal-light shadow-[inset_0_0_0_2px_#0b1220]" : "border-white/25"}`} />
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.012] p-7 shadow-[0_30px_80px_-44px_rgba(0,0,0,0.9)]">
          {door === "person" && (
            <form id="door-person" role="tabpanel" aria-labelledby="tab-person" onSubmit={continueWithEmail} className="space-y-4">
              <Field label="Work email">
                <input className={inputCls} type="email" autoComplete="username" value={email} autoFocus
                  onChange={(e) => { setEmail(e.target.value); if (step === "password") { setStep("email"); setPassword(""); } }} placeholder="name@institution.org" />
              </Field>
              {step === "password" && (
                <Field label="Password">
                  <input className={inputCls} type="password" autoComplete="current-password" value={password} autoFocus onChange={(e) => setPassword(e.target.value)} />
                </Field>
              )}
              {msg && <div role="alert" className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{msg}</div>}
              <Button type="submit" className="w-full" disabled={busy || (step === "password" && !password)}>
                {busy ? "One moment…" : step === "password" ? "Sign in" : "Continue"}
              </Button>
              <p className="text-[11.5px] leading-snug text-white/40">
                {step === "password"
                  ? "Use the password you set from your invitation. Forgotten it? Ask your administrator for a new invitation link."
                  : "If your institution has its own sign-in, you'll be taken there. Otherwise you'll enter the password you set from your invitation."}
              </p>
            </form>
          )}

          {door === "new" && (
            <div id="door-new" role="tabpanel" aria-labelledby="tab-new" className="space-y-4">
              <p className="text-[13px] leading-relaxed text-white/65">Create your institution's account in a minute. The <span className="text-white/85">Evaluation is free for 30 days and includes 10 official records</span>; no card is needed.</p>
              <ol className="space-y-1.5 text-[12.5px] text-white/55">
                <li><span className="mr-1.5 font-mono text-seal-light">1</span>Name your institution and receive its administrator key.</li>
                <li><span className="mr-1.5 font-mono text-seal-light">2</span>A guided set-up establishes your offices, approval rules and people.</li>
                <li><span className="mr-1.5 font-mono text-seal-light">3</span>Invite your people; they sign in with their work email.</li>
              </ol>
              <Link to="/signup" className="flex h-10 w-full items-center justify-center rounded-md bg-seal text-sm font-semibold text-white transition hover:bg-seal-light">Create your institution's account →</Link>
            </div>
          )}

          {door === "key" && (
            <form id="door-key" role="tabpanel" aria-labelledby="tab-key" onSubmit={(e) => { e.preventDefault(); signIn(clientId.trim(), secret).catch(() => {}); }} className="space-y-4">
              <p className="-mt-1 text-[12px] leading-snug text-white/45">For the first administrator, using the key shown when the institution was created, and for systems and integrations. People should use their work email.</p>
              <Field label="Client ID"><input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="svc_…" autoComplete="username" /></Field>
              <Field label="Secret"><input className={inputCls} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="sdk_…" autoComplete="current-password" /></Field>
              {error && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
              <Button type="submit" disabled={loading || !clientId || !secret} className="w-full">{loading ? "Signing in…" : "Sign in with key"}</Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-white/30">Sessions are held in memory and expire automatically.</p>
      </div>
    </div>
  );
};

function ssoErrorCopy(code: string): string {
  if (code === "not_provisioned") return "Your institution hasn't added you yet. Ask your administrator to add you and assign your office.";
  if (code === "NO_SSO" || code === "no_connection") return "Institutional sign-in isn't set up for that email domain yet.";
  if (code.startsWith("idp_")) return "Your institution's sign-in could not be completed. Please try again.";
  return "Sign-in could not be completed. Please try again.";
}

export default SignIn;
