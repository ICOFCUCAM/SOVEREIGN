import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { invitationDetails, acceptInvitation, humanError, type InvitationDetails } from "../lib/api";
import { Button, Field, inputCls } from "../lib/ui";
import { DispatchMark, FilmGrain } from "../components/brand";

// /invite#token=… — a person accepts their institution's invitation and sets their password. The token is
// read from the URL fragment (never sent to a server log) and scrubbed from the address bar at once. The
// link works once and for 7 days; the API states whether it is still valid before anything is asked.
const MIN = 10;

const AcceptInvitation: React.FC = () => {
  const { signInPerson } = useAuth();
  const nav = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  // read first, then clear the token from the address bar and history (an initialiser must stay pure)
  useEffect(() => { if (window.location.hash.includes("token=")) history.replaceState(null, "", window.location.pathname); }, []);
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setDetails({ state: "unknown", institution: null, email: null, fullName: null, expiresAt: null }); return; }
    invitationDetails(token).then(setDetails).catch((e) => setErr(humanError(e, "This invitation could not be checked. Please try again.")));
  }, [token]);

  const tooShort = pw.length > 0 && pw.length < MIN;
  const mismatch = pw2.length > 0 && pw !== pw2;
  const accept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < MIN || pw !== pw2) return;
    setBusy(true); setErr(null);
    try { signInPerson(await acceptInvitation(token, pw)); nav("/console", { replace: true }); }
    catch (e2) { setErr(humanError(e2, "The invitation could not be accepted. Please try again.")); setBusy(false); }
  };

  const ended: Record<string, string> = {
    used: "This invitation has already been used. Sign in with your work email and the password you set.",
    expired: "This invitation has expired. Ask your administrator for a new link.",
    revoked: "This invitation is no longer valid: a newer one was sent, or your access was removed. Ask your administrator.",
    unknown: "This invitation link is not valid. Check that you opened the whole link, or ask your administrator for a new one.",
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
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.012] p-7 shadow-[0_30px_80px_-44px_rgba(0,0,0,0.9)]">
          {!details && !err && <p className="text-sm text-white/50">Checking your invitation…</p>}
          {err && !details && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}

          {details && details.state !== "valid" && (
            <div className="space-y-4">
              <h1 className="font-serif text-xl font-bold text-white">Invitation not available</h1>
              <p className="text-[13px] leading-relaxed text-white/60">{ended[details.state]}</p>
              <Link to="/console" className="inline-flex text-[13px] font-semibold text-seal-light hover:text-white">Go to sign-in →</Link>
            </div>
          )}

          {details?.state === "valid" && (
            <form onSubmit={accept} className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Invitation</div>
                <h1 className="mt-1.5 font-serif text-[1.45rem] font-bold leading-tight text-white">Welcome, {details.fullName}</h1>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/60"><span className="text-white/85">{details.institution}</span> has invited you to Sovereign Dispatch. Set a password to finish. You'll sign in with <span className="text-white/85">{details.email}</span> and this password.</p>
              </div>
              <input type="email" value={details.email ?? ""} autoComplete="username" readOnly hidden />
              <Field label="Choose a password" hint={`At least ${MIN} characters. A short sentence is easy to remember and hard to guess.`}>
                <input className={inputCls} type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus aria-invalid={tooShort || undefined} />
              </Field>
              <Field label="Repeat it">
                <input className={inputCls} type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} aria-invalid={mismatch || undefined} />
              </Field>
              <label className="flex items-center gap-2 text-[12px] text-white/50"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password</label>
              {(tooShort || mismatch) && <p role="alert" className="text-[12px] text-amber-300">{tooShort ? `Use at least ${MIN} characters.` : "The two passwords don't match."}</p>}
              {err && <div role="alert" className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}
              <Button type="submit" className="w-full" disabled={busy || pw.length < MIN || pw !== pw2}>{busy ? "Setting up…" : "Set password and sign in"}</Button>
              {details.expiresAt && <p className="text-center text-[11px] text-white/35">This link works once, until {new Date(details.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
