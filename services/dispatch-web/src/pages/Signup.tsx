import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { signup, type SignupResponse, humanError } from "../lib/api";
import { Button, Field, inputCls } from "../lib/ui";
import { track } from "../lib/analytics";

// Public self-serve signup — an institution creates a FREE account and receives
// its first credential (client_id + secret, shown once). It can then sign into
// the console, create up to the free quota, and subscribe to download.
const Signup: React.FC = () => {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cred, setCred] = useState<SignupResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [entering, setEntering] = useState(false);

  // Signup funnel: started on arrival, completed on account creation, abandoned
  // if the visitor leaves before creating one. `done` distinguishes the two exits.
  const done = useRef(false);
  useEffect(() => {
    track("signup.started");
    return () => { if (!done.current) track("signup.abandoned"); };
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      setCred(await signup(name.trim()));
      done.current = true;
      track("signup.completed");
    }
    catch (e2) { setErr(humanError(e2, "We couldn't create your account. Please try again.")); }
    finally { setBusy(false); }
  };
  const enter = async () => {
    if (!cred) return;
    setEntering(true);
    try { await signIn(cred.client_id, cred.secret); nav("/console"); }
    catch { setErr("could not sign in — copy your secret and use the sign-in page"); setEntering(false); }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-seal text-lg font-black text-white">SD</div>
          <h1 className="text-xl font-bold text-white">Create your institution account</h1>
          <p className="mt-1 text-sm text-white/50">Issue official records under your institution's seal. <span className="text-white/70">3 official records included</span> to evaluate.</p>
        </div>

        {!cred ? (
          <form onSubmit={create} className="space-y-4 rounded-lg border border-white/10 bg-ink-800/60 p-6">
            <Field label="Institution name" hint="e.g. “Ministry of Finance”, “Bank of X”.">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ministry of Finance" autoFocus />
            </Field>
            {err && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}
            <Button type="submit" disabled={busy || name.trim().length < 2} className="w-full">{busy ? "Creating…" : "Create free account"}</Button>
            <p className="text-center text-[11px] text-white/30">No card required. You'll get an API credential to sign in with.</p>
          </form>
        ) : (
          <div className="space-y-4 rounded-lg border border-emerald-500/40 bg-ink-800/60 p-6">
            <div>
              <div className="text-sm font-bold text-emerald-300">Account created — 3 official records included</div>
              <div className="mt-0.5 text-xs text-white/50">Save this secret now. It is shown only once and cannot be retrieved again.</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-white/40">Client ID</span>
                <code className="select-all rounded bg-ink-900/70 px-2 py-1 font-mono text-[12.5px] text-white/85">{cred.client_id}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-white/40">Secret</span>
                <code className="select-all break-all rounded bg-ink-900/70 px-2 py-1 font-mono text-[12.5px] text-emerald-200">{cred.secret}</code>
                <Button variant="ghost" className="shrink-0 px-2.5 py-1 text-[12px]" onClick={() => { navigator.clipboard?.writeText(cred.secret).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? "Copied" : "Copy"}</Button>
              </div>
            </div>
            {err && <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}
            <Button variant="primary" className="w-full" disabled={entering} onClick={enter}>{entering ? "Entering…" : "Enter the console →"}</Button>
          </div>
        )}

        <p className="mt-4 text-center text-[12px] text-white/40">
          Already have a credential? <Link to="/console" className="font-semibold text-seal-light hover:text-white">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
