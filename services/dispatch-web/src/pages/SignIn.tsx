import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ssoStartUrl } from "../lib/api";
import { Button, Field, inputCls } from "../lib/ui";
import { DispatchMark } from "../components/brand";

// Institutional sign-in. People authenticate through their institution's identity
// provider (item 2) — they enter their work email and are routed to their own
// IdP; Dispatch never holds their password. Service credentials (a client_id +
// secret) remain, but for MACHINES & integrations, not people — kept as a
// secondary path. Human SSO and the machine path both resolve to the same session.
const SignIn: React.FC = () => {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [ssoErr, setSsoErr] = useState<string | null>(() => {
    const h = new URLSearchParams(window.location.hash.slice(1));
    const e = h.get("sso_error");
    if (e) history.replaceState(null, "", window.location.pathname + window.location.search);
    return e ? ssoErrorCopy(e) : null;
  });
  const [showService, setShowService] = useState(false);
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");

  const startSso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setSsoErr("Enter your full work email address."); return; }
    setSsoErr(null);
    window.location.href = ssoStartUrl(email.trim().toLowerCase(), window.location.origin + "/console");
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <DispatchMark className="h-8 w-8 text-seal-light" />
            <span className="text-lg font-bold tracking-tight text-white">SOVEREIGN <span className="text-seal-light">DISPATCH</span></span>
          </div>
          <p className="mt-1 text-sm text-white/50">From information to official record.</p>
        </div>

        {ssoErr && <div className="mb-4 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{ssoErr}</div>}

        {/* primary — institutional sign-in (people) */}
        <form onSubmit={startSso} className="space-y-4 rounded-lg border border-white/10 bg-ink-800/60 p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Sign in to your institution</div>
          <Field label="Work email">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ministry.gov" autoFocus />
          </Field>
          <Button type="submit" className="w-full">Continue</Button>
          <p className="text-[11px] leading-snug text-white/35">You'll be taken to your institution's secure sign-in. Dispatch never stores your password.</p>
        </form>

        {/* secondary — service credential (machines & integrations) */}
        <div className="mt-4 text-center">
          <button onClick={() => setShowService((s) => !s)} className="text-[12px] font-semibold text-white/40 hover:text-white">
            {showService ? "Hide service credential" : "Sign in with a service credential"}
          </button>
        </div>
        {showService && (
          <form
            onSubmit={(e) => { e.preventDefault(); signIn(clientId.trim(), secret).catch(() => {}); }}
            className="mt-3 space-y-4 rounded-lg border border-white/10 bg-ink-800/40 p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Service credential · machines, integrations &amp; bootstrap</div>
            <p className="-mt-1 text-[11px] leading-snug text-white/35">For system-to-system callers and for the first administrator standing up the institution before sign-in is connected.</p>
            <Field label="Client ID"><input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="svc-…" /></Field>
            <Field label="Secret"><input className={inputCls} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="••••••••" /></Field>
            {error && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            <Button type="submit" variant="ghost" disabled={loading || !clientId || !secret} className="w-full">
              {loading ? "Authenticating…" : "Sign in with credential"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-[12px] text-white/40">
          New institution? <Link to="/signup" className="font-semibold text-seal-light hover:text-white">Create a free account</Link>
        </p>
        <p className="mt-2 text-center text-[11px] text-white/30">Sessions are held in memory and expire automatically.</p>
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
