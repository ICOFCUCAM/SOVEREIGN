import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ssoStartUrl, signInMethod, passwordSignIn, humanError } from "../lib/api";
import { AuthFrame, AuthCard, AUTH_LABEL } from "../components/AuthFrame";
import { Gilt, Hairline, GOLD, FIELD, ACTION as BTN } from "../components/premium";
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

  const field = (id: string, label: string, input: React.ReactNode) => (
    <div><label htmlFor={id} className={AUTH_LABEL}>{label}</label>{input}</div>
  );
  const alert = (text: string, tone: "warn" | "bad" = "warn") => (
    <div role="alert" className={`rounded-[10px] border px-3.5 py-2.5 text-[12.5px] ${tone === "bad" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-sd-warn/30 bg-sd-warn/10 text-[#f3dcae]"}`}>{text}</div>
  );

  return (
    <AuthFrame title={<>From information to <Gilt>official record</Gilt></>} lede="Sign in to your institution's Sovereign Dispatch."
      below={<p className="text-[11px] text-sd-faint">Sessions are held in memory and expire automatically.</p>}>
      {notice && <div className="mb-4">{alert(notice)}</div>}

      {/* the three doors */}
      <div role="tablist" aria-label="How you sign in" className="mb-4 grid gap-2.5">
        {DOORS.map((d) => {
          const on = door === d.id;
          return (
            <button key={d.id} role="tab" type="button" aria-selected={on} aria-controls={`door-${d.id}`} id={`tab-${d.id}`}
              onClick={() => { setDoor(d.id); setMsg(null); }}
              className={`group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sd-gold/25 ${on
                ? "border-sd-gold/50 bg-[linear-gradient(180deg,rgba(201,173,117,0.12),rgba(201,173,117,0.03))] shadow-[0_18px_44px_-30px_rgba(201,173,117,0.7)]"
                : "border-sd-line bg-[linear-gradient(180deg,rgba(20,30,44,0.7),rgba(13,20,30,0.7))] hover:-translate-y-px hover:border-sd-gold/25"}`}>
              {on && <Hairline tone="gold" />}
              <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 transition ${on ? "bg-sd-gold/10 text-sd-gold ring-sd-gold/50" : "text-sd-text3 ring-white/[0.12] group-hover:text-sd-text2"}`}>
                {React.createElement(Icon[d.icon], { className: "h-[18px] w-[18px]" })}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[14px] font-semibold ${on ? "text-sd-text" : "text-sd-text2"}`}>{d.title}</span>
                <span className="block text-[12px] leading-snug text-sd-text3">{d.line}</span>
              </span>
              <span aria-hidden className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${on ? "border-sd-gold" : "border-white/25"}`}>
                {on && <span className="h-2 w-2 rounded-full bg-[linear-gradient(180deg,#ecd7a6,#b8975c)]" />}
              </span>
            </button>
          );
        })}
      </div>

      <AuthCard>
        {door === "person" && (
          <form id="door-person" role="tabpanel" aria-labelledby="tab-person" onSubmit={continueWithEmail} className="space-y-4">
            {field("si-email", "Work email", <input id="si-email" className={FIELD} type="email" autoComplete="username" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); if (step === "password") { setStep("email"); setPassword(""); } }} placeholder="name@institution.org" />)}
            {step === "password" && field("si-password", "Password", <input id="si-password" className={FIELD} type="password" autoComplete="current-password" value={password} autoFocus onChange={(e) => setPassword(e.target.value)} />)}
            {msg && alert(msg)}
            <button type="submit" className={`${BTN} ${GOLD} w-full`} disabled={busy || (step === "password" && !password)}>
              {busy ? "One moment…" : step === "password" ? "Sign in" : "Continue"} {!busy && <Icon.arrowRight className="h-4 w-4" />}
            </button>
            <p className="text-[12px] leading-relaxed text-sd-text3">
              {step === "password"
                ? "Use the password you set from your invitation. Forgotten it? Ask your administrator for a new invitation link."
                : "If your institution has its own sign-in, you'll be taken there. Otherwise you'll enter the password you set from your invitation."}
            </p>
          </form>
        )}

        {door === "new" && (
          <div id="door-new" role="tabpanel" aria-labelledby="tab-new" className="space-y-5">
            <p className="text-[13.5px] leading-relaxed text-sd-text2">Create your institution's account in a minute. The <span className="text-sd-text">Evaluation is free for 30 days and includes 10 official records</span>; no card is needed.</p>
            <ol className="space-y-2.5">
              {["Name your institution and receive its administrator key.", "A guided set-up establishes your offices, approval rules and people.", "Invite your people; they sign in with their work email."].map((t, i) => (
                <li key={t} className="flex items-start gap-3 text-[13px] text-sd-text2">
                  <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-sd-gold/40 font-serif text-[11px] font-semibold text-sd-gold">{["I", "II", "III"][i]}</span>{t}
                </li>
              ))}
            </ol>
            <Link to="/signup" className={`${BTN} ${GOLD} w-full`}>Create your institution's account <Icon.arrowRight className="h-4 w-4" /></Link>
          </div>
        )}

        {door === "key" && (
          <form id="door-key" role="tabpanel" aria-labelledby="tab-key" onSubmit={(e) => { e.preventDefault(); signIn(clientId.trim(), secret).catch(() => {}); }} className="space-y-4">
            <p className="text-[12.5px] leading-relaxed text-sd-text3">For the first administrator, using the key shown when the institution was created, and for systems and integrations. People should use their work email.</p>
            {field("si-client", "Client ID", <input id="si-client" className={FIELD} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="svc_…" autoComplete="username" />)}
            {field("si-secret", "Secret", <input id="si-secret" className={FIELD} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="sdk_…" autoComplete="current-password" />)}
            {error && alert(error, "bad")}
            <button type="submit" disabled={loading || !clientId || !secret} className={`${BTN} ${GOLD} w-full`}>{loading ? "Signing in…" : "Sign in with key"}</button>
          </form>
        )}
      </AuthCard>
    </AuthFrame>
  );
};

function ssoErrorCopy(code: string): string {
  if (code === "not_provisioned") return "Your institution hasn't added you yet. Ask your administrator to add you and assign your office.";
  if (code === "NO_SSO" || code === "no_connection") return "Institutional sign-in isn't set up for that email domain yet.";
  if (code.startsWith("idp_")) return "Your institution's sign-in could not be completed. Please try again.";
  return "Sign-in could not be completed. Please try again.";
}

export default SignIn;
