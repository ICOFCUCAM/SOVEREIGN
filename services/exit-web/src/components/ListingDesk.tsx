import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListingFactsForm, type IntakeContext } from "./ListingFacts";
import { IdentityMethods, IdentityStatusCard, DevVerificationTools, type IdentityState } from "./IdentityGate";
import { CountrySelect } from "./CountrySelect";
import { methodOptions } from "../lib/identity";
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

const PRIMARY = "inline-flex items-center justify-center gap-2 rounded-ex-xs bg-ex-graphite px-5 py-3 text-[13.5px] font-semibold text-ex-ivory transition hover:bg-[#111310] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-ex-porcelain disabled:cursor-not-allowed disabled:bg-[#C9C2B6] disabled:text-white";
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
  const sheet = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const go = (s: Stage): void => { if (s === 2 && !canReview) return; setStage(s); sheet.current?.scrollTo({ top: 0 }); requestAnimationFrame(() => heading.current?.focus()); };
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

  return createPortal(
    <div ref={sheet} role="dialog" aria-modal="true" aria-labelledby="desk-heading" data-page="listing-desk"
      className="fixed inset-0 z-[200] overflow-y-auto bg-ex-porcelain text-ex-graphite">
      {/* ── top bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-[#D9D0C1] bg-ex-porcelain/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-4 sm:px-8">
          <span className="font-editorial text-[21px] font-semibold tracking-tight">ExitOS</span>
          <span aria-hidden className="h-4 w-px bg-[#D9D0C1]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ex-slate-ink">Listing desk</span>
          <span className={`ml-2 hidden items-center gap-1.5 text-[11.5px] md:inline-flex ${live ? "text-ex-graphite" : "text-ex-bronze-ink"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ex-graphite" : "border border-ex-bronze-ink"}`} />
            {live ? "Live exchange" : "This browser only · not connected to the live exchange"}
          </span>
          <button type="button" onClick={onClose} className="ml-auto text-[13px] font-medium text-ex-slate-ink underline-offset-4 hover:text-ex-graphite hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze">Leave the desk</button>
        </div>
        <nav aria-label="Listing stages" className="mx-auto max-w-[1180px] px-5 pb-4 sm:px-8">
          <ol className="flex items-center gap-3">
            {STAGES.map((t, i) => {
              const done = i === 0 ? verified : i === 1 ? profileDone : false;
              const locked = i === 2 && !canReview;
              return (
                <React.Fragment key={t}>
                  {i > 0 && <li aria-hidden className={`h-px flex-1 ${(i === 1 ? verified : profileDone) ? "bg-ex-graphite" : "bg-[#D9D0C1]"}`} />}
                  <li>
                    <button type="button" onClick={() => go(i as Stage)} aria-current={stage === i ? "step" : undefined} aria-disabled={locked || undefined}
                      title={locked ? "Available once your identity is established and the company profile is complete" : undefined}
                      className={`flex items-baseline gap-2 whitespace-nowrap text-[12.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze ${stage === i ? "text-ex-graphite" : locked ? "cursor-not-allowed text-[#B9B2A6]" : "text-[#8A8378] hover:text-ex-graphite"}`}>
                      <span className={`font-editorial text-[14px] ${stage === i ? "text-ex-bronze-ink" : ""}`}>{done && stage !== i ? "✓" : `0${i + 1}`}</span>
                      <span className={`${stage === i ? "font-semibold" : ""} ${i === stage ? "" : "hidden sm:inline"}`}>{t}</span>
                      <span className="sr-only">{done ? " (complete)" : locked ? " (not yet available)" : ""}</span>
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-12 px-5 pb-48 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-16">
        <main className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ex-bronze-ink">Stage 0{stage + 1} of 03</p>
          <h1 id="desk-heading" ref={heading} tabIndex={-1} className="mt-3 font-editorial text-[34px] leading-[1.06] tracking-tight outline-none sm:text-[44px]">
            {stage === 0 && <>Establish your <em className="italic text-ex-bronze-ink">identity</em></>}
            {stage === 1 && <>The company <em className="italic text-ex-bronze-ink">profile</em></>}
            {stage === 2 && <>Review and <em className="italic text-ex-bronze-ink">publish</em></>}
          </h1>

          {stage === 0 && (
            <>
              <p className="mt-5 max-w-[62ch] text-[15.5px] leading-relaxed text-ex-slate-ink">
                Identity verification helps protect the integrity of the ExitOS acquisition exchange. Your identity remains undisclosed to prospective buyers until the applicable NDA and disclosure conditions are satisfied.
              </p>
              {verified ? (
                <div className="mt-10 border-t border-ex-graphite/80 pt-5">
                  <IdentityStatusCard identity={id.identity} />
                </div>
              ) : (
                <>
                  <div className="mt-10 max-w-md">
                    <CountrySelect id="id-country" label="Country of your identity document or eID" value={idCountry} onChange={setIdCountry}
                      hint="Used only to offer the verification methods that work for you. It is not part of the listing and is not shown to buyers." />
                  </div>
                  <div className="mt-8"><IdentityMethods id={id} country={idCountry} /></div>
                </>
              )}
              <p className={`mt-10 max-w-[62ch] border-t border-[#D9D0C1] pt-5 text-[12.5px] leading-relaxed ${FAINT}`}>
                You confirm with the provider on its own page or app; ExitOS never sees your credentials. ExitOS records the method, the date and the country the provider reports — not your documents or identity number — and your listing shows “Verified seller” with the method, never your name.
              </p>
              {id.devTools && <div className="mt-6"><DevVerificationTools id={id} provider={devProvider} /></div>}
            </>
          )}

          {stage === 1 && (
            <>
              <p className="mt-5 max-w-[62ch] text-[15.5px] leading-relaxed text-ex-slate-ink">What prospective buyers read before they request an NDA. Your draft is kept in this browser as you type.</p>
              <div className="mt-12"><ListingFactsForm value={facts} onChange={editFacts} tone="porcelain" context={context} showStatus={false} /></div>
            </>
          )}

          {stage === 2 && (
            <>
              <p className="mt-5 max-w-[62ch] text-[15.5px] leading-relaxed text-ex-slate-ink">
                {live ? "Publishing places the anonymised listing on the live exchange, where buyers can request an NDA. You can withdraw it at any time." : "This build is not connected to the live exchange. Saving keeps the listing in this browser only; no buyer will see it."}
              </p>
              <ProfileReview facts={facts as ListingFacts} context={context} />
            </>
          )}
        </main>

        {/* ── supporting column: secondary to the stage ─────────────── */}
        <aside aria-label="Buyer preview and status" className="space-y-6 lg:sticky lg:top-[132px] lg:self-start">
          {stage !== 0 && <IdentityStatusCard identity={id.identity} />}
          <BuyerPreview code={listing.code} context={context} facts={facts} />
        </aside>
      </div>

      {/* ── action bar: what this stage still requires ────────────── */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#D9D0C1] bg-ex-porcelain/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1180px] px-5 py-3.5 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <dl className="grid min-w-0 flex-1 basis-full gap-1 text-[12.5px] sm:basis-auto" aria-live="polite">
              <Req label="Identity" ok={verified} active={stage === 0 || stage === 2}
                text={verified ? `Established${id.identity?.local ? " (test, development server)" : ""}` : identityNeeds.join(" · ")} />
              <Req label="Company profile" ok={profileDone} active={stage === 1 || stage === 2}
                text={profileDone ? "Complete" : stage === 1 ? `${missing.length} to complete: ${missing.join(" · ")}` : `${missing.length} item${missing.length === 1 ? "" : "s"} to complete`} />
            </dl>
            <div className="flex shrink-0 items-center gap-2">
              {stage === 1 && saved && <span className={`mr-2 hidden text-[11.5px] sm:inline ${FAINT}`}>Draft saved in this browser</span>}
              {stage > 0 && <button type="button" className={`${QUIET} max-sm:hidden`} onClick={() => go((stage - 1) as Stage)}><span aria-hidden>←</span> {STAGES[stage - 1]}</button>}
              {stage === 0 && <button type="button" className={PRIMARY} onClick={() => go(1)}>{verified ? "Continue to the company profile" : "Prepare the company profile"} <span aria-hidden>→</span></button>}
              {stage === 1 && <button type="button" className={PRIMARY} disabled={!canReview} onClick={() => go(2)} aria-describedby={canReview ? undefined : "why-locked"}>Continue to review <span aria-hidden>→</span></button>}
              {stage === 2 && <button type="button" className={PRIMARY} disabled={!canReview} onClick={onPublish}>{updating ? "Publish the update" : live ? "Publish to the exchange" : "Save in this browser"}</button>}
            </div>
          </div>
          {stage === 1 && !canReview && <p id="why-locked" className={`mt-1.5 text-[11.5px] ${FAINT}`}>Review opens once {!verified && !profileDone ? "your identity is established and the profile is complete" : !verified ? "your identity is established" : "the profile is complete"}.</p>}
        </div>
      </footer>
    </div>,
    document.body,
  );
};

/** One requirement group in the action bar. */
const Req: React.FC<{ label: string; ok: boolean; active: boolean; text: string }> = ({ label, ok, active, text }) => (
  <div className={`flex min-w-0 items-baseline gap-2 ${active ? "" : "opacity-70"}`}>
    <dt className="flex shrink-0 items-baseline gap-1.5 font-semibold text-ex-graphite">
      <span aria-hidden className={ok ? "text-ex-graphite" : "text-[#B9B2A6]"}>{ok ? "✓" : "○"}</span>{label}<span className="sr-only">{ok ? ": done" : ": outstanding"}</span>
    </dt>
    <dd className="min-w-0 truncate text-ex-slate-ink" title={text}>{text}</dd>
  </div>
);

/** A compact buyer preview: the anonymised listing from the saved values only, with honest gaps. */
const BuyerPreview: React.FC<{ code: string; context: IntakeContext; facts: Partial<ListingFacts> }> = ({ code, context, facts }) => {
  const region = facts.region ? (facts.region === "Other" ? "Global" : facts.region) : null;
  const rows: Array<[string, string | null]> = [
    ["Sector", context.sector],
    ["Region", region ? `${region}${facts.basedIn ? ` · ${facts.basedIn}` : ""}` : null],
    ["Revenue", context.unconfirmed ? null : context.revenue],
    ["Growth", context.unconfirmed ? null : context.growth],
    ["Stage", facts.stage ? STAGE_LABEL[facts.stage] : null],
    ["Asking", facts.askingMode ? askingText(facts as ListingFacts) : null],
  ];
  return (
    <section aria-label="Buyer preview" className="border-t border-[#D9D0C1] pt-3">
      <div className={`flex items-baseline justify-between text-[10.5px] font-semibold uppercase tracking-[0.18em] ${FAINT}`}><span>Buyer preview</span><span>Pre-NDA</span></div>
      <p className="mt-2 font-editorial text-[19px] leading-tight text-ex-graphite">{code}</p>
      <dl className="mt-3 space-y-1 text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
            <dt className={FAINT}>{k}</dt>
            <dd className={v ? "text-ex-graphite" : `italic ${FAINT}`}>{v ?? (k === "Revenue" || k === "Growth" ? "Not confirmed" : "Not set")}</dd>
          </div>
        ))}
      </dl>
      <p className={`mt-3 text-[11.5px] leading-relaxed ${FAINT}`}>Buyers see this, the description and the terms. The company name, your identity, exact figures and the data room stay withheld until an NDA.</p>
    </section>
  );
};

/** The full listing for review, set as a buyer will read it. */
const ProfileReview: React.FC<{ facts: ListingFacts; context: IntakeContext }> = ({ facts: f, context }) => (
  <section aria-label="The listing" className="mt-10 border-t border-ex-graphite/80 pt-6">
    <p className="max-w-[64ch] font-editorial text-[19px] leading-relaxed">{f.summary}</p>
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
