import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListingFactsForm, type IntakeContext } from "./ListingFacts";
import { IdentityMethods, IdentityStatusCard, DevVerificationTools, type IdentityState, type SellerIdentity } from "./IdentityGate";
import { CountrySelect } from "./CountrySelect";
import { methodOptions, providerLabel } from "../lib/identity";
import { missingFacts, askingText, STAGE_LABEL, FOR_SALE_LABEL, MODEL_LABEL, type ListingFacts } from "../lib/listing-facts";

// ── THE LISTING DESK ────────────────────────────────────────────────
// Listing a company is a formal act on an acquisition exchange, so it has a page of its own: three
// stages (identity, company profile, review and publish), a compact buyer preview beside them, and an
// action bar that states, per stage, what the real workflow still requires. Two countries are kept
// apart on purpose: the country of the seller's identity document or eID (which methods can verify
// them; private, kept in this browser and never put on the listing) and the company's country of
// operation (listing data, shown to buyers). Publishing stays gated on the server.

export interface DeskListing { readonly code: string }

interface Props {
  readonly onClose: () => void;
  readonly listing: DeskListing;
  readonly context: IntakeContext;       // sector, revenue and growth from the saved intake
  readonly facts: Partial<ListingFacts>;
  readonly setFacts: (f: Partial<ListingFacts>) => void;
  readonly id: IdentityState;
  readonly onPublish: () => void;
  readonly updating: boolean;            // the company is already listed: this publishes an update
  readonly live: boolean;                // the live exchange (else this browser only)
}

const STAGES = ["Identity", "Company profile", "Review and publish"] as const;
type Stage = 0 | 1 | 2;

// the seller's identity-document country: private to this browser, never part of the listing
const ID_COUNTRY_KEY = "exitos.identity-country.v1";
// the picker starts at the United States until the founder chooses; their choice is remembered here
const DEFAULT_ID_COUNTRY = "US";
const loadIdCountry = (): string => { try { return localStorage.getItem(ID_COUNTRY_KEY) ?? DEFAULT_ID_COUNTRY; } catch { return DEFAULT_ID_COUNTRY; } };
const saveIdCountry = (c: string): void => { try { localStorage.setItem(ID_COUNTRY_KEY, c); } catch { /* kept for this visit */ } };

const PRIMARY = "inline-flex items-center justify-center gap-2 rounded-[2px] bg-[#1B1C19] px-6 py-3.5 text-[13.5px] font-semibold tracking-[0.01em] text-[#F4EFE6] transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE6] disabled:cursor-not-allowed disabled:bg-[#CFC7BA] disabled:text-white";
const QUIET = "inline-flex items-center justify-center gap-2 rounded-ex-xs px-3 py-3 text-[13.5px] font-semibold text-ex-slate-ink transition hover:text-ex-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze";
const FAINT = "text-[#8A8378]";

export const ListingDesk: React.FC<Props> = ({ onClose, listing, context, facts, setFacts, id, onPublish, updating, live }) => {
  const missing = missingFacts(facts);
  const verified = !!id.identity;
  const [idCountry, setIdCountryState] = useState<string>(loadIdCountry);
  const setIdCountry = (c: string): void => { setIdCountryState(c); saveIdCountry(c); };
  const identityNeeds = verified ? [] : [...(idCountry ? [] : ["Choose the country of your identity document"]), "Establish your identity with a verification provider"];
  const profileDone = missing.length === 0;
  const canReview = verified && profileDone;
  const [stage, setStage] = useState<Stage>(() => (canReview ? 2 : verified ? 1 : 0));
  const [saved, setSaved] = useState(false);
  const scrollers = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const heading = useRef<HTMLHeadingElement>(null);
  const go = (s: Stage): void => { if (s === 2 && !canReview) return; setStage(s); for (const r of scrollers) r.current?.scrollTo({ top: 0 }); requestAnimationFrame(() => heading.current?.focus()); };
  const editFacts = (f: Partial<ListingFacts>): void => { setFacts(f); setSaved(true); };   // the parent keeps the draft in this browser

  // a sheet of its own: no page scroll beneath it; Escape returns to the console unless a control used it
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape" && !e.defaultPrevented) onClose(); };
    window.addEventListener("keydown", onKey);
    heading.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // a test identity for the development server: the first method offered for the chosen country
  const devProvider = methodOptions(null, idCountry).find((o) => o.eligible)?.info.id ?? "stripe_identity";

  const stageDone = [verified, profileDone, false];
  const STAGE_NOTE = ["Confirmed by a regulated provider", "What buyers read before an NDA", "Goes onto the exchange"];

  return createPortal(
    <div ref={scrollers[0]} role="dialog" aria-modal="true" aria-labelledby="desk-heading" data-page="listing-desk"
      className="fixed inset-0 z-[200] overflow-y-auto bg-[#F4EFE6] text-ex-graphite lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:overflow-hidden">

      {/* ── the rail: brand, the three stages, the buyer preview ─────── */}
      <aside className="relative flex flex-col bg-[#1B1C19] text-ex-ivory lg:h-full lg:overflow-y-auto">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#C9A86A]/30 to-transparent lg:block" />
        <div className="flex items-center justify-between px-6 pb-5 pt-6 lg:block lg:px-12 lg:pb-0 lg:pt-12">
          <div>
            <div className="font-display text-[30px] font-semibold leading-none tracking-[0.01em] lg:text-[34px]">ExitOS</div>
            <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.3em] text-ex-ivory/45">Listing desk</div>
          </div>
          <button type="button" onClick={onClose} className="text-[12.5px] text-ex-ivory/60 underline-offset-4 hover:text-ex-ivory hover:underline lg:hidden">Leave</button>
        </div>

        <nav aria-label="Listing stages" className="px-6 lg:mt-12 lg:px-12">
          <ol className="flex gap-6 border-t border-white/10 pt-4 lg:block lg:pt-0">
            {STAGES.map((t, i) => {
              const done = stageDone[i]!, locked = i === 2 && !canReview, here = stage === i;
              return (
                <li key={t} className="lg:border-b lg:border-white/10">
                  <button type="button" onClick={() => go(i as Stage)} aria-current={here ? "step" : undefined} aria-disabled={locked || undefined}
                    title={locked ? "Opens once your identity is established and the company profile is complete" : undefined}
                    className={`group flex w-full items-baseline gap-5 py-1 text-left transition lg:py-5 ${locked ? "cursor-not-allowed" : ""}`}>
                    <span className={`font-display text-[22px] leading-none lg:w-9 lg:text-[28px] ${here ? "text-[#C9A86A]" : done ? "text-ex-ivory/70" : "text-ex-ivory/30"}`}>{done && !here ? "✓" : `0${i + 1}`}</span>
                    <span className={`min-w-0 ${here ? "" : "max-lg:hidden"}`}>
                      <span className={`block text-[14.5px] font-medium ${here ? "text-white" : locked ? "text-ex-ivory/35" : "text-ex-ivory/75 group-hover:text-white"}`}>{t}</span>
                      <span className="mt-1 hidden text-[12.5px] leading-snug text-ex-ivory/40 lg:block">{STAGE_NOTE[i]}</span>
                    </span>
                    <span className="sr-only">{done ? " (complete)" : locked ? " (not yet available)" : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-auto hidden space-y-5 px-12 pb-10 pt-10 lg:block">
          <RailIdentity identity={id.identity} />
          <BuyerPreview code={listing.code} context={context} facts={facts} />
        </div>
      </aside>

      {/* ── the workspace ───────────────────────────────────────────── */}
      <div ref={scrollers[1]} className="relative flex min-w-0 flex-col lg:h-full lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 text-[12.5px] sm:px-10 lg:px-20 lg:pt-12">
          <span className={`inline-flex items-center gap-2 ${live ? "text-ex-graphite" : "text-[#7A7469]"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? "bg-[#4E7A52]" : "border border-[#7A7469]"}`} />
            {live ? "Live exchange" : "This browser only · not connected to the live exchange"}
          </span>
          <button type="button" onClick={onClose} className="hidden text-[#7A7469] underline-offset-4 hover:text-ex-graphite hover:underline lg:inline">Leave the desk <span aria-hidden>✕</span></button>
        </div>

        <main className="w-full max-w-[860px] flex-1 px-6 pb-16 pt-12 sm:px-10 lg:px-20 lg:pt-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8A6D44]">Stage {["one", "two", "three"][stage]} of three</p>
          <h1 id="desk-heading" ref={heading} tabIndex={-1} className="mt-4 font-display text-[46px] font-medium leading-[1.02] tracking-[-0.01em] outline-none sm:text-[60px] lg:text-[68px]">
            {stage === 0 && <>Establish your <em className="italic text-[#8A6D44]">identity</em></>}
            {stage === 1 && <>The company <em className="italic text-[#8A6D44]">profile</em></>}
            {stage === 2 && <>Review and <em className="italic text-[#8A6D44]">publish</em></>}
          </h1>

          {stage === 0 && (
            <>
              <p className="mt-6 max-w-[60ch] text-[16.5px] leading-[1.7] text-[#5A554C]">
                Identity verification helps protect the integrity of the ExitOS acquisition exchange. Your identity remains undisclosed to prospective buyers until the applicable NDA and disclosure conditions are satisfied.
              </p>
              {verified ? (
                <div className="mt-12 max-w-xl"><IdentityStatusCard identity={id.identity} /></div>
              ) : (
                <>
                  <div className="mt-12 max-w-[480px]">
                    <CountrySelect id="id-country" label="Country of your identity document or eID" value={idCountry} onChange={setIdCountry}
                      hint="Used only to offer the verification methods that work for you. Not part of the listing; never shown to buyers." />
                  </div>
                  <div className="mt-10"><IdentityMethods id={id} country={idCountry} /></div>
                </>
              )}
              <p className="mt-14 max-w-[62ch] border-t border-[#DDD3C3] pt-6 text-[12.5px] leading-relaxed text-[#8A8378]">
                You confirm with the provider on its own page or app; ExitOS never sees your credentials. ExitOS records the method, the date and the country the provider reports — never your documents or identity number — and your listing reads “Verified seller” with the method, never your name.
              </p>
              {id.devTools && <div className="mt-6"><DevVerificationTools id={id} provider={devProvider} /></div>}
            </>
          )}

          {stage === 1 && (
            <>
              <p className="mt-6 max-w-[60ch] text-[16.5px] leading-[1.7] text-[#5A554C]">What prospective buyers read before they request an NDA. Your draft is kept in this browser as you type.</p>
              <div className="mt-14"><ListingFactsForm value={facts} onChange={editFacts} tone="porcelain" context={context} showStatus={false} /></div>
            </>
          )}

          {stage === 2 && (
            <>
              <p className="mt-6 max-w-[60ch] text-[16.5px] leading-[1.7] text-[#5A554C]">
                {live ? "Publishing places the anonymised listing on the live exchange, where buyers can request an NDA. You can withdraw it at any time." : "This build is not connected to the live exchange. Saving keeps the listing in this browser only; no buyer will see it."}
              </p>
              <ProfileReview facts={facts as ListingFacts} context={context} />
            </>
          )}

          {/* on small screens the rail's preview follows the stage */}
          <div className="mt-16 space-y-6 rounded-ex-xs bg-[#1B1C19] p-6 text-ex-ivory lg:hidden">
            <RailIdentity identity={id.identity} />
            <BuyerPreview code={listing.code} context={context} facts={facts} />
          </div>
        </main>

        {/* ── action bar: what this stage still requires ────────────── */}
        <footer className="sticky bottom-0 z-20 border-t border-[#DDD3C3] bg-[#F4EFE6]/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 sm:px-10 lg:px-20">
            <dl className="grid min-w-0 flex-1 basis-full gap-1 text-[12.5px] sm:basis-auto" aria-live="polite">
              <Req label="Identity" ok={verified} active={stage === 0 || stage === 2}
                text={verified ? `Established${id.identity?.local ? " (test, development server)" : ""}` : identityNeeds.join(" · ")} />
              <Req label="Company profile" ok={profileDone} active={stage === 1 || stage === 2}
                text={profileDone ? "Complete" : stage === 1 ? `${missing.length} to complete: ${missing.join(" · ")}` : `${missing.length} item${missing.length === 1 ? "" : "s"} to complete`} />
            </dl>
            <div className="flex shrink-0 items-center gap-2">
              {stage === 1 && saved && <span className={`mr-2 hidden text-[11.5px] xl:inline ${FAINT}`}>Draft saved in this browser</span>}
              {stage > 0 && <button type="button" className={`${QUIET} max-sm:hidden`} onClick={() => go((stage - 1) as Stage)}><span aria-hidden>←</span> {STAGES[stage - 1]}</button>}
              {stage === 0 && <button type="button" className={PRIMARY} onClick={() => go(1)}>{verified ? "Continue to the company profile" : "Prepare the company profile"} <span aria-hidden>→</span></button>}
              {stage === 1 && <button type="button" className={PRIMARY} disabled={!canReview} onClick={() => go(2)} aria-describedby={canReview ? undefined : "why-locked"}>Continue to review <span aria-hidden>→</span></button>}
              {stage === 2 && <button type="button" className={PRIMARY} disabled={!canReview} onClick={onPublish}>{updating ? "Publish the update" : live ? "Publish to the exchange" : "Save in this browser"}</button>}
            </div>
            {stage === 1 && !canReview && <p id="why-locked" className={`basis-full text-[11.5px] ${FAINT}`}>Review opens once {!verified && !profileDone ? "your identity is established and the profile is complete" : !verified ? "your identity is established" : "the profile is complete"}.</p>}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
};

/** The seller's identity, as the rail shows it. */
const RailIdentity: React.FC<{ identity: SellerIdentity | null }> = ({ identity }) => (
  <section aria-label="Seller identity">
    <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ex-ivory/40">Seller identity</div>
    <p className="mt-2 flex items-center gap-2 text-[13.5px]">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${identity ? "bg-[#C9A86A]" : "border border-ex-ivory/40"}`} />
      {identity ? <>{identity.local ? "Marked for testing" : "Established"} · {providerLabel(identity.provider)}</> : <span className="text-ex-ivory/60">Not yet established</span>}
    </p>
  </section>
);

/** One requirement group in the action bar. */
const Req: React.FC<{ label: string; ok: boolean; active: boolean; text: string }> = ({ label, ok, active, text }) => (
  <div className={`flex min-w-0 items-baseline gap-2 ${active ? "" : "opacity-70"}`}>
    <dt className="flex shrink-0 items-baseline gap-1.5 font-semibold text-ex-graphite">
      <span aria-hidden className={ok ? "text-ex-graphite" : "text-[#B9B2A6]"}>{ok ? "✓" : "○"}</span>{label}<span className="sr-only">{ok ? ": done" : ": outstanding"}</span>
    </dt>
    <dd className="min-w-0 truncate text-ex-slate-ink" title={text}>{text}</dd>
  </div>
);

/** The buyer preview, set in the rail: the anonymised listing from the saved values only, with honest gaps. */
const BuyerPreview: React.FC<{ code: string; context: IntakeContext; facts: Partial<ListingFacts> }> = ({ code, context, facts }) => {
  const region = facts.region ? (facts.region === "Other" ? "Global" : facts.region) : null;
  const rows: Array<[string, string | null]> = [
    ["Sector", context.sector],
    ["Region", region],
    ["Revenue", context.unconfirmed ? null : context.revenue],
    ["Growth", context.unconfirmed ? null : context.growth],
    ["Stage", facts.stage ? STAGE_LABEL[facts.stage] : null],
    ["Asking", facts.askingMode ? askingText(facts as ListingFacts) : null],
  ];
  return (
    <section aria-label="Buyer preview" className="border border-[#C9A86A]/35 px-6 py-5">
      <div className="flex items-baseline justify-between text-[10.5px] font-semibold uppercase tracking-[0.22em]"><span className="text-[#C9A86A]">Buyer preview</span><span className="text-ex-ivory/35">Pre-NDA</span></div>
      <p className="mt-3 font-display text-[26px] leading-tight text-white">{code}</p>
      <dl className="mt-4 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-t border-white/[0.07] py-1.5">
            <dt className="text-ex-ivory/45">{k}</dt>
            <dd className={v ? "text-right text-ex-ivory" : "text-right italic text-ex-ivory/35"}>{v ?? (k === "Revenue" || k === "Growth" ? "Not confirmed" : "Not set")}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[11.5px] leading-relaxed text-ex-ivory/40">The company name, your identity, exact figures and the data room stay withheld until an NDA.</p>
    </section>
  );
};

/** The full listing for review, set as a buyer will read it. */
const ProfileReview: React.FC<{ facts: ListingFacts; context: IntakeContext }> = ({ facts: f, context }) => (
  <section aria-label="The listing" className="mt-10 border-t border-ex-graphite/80 pt-6">
    <p className="max-w-[64ch] font-display text-[24px] leading-[1.45]">{f.summary}</p>
    <dl className="mt-8 grid gap-x-10 gap-y-5 text-[13.5px] sm:grid-cols-2">
      {([
        ["Sector and region", `${context.sector} · ${f.region === "Other" ? "Global" : f.region}`],
        ["Revenue and growth", context.unconfirmed ? "Not confirmed" : `${context.revenue} · ${context.growth}`],
        ["Company stage", f.stage ? STAGE_LABEL[f.stage] : "—"],
        ["Asking price", askingText(f)],
        ["What is for sale", f.forSale.map((x) => FOR_SALE_LABEL[x]).join(" · ")],
        ["How it makes money", f.models.map((x) => MODEL_LABEL[x]).join(" · ")],
        ["Markets served", f.markets.join(" · ")],
        ["Technology stack", f.builtWith.join(" · ")],
        ["Country of operation", f.basedIn],
        ...(f.reasonForSale ? [["Reason for sale", f.reasonForSale]] : []),
      ] as Array<[string, string]>).map(([k, v]) => (
        <div key={k} className="border-t border-[#E6DFD3] pt-2"><dt className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${FAINT}`}>{k}</dt><dd className="mt-1">{v}</dd></div>
      ))}
    </dl>
  </section>
);
