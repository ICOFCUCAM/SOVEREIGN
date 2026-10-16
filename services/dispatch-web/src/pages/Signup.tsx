import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { signup, type SignupResponse, humanError } from "../lib/api";
import { AuthFrame, AuthCard, AUTH_LABEL } from "../components/AuthFrame";
import { Gilt, GOLD, FIELD, ACTION as BTN } from "../components/premium";
import { Icon } from "../components/console/icons";
import { track } from "../lib/analytics";

// Public self-serve signup — an institution creates its account and receives its ADMINISTRATOR KEY
// (client_id + secret, shown once). The key signs the first administrator in; the set-up then establishes the
// institution (structure, approval rules, people) before the console opens. The Evaluation is free for 30
// days and 10 official records, whichever comes first (M26).
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
    try { await signIn(cred.client_id, cred.secret); nav("/setup"); }
    catch { setErr("could not sign in — copy your secret and use the sign-in page"); setEntering(false); }
  };

  return (
    <AuthFrame eyebrow="A new institution" title={cred ? <>Your account is <Gilt>ready</Gilt></> : <>Create your <Gilt>institution's</Gilt> account</>}
      lede={cred ? undefined : <>Issue official records under your institution's seal. <span className="text-sd-text">Free for 30 days, with 10 official records</span> to evaluate.</>}
      below={<p className="text-[12.5px] text-sd-text3">Already have an account? <Link to="/console" className="font-semibold text-sd-gold hover:text-sd-text">Sign in</Link></p>}>
      {!cred ? (
        <AuthCard>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label htmlFor="su-inst" className={AUTH_LABEL}>Institution name</label>
              <input id="su-inst" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ministry of Finance" autoFocus />
              <span className="mt-1.5 block text-[12px] text-sd-text3">For example “Ministry of Finance” or “Bank of X”.</span>
            </div>
            {err && <div role="alert" className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-200">{err}</div>}
            <button type="submit" disabled={busy || name.trim().length < 2} className={`${BTN} ${GOLD} w-full`}>{busy ? "Creating…" : "Create free account"}</button>
            <p className="text-center text-[11.5px] text-sd-faint">No card required. You'll receive your institution's administrator key.</p>
          </form>
        </AuthCard>
      ) : (
        <AuthCard tone="ok">
          <div className="flex items-center gap-2.5 text-[14px] font-semibold text-sd-ok"><Icon.check className="h-4 w-4" />Your institution's account is ready</div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-sd-text2">This is your <span className="text-sd-text">administrator key</span>. Use it under <span className="text-sd-text">Administrator or system key</span> on the sign-in page until you've invited your people. Save the secret now, for example in a password manager: it is shown only once and cannot be retrieved.</p>
          <dl className="mt-5 space-y-3">
            <div>
              <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sd-text3">Client ID</dt>
              <dd><code className="block select-all rounded-[10px] border border-sd-line bg-[#0b131d] px-3.5 py-2.5 font-mono text-[12.5px] text-sd-text">{cred.client_id}</code></dd>
            </div>
            <div>
              <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sd-text3">Secret</dt>
              <dd className="flex items-stretch gap-2">
                <code className="block min-w-0 flex-1 select-all break-all rounded-[10px] border border-sd-gold/30 bg-[linear-gradient(180deg,rgba(201,173,117,0.08),rgba(11,19,29,0.9))] px-3.5 py-2.5 font-mono text-[12.5px] text-[#f3e2b6]">{cred.secret}</code>
                <button type="button" className="shrink-0 rounded-[10px] border border-sd-line px-3 text-[12.5px] font-semibold text-sd-text2 transition hover:border-sd-gold/40 hover:text-sd-text"
                  onClick={() => { navigator.clipboard?.writeText(cred.secret).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? "Copied" : "Copy"}</button>
              </dd>
            </div>
          </dl>
          {err && <div role="alert" className="mt-4 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-200">{err}</div>}
          <button type="button" className={`${BTN} ${GOLD} mt-6 w-full`} disabled={entering} onClick={enter}>{entering ? "Entering…" : <>I've saved it, set up my institution <Icon.arrowRight className="h-4 w-4" /></>}</button>
        </AuthCard>
      )}
    </AuthFrame>
  );
};

export default Signup;
