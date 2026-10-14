import React, { useCallback, useEffect, useState } from "react";
import type { Remote } from "../lib/documents/store";
import {
  identityStatus, startVerification, completeEid, refreshStripe, latestAttempt, providersFor, providerLabel, pathwayState,
  type IdentityProvider, type IdentityStatus, type ProviderInfo, type Attempt, type PathwayState,
} from "../lib/identity";

// ── SELLER IDENTITY ─────────────────────────────────────────────────
// The founder chooses a verification pathway (their national eID first, Stripe Identity worldwide),
// completes it with the provider and returns. Every state shown here comes from the server: which
// methods are switched on (exit-identity), the current verification and the latest attempt (the
// founder's own rows). Nothing on this page can mark anyone verified, and the database refuses a
// listing without a verification it holds itself.
//
// A development build has no server. It keeps one isolated test facility — marking the session
// verified locally so the listing flow can be tried — which only exists in builds without e-mail
// sign-in and without a server account; a listing made that way stays in the browser.

const DEV_BUILD = import.meta.env.VITE_EXITOS_AUTH !== "email_link";
const DEV_KEY = "exitos.identity.dev.v1";
export const longDate = (iso: string): string => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Query parameters a provider sends the founder back with. */
export const hasVerificationReturn = (search: string): boolean => {
  const q = new URLSearchParams(search);
  return q.get("verify") === "stripe_identity" || (q.has("code") && q.has("state"));
};

export interface SellerIdentity { readonly provider: string; readonly verifiedAt: string; readonly until?: string; readonly local?: boolean }

export interface IdentityState {
  readonly identity: SellerIdentity | null;
  readonly stateOf: (id: IdentityProvider) => PathwayState;
  readonly latest: Attempt | null;
  readonly hasServer: boolean;
  readonly busy: string | null;
  readonly error: string | null;
  readonly start: (p: ProviderInfo) => void;
  readonly checkStripe: () => void;
  readonly devTools: { readonly mark: (provider: IdentityProvider) => void; readonly clear: () => void } | null;
}

/** The founder's verification: loads it, finishes a flow they return from, and starts new ones. */
export function useIdentity(remote: Remote | undefined): IdentityState {
  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [latest, setLatest] = useState<Attempt | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dev, setDev] = useState<SellerIdentity | null>(() => {
    try { return DEV_BUILD && !remote ? JSON.parse(sessionStorage.getItem(DEV_KEY) ?? "null") as SellerIdentity | null : null; } catch { return null; }
  });

  const reload = useCallback(async (r: Remote): Promise<void> => {
    const [s, a] = await Promise.all([identityStatus(r), latestAttempt(r)]);
    setStatus(s); setLatest(a);
  }, []);

  useEffect(() => {
    if (!remote) return;
    let live = true;
    void (async () => {
      const q = new URLSearchParams(window.location.search);
      try {
        if (q.get("verify") === "stripe_identity") {
          setBusy("Confirming your Stripe Identity result…");
          const r = await refreshStripe(remote);
          if (!r.verification && r.status === "processing") setError("Stripe is still reviewing your document. This usually takes a few minutes; check again shortly.");
        } else if (q.get("code") && q.get("state")) {
          setBusy("Confirming your sign-in with the provider…");
          await completeEid(remote, q.get("code")!, q.get("state")!);
        } else if (q.get("error")) setError(q.get("error_description") ?? "The identity provider stopped the sign-in.");
      } catch (e) { if (live) setError((e as Error).message); }
      // the provider's parameters are used once; take them out of the address bar
      if (["verify", "code", "state", "error"].some((k) => q.has(k))) {
        ["verify", "code", "state", "error", "error_description", "session_state"].forEach((k) => q.delete(k));
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${q.toString() ? `?${q}` : ""}`);
      }
      try { await reload(remote); } catch (e) { if (live) setError((e as Error).message); }
      if (live) { setBusy(null); setChecked(true); }
    })();
    return () => { live = false; };
  }, [remote, reload]);

  const v = status?.verification ?? null;
  return {
    identity: v ? { provider: v.provider, verifiedAt: v.verified_at, until: v.expires_at } : dev,
    stateOf: (id) => pathwayState(id, { hasServer: !!remote, checked, available: !!status?.providers[id], current: v, latest }),
    latest, hasServer: !!remote, busy, error,
    start: (p) => {
      if (!remote) return;
      setError(null); setBusy(`Opening ${providerLabel(p.id)}…`);
      const back = new URL(window.location.href); back.search = "";
      startVerification(remote, p.id, back.toString()).then((url) => window.location.assign(url), (e: Error) => { setError(e.message); setBusy(null); });
    },
    checkStripe: () => {
      if (!remote) return;
      setError(null); setBusy("Checking with Stripe…");
      refreshStripe(remote).then(() => reload(remote)).catch((e: Error) => setError(e.message)).finally(() => setBusy(null));
    },
    devTools: DEV_BUILD && !remote ? {
      mark: (provider) => { const d: SellerIdentity = { provider, verifiedAt: new Date().toISOString(), local: true }; try { sessionStorage.setItem(DEV_KEY, JSON.stringify(d)); } catch { /* this visit only */ } setDev(d); },
      clear: () => { try { sessionStorage.removeItem(DEV_KEY); } catch { /* nothing stored */ } setDev(null); },
    } : null,
  };
}

// ── presentation ────────────────────────────────────────────────────

const MUTED = "text-[#8A8378]";

/** Norway's flag, drawn: a country marker for the Norwegian pathway (not a provider logo). */
const NorwayFlag: React.FC = () => (
  <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden className="shrink-0 rounded-[1px] ring-1 ring-black/10">
    <rect width="22" height="16" fill="#BA0C2F" /><rect x="6" width="4" height="16" fill="#fff" /><rect y="6" width="22" height="4" fill="#fff" />
    <rect x="7" width="2" height="16" fill="#00205B" /><rect y="7" width="22" height="2" fill="#00205B" />
  </svg>
);
const CountryCode: React.FC<{ code: string }> = ({ code }) => (
  <span aria-hidden className="grid h-4 min-w-[22px] place-items-center rounded-[1px] border border-[#CFC6B7] px-1 text-[9px] font-semibold tracking-[0.08em] text-ex-slate-ink">{code}</span>
);
/** Document and face, drawn: the document-and-selfie pathway. */
const DocumentMark: React.FC<{ muted?: boolean }> = ({ muted }) => (
  <svg width="56" height="40" viewBox="0 0 56 40" aria-hidden className={muted ? "opacity-50" : ""}>
    <rect x="1" y="4" width="36" height="24" rx="2" fill="none" stroke="#242522" strokeWidth="1.2" />
    <circle cx="11" cy="14" r="4" fill="none" stroke="#B49A75" strokeWidth="1.2" /><path d="M5 24c1.5-3.5 10.5-3.5 12 0" fill="none" stroke="#B49A75" strokeWidth="1.2" />
    <path d="M21 12h11M21 16h11M21 20h7" stroke="#242522" strokeWidth="1" />
    <circle cx="46" cy="22" r="8.5" fill="#F5F1E9" stroke="#242522" strokeWidth="1.2" /><circle cx="46" cy="20" r="2.6" fill="none" stroke="#242522" strokeWidth="1.1" />
    <path d="M41.5 27c1.2-2.6 7.8-2.6 9 0" fill="none" stroke="#242522" strokeWidth="1.1" />
  </svg>
);

const STATE_TEXT: Record<PathwayState, string> = {
  checking: "Checking availability", unavailable: "Not yet available", available: "Available",
  in_progress: "In progress", verified: "Verified", failed: "Not completed", expired: "Expired",
};
const StatePill: React.FC<{ state: PathwayState }> = ({ state }) => {
  const tone = state === "verified" ? "border-ex-graphite bg-ex-graphite text-ex-ivory"
    : state === "available" || state === "in_progress" ? "border-ex-bronze/70 text-ex-bronze-ink"
    : state === "failed" || state === "expired" ? "border-[#B9806F] text-[#8E3B28]"
    : `border-[#D9D0C1] ${MUTED}`;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {state === "checking" && <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C9C1B4]" />}
      {state === "in_progress" && <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-ex-bronze" />}
      {state === "verified" && <span aria-hidden>✓</span>}
      {STATE_TEXT[state]}
    </span>
  );
};

const PRIMARY = "inline-flex items-center gap-2 rounded-ex-xs bg-ex-graphite px-4 py-2.5 text-[13px] font-semibold text-ex-ivory transition hover:bg-[#111310] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-ex-porcelain disabled:opacity-50";
const SECONDARY = "inline-flex items-center gap-2 rounded-ex-xs border border-ex-graphite/70 px-4 py-2.5 text-[13px] font-semibold text-ex-graphite transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-ex-porcelain disabled:opacity-50";

/** One verification pathway: who the provider is, what it establishes, its real state, and the next step. */
const Pathway: React.FC<{ p: ProviderInfo; id: IdentityState; prominent?: boolean }> = ({ p, id, prominent }) => {
  const state = id.stateOf(p.id);
  const active = state !== "unavailable" && state !== "checking";
  const national = p.id !== "stripe_identity";
  const attempt = id.latest?.provider === p.id ? id.latest : null;
  return (
    <article aria-labelledby={`pw-${p.id}`}
      className={`relative border-t-2 pt-5 ${active ? "border-ex-graphite" : "border-[#D9D0C1]"} ${prominent ? "" : "pb-2"}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {p.id === "no_bankid" ? <NorwayFlag /> : national ? <CountryCode code={p.countries[0] ?? ""} /> : null}
          <span className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${MUTED}`}>{national ? `National eID · ${p.region}` : "Document and selfie · Worldwide"}</span>
        </div>
        <StatePill state={state} />
      </header>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h4 id={`pw-${p.id}`} className={`font-editorial leading-tight ${prominent ? "text-[28px]" : "text-[22px]"} ${active ? "text-ex-graphite" : "text-[#7D766B]"}`}>
            {p.id === "no_bankid" ? <>BankID <span className="italic text-ex-bronze-ink">Norway</span></> : providerLabel(p.id)}
          </h4>
          <p className={`mt-2 max-w-[46ch] text-[13.5px] leading-relaxed ${active ? "text-ex-slate-ink" : MUTED}`}>{p.verifies}</p>
        </div>
        {!national && <DocumentMark muted={!active} />}
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-[120px_minmax(0,1fr)]">
        <dt className={MUTED}>You will need</dt><dd className={active ? "text-ex-graphite" : MUTED}>{p.need}</dd>
        <dt className={MUTED}>What happens next</dt><dd className={active ? "text-ex-graphite" : MUTED}>{p.next}</dd>
      </dl>

      <div className="mt-5 min-h-[44px]" aria-live="polite">
        {state === "available" && <button type="button" className={PRIMARY} disabled={!!id.busy} onClick={() => id.start(p)}>Begin with {providerLabel(p.id)} <span aria-hidden>→</span></button>}
        {state === "in_progress" && (
          <div className="flex flex-wrap items-center gap-3">
            {p.id === "stripe_identity"
              ? <button type="button" className={PRIMARY} disabled={!!id.busy} onClick={id.checkStripe}>Check my result</button>
              : <button type="button" className={SECONDARY} disabled={!!id.busy} onClick={() => id.start(p)}>Begin again</button>}
            <span className="text-[12.5px] text-ex-slate-ink">Started {attempt ? new Date(attempt.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "recently"}. {p.id === "stripe_identity" ? "Stripe may still be reviewing your document." : "Complete it with the provider to return here verified."}</span>
          </div>
        )}
        {state === "failed" && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={SECONDARY} disabled={!!id.busy} onClick={() => id.start(p)}>Try again</button>
            <span className="text-[12.5px] text-[#8E3B28]">{attempt?.status === "canceled" ? "The last attempt was cancelled." : `The last attempt did not complete${attempt?.failure ? `: ${attempt.failure}` : "."}`}</span>
          </div>
        )}
        {state === "expired" && <div className="flex flex-wrap items-center gap-3">{id.stateOf(p.id) === "expired" && <span className="text-[12.5px] text-[#8E3B28]">Your verification expired. Verify again to keep listing.</span>}</div>}
        {state === "verified" && id.identity && <p className="text-[13px] text-ex-graphite">Confirmed {longDate(id.identity.verifiedAt)}{id.identity.until ? ` · valid until ${longDate(id.identity.until)}` : ""}.</p>}
        {state === "unavailable" && <p className={`text-[12.5px] ${MUTED}`}>This method cannot be used yet: ExitOS has not completed its connection with the provider. It will open here once it is live.</p>}
        {state === "checking" && <p className={`text-[12.5px] ${MUTED}`}>Confirming availability with the exchange…</p>}
      </div>
    </article>
  );
};

const COUNTRIES = ["Norway", "Sweden", "Denmark", "Finland", "Netherlands", "Belgium", "Germany", "France", "Estonia", "United Kingdom", "United States"] as const;
const CHIP = (on: boolean): string => `rounded-full border px-3 py-1.5 text-[12.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze focus-visible:ring-offset-1 focus-visible:ring-offset-ex-porcelain ${on ? "border-ex-graphite bg-ex-graphite text-ex-ivory" : "border-[#D9D0C1] bg-white/70 text-ex-slate-ink hover:border-ex-bronze hover:text-ex-graphite"}`;

/** The pathways for a founder based in `basedIn`: their national eID, the document pathway, then the rest. */
export const VerificationPathways: React.FC<{ id: IdentityState; basedIn: string | undefined; onBasedIn?: (c: string) => void }> = ({ id, basedIn, onBasedIn }) => {
  const [more, setMore] = useState(false);
  const { suggested, other } = providersFor(basedIn);
  const national = suggested.filter((p) => p.id !== "stripe_identity");
  const stripe = suggested.find((p) => p.id === "stripe_identity")!;
  return (
    <div className="space-y-10">
      {onBasedIn && (
        <fieldset>
          <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ex-slate-ink">Where is the seller based?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {COUNTRIES.map((c) => { const on = (basedIn ?? "").toLowerCase() === c.toLowerCase(); return <button key={c} type="button" aria-pressed={on} onClick={() => onBasedIn(c)} className={CHIP(on)}>{c}</button>; })}
          </div>
          <p className={`mt-2 text-[12px] ${MUTED}`}>Your national eID is offered first. Stripe Identity works in every country.</p>
        </fieldset>
      )}
      <div className="grid gap-10 xl:grid-cols-2">
        {national.map((p) => <Pathway key={p.id} p={p} id={id} prominent />)}
        <Pathway p={stripe} id={id} prominent={national.length === 0} />
      </div>
      <div>
        <button type="button" aria-expanded={more} aria-controls="other-eids" onClick={() => setMore((m) => !m)}
          className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ex-bronze-ink hover:text-ex-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze">
          {more ? "Hide other national eIDs" : `Other national eIDs (${other.length})`}
        </button>
        {more && <div id="other-eids" className="mt-6 grid gap-8 xl:grid-cols-2">{other.map((p) => <Pathway key={p.id} p={p} id={id} />)}</div>}
      </div>
      <div aria-live="polite" className="space-y-2">
        {id.busy && <p role="status" className="text-[13px] text-ex-slate-ink">{id.busy}</p>}
        {id.error && <p role="alert" className="border-l-2 border-[#B4533C] pl-3 text-[13px] text-[#8E3B28]">{id.error}</p>}
      </div>
    </div>
  );
};

/** The seller's identity as a status block. */
export const IdentityStatusCard: React.FC<{ identity: SellerIdentity | null }> = ({ identity }) => (
  <section aria-label="Seller identity" className="border-t border-ex-graphite/80 pt-4">
    <div className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${MUTED}`}>Seller identity</div>
    {identity ? (
      <>
        <p className="mt-1.5 font-editorial text-[20px] text-ex-graphite">{identity.local ? "Marked for testing" : "Verified"}</p>
        <p className="mt-0.5 text-[12.5px] text-ex-slate-ink">{providerLabel(identity.provider)} · {longDate(identity.verifiedAt)}{identity.until ? ` · until ${longDate(identity.until)}` : ""}</p>
        {identity.local && <p className="mt-1 text-[11.5px] text-ex-bronze-ink">Development build only. No provider was involved; the live exchange would refuse this listing.</p>}
      </>
    ) : (
      <>
        <p className="mt-1.5 font-editorial text-[20px] text-ex-graphite">Not yet established</p>
        <p className="mt-0.5 text-[12.5px] text-ex-slate-ink">Required before the listing can be published.</p>
      </>
    )}
  </section>
);

/** Development builds only: an isolated test facility, never shown with a server account. */
export const DevVerificationTools: React.FC<{ id: IdentityState; provider: IdentityProvider }> = ({ id, provider }) => !id.devTools ? null : (
  <aside aria-label="Development tools" className="border border-dashed border-[#C9A96B] bg-[#FBF6EC] px-4 py-3 text-[12px] text-[#6B5A3A]">
    <span className="font-semibold uppercase tracking-[0.14em]">Development build</span> · this session has no server account, so no provider can be reached.
    {" "}{id.identity?.local
      ? <button type="button" onClick={id.devTools.clear} className="font-semibold underline underline-offset-2">Clear the test identity</button>
      : <button type="button" onClick={() => id.devTools!.mark(provider)} className="font-semibold underline underline-offset-2">Mark this session verified for testing</button>}
    {" "}— listings made this way stay in this browser; the live exchange refuses any listing without a provider-confirmed identity.
  </aside>
);
