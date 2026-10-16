import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { invitationDetails, acceptInvitation, humanError, type InvitationDetails } from "../lib/api";
import { AuthFrame, AuthCard, AUTH_LABEL } from "../components/AuthFrame";
import { Gilt, GOLD, FIELD, ACTION as BTN } from "../components/premium";
import { Icon } from "../components/console/icons";

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

  const valid = details?.state === "valid";
  const field = (id: string, label: string, input: React.ReactNode, hint?: string) => (
    <div><label htmlFor={id} className={AUTH_LABEL}>{label}</label>{input}{hint && <span className="mt-1.5 block text-[12px] text-sd-text3">{hint}</span>}</div>
  );
  return (
    <AuthFrame eyebrow={valid && details?.institution ? details.institution : "Invitation"}
      title={valid ? <>Welcome, <Gilt>{details!.fullName}</Gilt></> : details ? "Invitation not available" : "Your invitation"}
      lede={valid ? <><span className="text-sd-text">{details!.institution}</span> has invited you to Sovereign Dispatch. Set a password to finish.</> : undefined}>
      <AuthCard tone={details && !valid ? "faint" : "gold"}>
        {!details && !err && <p className="text-sm text-sd-text3">Checking your invitation…</p>}
        {err && !details && <div role="alert" className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-200">{err}</div>}

        {details && !valid && (
          <div className="space-y-5">
            <p className="text-[13.5px] leading-relaxed text-sd-text2">{ended[details.state]}</p>
            <Link to="/console" className={`${BTN} ${GOLD} w-full`}>Go to sign-in <Icon.arrowRight className="h-4 w-4" /></Link>
          </div>
        )}

        {valid && details && (
          <form onSubmit={accept} className="space-y-4">
            <p className="text-[13px] leading-relaxed text-sd-text2">You'll sign in with <span className="font-medium text-sd-text">{details.email}</span> and this password.</p>
            <input type="email" value={details.email ?? ""} autoComplete="username" readOnly hidden />
            {field("inv-pw", "Choose a password", <input id="inv-pw" className={FIELD} type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus aria-invalid={tooShort || undefined} />,
              `At least ${MIN} characters. A short sentence is easy to remember and hard to guess.`)}
            {field("inv-pw2", "Repeat it", <input id="inv-pw2" className={FIELD} type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} aria-invalid={mismatch || undefined} />)}
            <label className="flex items-center gap-2 text-[12.5px] text-sd-text3"><input type="checkbox" className="accent-[#c9ad75]" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password</label>
            {(tooShort || mismatch) && <p role="alert" className="text-[12.5px] text-[#f3dcae]">{tooShort ? `Use at least ${MIN} characters.` : "The two passwords don't match."}</p>}
            {err && <div role="alert" className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-200">{err}</div>}
            <button type="submit" className={`${BTN} ${GOLD} w-full`} disabled={busy || pw.length < MIN || pw !== pw2}>{busy ? "Setting up…" : "Set password and sign in"}</button>
            {details.expiresAt && <p className="text-center text-[11.5px] text-sd-faint">This link works once, until {new Date(details.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.</p>}
          </form>
        )}
      </AuthCard>
    </AuthFrame>
  );
};

export default AcceptInvitation;
