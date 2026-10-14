import React, { useCallback, useEffect, useState } from "react";
import type { Remote } from "../lib/documents/store";
import { BTN_PRIMARY, BTN_SECONDARY } from "./desk/ui";
import {
  identityStatus, startVerification, completeEid, refreshStripe, latestAttempt, providerLabel, pathwayState, methodOptions, countryCode,
  type IdentityProvider, type IdentityStatus, type ProviderInfo, type Attempt, type PathwayState, type MethodOption,
} from "../lib/identity";
import { countryByCode } from "../lib/countries";
import { Flag } from "./CountrySelect";

// ── SELLER IDENTITY ─────────────────────────────────────────────────
// The founder states the country of their identity document or eID, and is offered the methods the
// server reports as switched on and offered there. Every state shown comes from the server: which
// methods are configured and where (exit-identity), the current verification, the latest attempt
// (the founder's own rows). Nothing here can mark anyone verified; the database refuses a listing
// without a verification it holds itself.
//
// The development test facility (marking a session verified locally, so the flow can be tried) is
// compiled only into the Vite development server (import.meta.env.DEV) and only without a server
// account. Production builds do not contain it.

// a compile-time constant: in a production build every branch guarded by it is removed from the bundle
const DEV_TOOLS = import.meta.env.DEV;
export const longDate = (iso: string): string => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Query parameters a provider sends the founder back with. */
export const hasVerificationReturn = (search: string): boolean => {
  const q = new URLSearchParams(search);
  return q.get("verify") === "stripe_identity" || (q.has("code") && q.has("state"));
};

export interface SellerIdentity { readonly provider: string; readonly verifiedAt: string; readonly until?: string; readonly local?: boolean }

export interface IdentityState {
  readonly identity: SellerIdentity | null;
  readonly options: (country: string | undefined) => MethodOption[];
  readonly stateOf: (id: IdentityProvider, configured: boolean) => PathwayState;
  readonly latest: Attempt | null;
  readonly hasServer: boolean;
  readonly checked: boolean;
  readonly busy: string | null;
  readonly error: string | null;
  readonly start: (p: ProviderInfo, country: string) => void;
  readonly checkStripe: () => void;
  readonly devTools: { readonly mark: (provider: IdentityProvider) => void; readonly clear: () => void } | null;
}

// development server only: a test identity held in this tab; the production build replaces this with no-ops
const devTestIdentity = DEV_TOOLS ? {
  load: (): SellerIdentity | null => { try { return JSON.parse(sessionStorage.getItem("exitos.identity.dev.v1") ?? "null") as SellerIdentity | null; } catch { return null; } },
  mark: (provider: IdentityProvider): SellerIdentity => { const d: SellerIdentity = { provider, verifiedAt: new Date().toISOString(), local: true }; try { sessionStorage.setItem("exitos.identity.dev.v1", JSON.stringify(d)); } catch { /* this visit only */ } return d; },
  clear: (): void => { try { sessionStorage.removeItem("exitos.identity.dev.v1"); } catch { /* nothing stored */ } },
} : { load: (): SellerIdentity | null => null, mark: (): SellerIdentity | null => null, clear: (): void => undefined };

/** The founder's verification: loads it, finishes a flow they return from, and starts new ones. */
export function useIdentity(remote: Remote | undefined): IdentityState {
  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [latest, setLatest] = useState<Attempt | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dev, setDev] = useState<SellerIdentity | null>(() => (DEV_TOOLS && !remote ? devTestIdentity.load() : null));

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
    options: (country) => methodOptions(status, country),
    stateOf: (id, configured) => pathwayState(id, { hasServer: !!remote, checked, available: configured, current: v, latest }),
    latest, hasServer: !!remote, checked: !remote || checked, busy, error,
    start: (p, country) => {
      if (!remote) return;
      setError(null); setBusy(`Opening ${providerLabel(p.id)}…`);
      const back = new URL(window.location.href); back.search = "";
      startVerification(remote, p.id, back.toString(), country).then((url) => window.location.assign(url), (e: Error) => { setError(e.message); setBusy(null); });
    },
    checkStripe: () => {
      if (!remote) return;
      setError(null); setBusy("Checking with Stripe…");
      refreshStripe(remote).then(() => reload(remote)).catch((e: Error) => setError(e.message)).finally(() => setBusy(null));
    },
    devTools: DEV_TOOLS && !remote ? {
      mark: (provider) => setDev(devTestIdentity.mark(provider)),
      clear: () => { devTestIdentity.clear(); setDev(null); },
    } : null,
  };
}

// ── presentation ────────────────────────────────────────────────────

const MUTED = "text-desk-muted";
const PRIMARY = BTN_PRIMARY;
const SECONDARY = BTN_SECONDARY;

/** Where a method works, as the founder reads it: a flag for a single country, a globe-free word otherwise. */
const Where: React.FC<{ p: ProviderInfo }> = ({ p }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11.5px] ${MUTED}`}>
    {p.countries.length === 1 ? <Flag code={p.countries[0]!} /> : null}{p.region}
  </span>
);

/** One operational method, selectable. */
const MethodOptionRow: React.FC<{ o: MethodOption; selected: boolean; onSelect: () => void; state: PathwayState; name: string }> = ({ o, selected, onSelect, state, name }) => (
  <label className={`flex cursor-pointer items-start gap-4 border-b border-desk-line px-5 py-4 transition last:border-0 focus-within:bg-desk-tint ${selected ? "bg-desk-tint shadow-[inset_2px_0_0_0_#1A1916]" : "hover:bg-desk-tint/60"}`}>
    <input type="radio" name={name} checked={selected} onChange={onSelect} className="mt-1.5 h-4 w-4 accent-[#1A1916] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-gold/60" />
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-display text-[22px] font-medium leading-tight text-desk-ink">{providerLabel(o.info.id)}</span>
        <Where p={o.info} />
      </span>
      <span className="mt-1 block text-[13px] leading-snug text-desk-text">{o.info.verifies}</span>
      {state !== "available" && <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-desk-gold-ink">{state === "in_progress" ? "In progress" : state === "failed" ? "Last attempt not completed" : state === "expired" ? "Expired" : state === "verified" ? "Verified" : ""}</span>}
    </span>
  </label>
);

/** The chosen method in detail, with its action. Only ever rendered for an operational, eligible method. */
const MethodDetail: React.FC<{ o: MethodOption; id: IdentityState; country: string; state: PathwayState }> = ({ o, id, country, state }) => {
  const attempt = id.latest?.provider === o.info.id ? id.latest : null;
  return (
    <div className="border-t border-desk-line bg-desk-surface px-5 py-5">
      <dl className="grid gap-x-8 gap-y-3 text-[13px] sm:grid-cols-[140px_minmax(0,1fr)]">
        <dt className={MUTED}>Eligibility</dt><dd className="text-desk-ink">Offered for identity documents and eIDs from {countryByCode(country)?.name ?? country}.</dd>
        <dt className={MUTED}>What is required</dt><dd className="text-desk-ink">{o.info.need}</dd>
        <dt className={MUTED}>What happens next</dt><dd className="text-desk-ink">{o.info.next}</dd>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-3" aria-live="polite">
        {state === "available" && <button type="button" className={PRIMARY} disabled={!!id.busy} onClick={() => id.start(o.info, country)}>Continue with {providerLabel(o.info.id)} <span aria-hidden>→</span></button>}
        {state === "in_progress" && (o.info.id === "stripe_identity"
          ? <><button type="button" className={PRIMARY} disabled={!!id.busy} onClick={id.checkStripe}>Check my result</button><span className="text-[12.5px] text-desk-muted">Stripe may still be reviewing your document.</span></>
          : <><button type="button" className={SECONDARY} disabled={!!id.busy} onClick={() => id.start(o.info, country)}>Begin again</button><span className="text-[12.5px] text-desk-muted">Started {attempt ? new Date(attempt.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "recently"}; complete it with the provider to return verified.</span></>)}
        {(state === "failed" || state === "expired") && <><button type="button" className={SECONDARY} disabled={!!id.busy} onClick={() => id.start(o.info, country)}>{state === "expired" ? "Verify again" : "Try again"}</button>
          <span className="text-[12.5px] text-desk-error">{state === "expired" ? "Your verification has expired." : attempt?.status === "canceled" ? "The last attempt was cancelled." : `The last attempt did not complete${attempt?.failure ? `: ${attempt.failure}` : "."}`}</span></>}
      </div>
    </div>
  );
};

/** A provider's seal: a typeset monogram in a fine bronze ring, not a borrowed logo. */
const Seal: React.FC<{ p: ProviderInfo }> = ({ p }) => {
  const mark = p.id === "stripe_identity" ? "S" : p.id === "fi_ftn" ? "FTN" : p.id === "fr_franceconnect" ? "FC" : p.id === "de_eid" ? "eID" : p.name.slice(0, p.name.length > 6 ? 2 : 1);
  return (
    <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-desk-line-strong bg-desk-tint text-desk-gold-ink">
      <span className="font-display text-[19px] font-medium">{mark}</span>
    </span>
  );
};

/** A method offered for the country but not yet switched on: shown as a card, with no control. */
const UnavailableCard: React.FC<{ o: MethodOption }> = ({ o }) => (
  <li className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[14px] border border-desk-line bg-desk-surface px-5 py-4 sm:flex-nowrap">
    <Seal p={o.info} />
    <div className="min-w-0 flex-1 basis-[200px]">
      <div className="font-display text-[21px] font-medium leading-tight text-desk-ink">{providerLabel(o.info.id)}</div>
      <p className="mt-1 text-[13px] leading-snug text-desk-muted">{o.info.verifies} · {o.info.region}</p>
    </div>
    <span className="shrink-0 rounded-full bg-desk-tint px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-desk-muted">Not yet available</span>
  </li>
);

/** A method that cannot be used: one quiet line, no control. */
const UnavailableRow: React.FC<{ o: MethodOption; reason: string }> = ({ o, reason }) => (
  <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 border-b border-desk-line py-3 text-[13px] last:border-0">
    <span className="text-desk-text">{providerLabel(o.info.id)} <span className={`ml-2 text-[11.5px] ${MUTED}`}>{o.info.region}</span></span>
    <span className={`text-[11.5px] ${MUTED}`}>{reason}</span>
  </li>
);

/**
 * The identity-method selection for a seller whose identity document or eID is from `country`.
 * Operational and eligible methods are selectable, with requirements, next steps and an action;
 * everything else is listed quietly as not available, without a control.
 */
export const IdentityMethods: React.FC<{ id: IdentityState; country: string | undefined }> = ({ id, country }) => {
  const cc = countryCode(country);
  const opts = id.options(cc);
  const usable = opts.filter((o) => o.eligible && o.configured);
  const eligibleOff = opts.filter((o) => o.eligible && !o.configured);
  const elsewhere = opts.filter((o) => !o.eligible);
  const [chosen, setChosen] = useState<IdentityProvider | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const selected = usable.find((o) => o.info.id === chosen) ?? usable[0];
  const countryName = countryByCode(cc)?.name;

  if (!cc) return <p className="text-[13.5px] text-desk-muted">Choose the country of your identity document or eID to see the methods offered there.</p>;
  if (!id.checked) return <p role="status" className="text-[13.5px] text-desk-muted">Confirming which methods are open on the exchange…</p>;

  return (
    <div className="space-y-6">
      {usable.length > 0 ? (
        <fieldset className="overflow-hidden rounded-[14px] border border-desk-line bg-desk-surface">
          <legend className="sr-only">Verification method</legend>
          {usable.map((o) => <MethodOptionRow key={o.info.id} o={o} name="identity-method" selected={o === selected} onSelect={() => setChosen(o.info.id)} state={id.stateOf(o.info.id, true)} />)}
          {selected && <MethodDetail o={selected} id={id} country={cc} state={id.stateOf(selected.info.id, true)} />}
        </fieldset>
      ) : (
        <div role="status" className="rounded-[14px] border border-desk-line bg-desk-tint px-6 py-5">
          <p className="font-display text-[22px] font-medium text-desk-ink">No verification method is open for {countryName} yet</p>
          <p className="mt-1.5 max-w-[60ch] text-[13.5px] leading-relaxed text-desk-text">
            {id.hasServer
              ? "ExitOS has not yet completed its connection with the identity providers below, so none can be used today. You can prepare the company profile now; publishing waits until your identity is established."
              : "This session has no server account, so no identity provider can be reached."}
          </p>
        </div>
      )}

      {eligibleOff.length > 0 && (
        <section aria-labelledby="idm-off">
          <h4 id="idm-off" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-desk-muted">Offered for {countryName} · not yet available</h4>
          <ul className="mt-3 space-y-3">{eligibleOff.map((o) => <UnavailableCard key={o.info.id} o={o} />)}</ul>
        </section>
      )}

      <div>
        <button type="button" aria-expanded={showOthers} aria-controls="idm-elsewhere" onClick={() => setShowOthers((s) => !s)}
          className="min-h-[36px] text-[12.5px] font-semibold text-desk-gold-ink underline-offset-4 hover:text-desk-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-gold/60">
          {showOthers ? "Hide methods for other countries" : `Methods for other countries (${elsewhere.length})`}
        </button>
        {showOthers && <ul id="idm-elsewhere" className="mt-2">{elsewhere.map((o) => <UnavailableRow key={o.info.id} o={o} reason={o.configured ? `Not offered for ${countryName}` : "Not yet available"} />)}</ul>}
      </div>

      <div aria-live="polite" className="space-y-2">
        {id.busy && <p role="status" className="text-[13px] text-desk-muted">{id.busy}</p>}
        {id.error && <p role="alert" className="border-l-2 border-desk-error pl-3 text-[13px] text-desk-error">{id.error}</p>}
      </div>
    </div>
  );
};

/** The seller's identity once established: one card, its state unmistakable. */
export const IdentityStatusCard: React.FC<{ identity: SellerIdentity | null }> = ({ identity }) => (
  <section aria-label="Seller identity" className="flex items-start gap-4 rounded-[14px] border border-desk-line bg-desk-surface px-5 py-4">
    <span aria-hidden className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${identity && !identity.local ? "bg-desk-success/10 text-desk-success" : "bg-desk-gold-tint text-desk-gold-ink"}`}>
      {identity ? <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m2.5 6.2 2.3 2.3 4.7-5" /></svg> : <span className="text-[15px]">○</span>}
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-desk-muted">Seller identity</p>
      {identity ? (
        <>
          <p className="mt-0.5 font-display text-[22px] font-medium text-desk-ink">{identity.local ? "Marked for testing" : "Established"}</p>
          <p className="mt-0.5 text-[12.5px] text-desk-muted">{providerLabel(identity.provider)} · {longDate(identity.verifiedAt)}{identity.until ? ` · until ${longDate(identity.until)}` : ""}</p>
          {identity.local && <p className="mt-1.5 text-[12px] text-desk-gold-ink">Development server only. No provider was involved; the live exchange would refuse this listing.</p>}
        </>
      ) : (
        <p className="mt-0.5 text-[13px] text-desk-text">Not yet established. Required before publishing.</p>
      )}
    </div>
  </section>
);

/** Development server only: an isolated test facility. In a production build this is an empty component. */
export const DevVerificationTools: React.FC<{ id: IdentityState; provider: IdentityProvider }> = DEV_TOOLS ? ({ id, provider }) => !id.devTools ? null : (
  <aside aria-label="Development tools" className="rounded-[10px] border border-dashed border-desk-line-strong bg-desk-tint px-4 py-3 text-[12px] text-desk-text">
    <span className="font-semibold uppercase tracking-[0.14em]">Development server</span> · no server account, so no provider can be reached.
    {" "}{id.identity?.local
      ? <button type="button" onClick={id.devTools.clear} className="font-semibold underline underline-offset-2">Clear the test identity</button>
      : <button type="button" onClick={() => id.devTools!.mark(provider)} className="font-semibold underline underline-offset-2">Mark this session verified for testing</button>}
    {" "}— listings made this way stay in this browser; the live exchange refuses any listing without a provider-confirmed identity.
  </aside>
) : () => null;
