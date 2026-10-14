import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListingFactsForm, Icon, type IntakeContext } from "./ListingFacts";
import { IdentityMethods, IdentityStatusCard, DevVerificationTools, type IdentityState, type SellerIdentity } from "./IdentityGate";
import { CountrySelect } from "./CountrySelect";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, EYEBROW, H1, ACCENT_WORD, LEDE } from "./desk/ui";
import earthSunrise from "../assets/desk/earth-sunrise-1672.webp";
import { AdPanel, useAdSlides } from "./AdPanel";
import type { Remote } from "../lib/documents/store";
import waterfrontSkyline from "../assets/desk/waterfront-skyline-720.webp";
import waterfrontCityscape from "../assets/desk/waterfront-cityscape-1672.webp";
import globalNetwork from "../assets/desk/global-network-1672.webp";
import { methodOptions, providerLabel } from "../lib/identity";
import { missingFacts, missingIn, askingText, STAGE_LABEL, FOR_SALE_LABEL, MODEL_LABEL, PROFILE_SECTIONS, PROFILE_SECTION_LABEL, type ListingFacts, type ProfileSection } from "../lib/listing-facts";

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
  readonly remote?: Remote;              // where promotions are read and counted (else this browser)
}

const STAGES = ["Identity", "Company profile", "Review and publish"] as const;
export type Stage = 0 | 1 | 2;
const STAGE_NOTE = ["Verify who you are", "Build your business profile", "Go live on the exchange"];

// the seller's identity-document country: private to this browser, never part of the listing
const ID_COUNTRY_KEY = "exitos.identity-country.v1";
// the picker starts at the United States until the founder chooses; their choice is remembered here
const DEFAULT_ID_COUNTRY = "US";
const loadIdCountry = (): string => { try { return localStorage.getItem(ID_COUNTRY_KEY) ?? DEFAULT_ID_COUNTRY; } catch { return DEFAULT_ID_COUNTRY; } };
const saveIdCountry = (c: string): void => { try { localStorage.setItem(ID_COUNTRY_KEY, c); } catch { /* kept for this visit */ } };

const SECTION_LEDE: Record<ProfileSection, string> = {
  overview: "What prospective buyers read before they request an NDA. Your draft is kept in this browser as you type.",
  financial: "How the business performs and what you are asking for it. Buyers see revenue and growth as ranges only.",
  transaction: "What transfers to the buyer, how the business earns money, where it sells and what it is built on.",
};

export const ListingDesk: React.FC<Props> = ({ onClose, listing, context, facts, setFacts, id, onPublish, updating, live, remote }) => {
  const missing = missingFacts(facts);
  const verified = !!id.identity;
  const [idCountry, setIdCountryState] = useState<string>(loadIdCountry);
  const setIdCountry = (c: string): void => { setIdCountryState(c); saveIdCountry(c); };
  const identityNeeds = verified ? [] : [...(idCountry ? [] : ["Choose the country of your identity document"]), "Establish your identity with a verification provider"];
  const profileDone = missing.length === 0;
  const canReview = verified && profileDone;
  const [stage, setStage] = useState<Stage>(() => (canReview ? 2 : verified ? 1 : 0));
  // the profile is three pages; it opens on the first one with something still to fill in
  const [section, setSection] = useState<ProfileSection>(() => PROFILE_SECTIONS.find((x) => missingIn(x, facts).length) ?? "overview");
  const sectionAt = PROFILE_SECTIONS.indexOf(section);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const scrollers = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const heading = useRef<HTMLHeadingElement>(null);
  const toTop = (): void => { for (const r of scrollers) r.current?.scrollTo({ top: 0 }); requestAnimationFrame(() => heading.current?.focus()); };
  const go = (s: Stage, at?: ProfileSection): void => { if (s === 2 && !canReview) return; setStage(s); if (at) setSection(at); toTop(); };
  const goSection = (x: ProfileSection): void => { setSection(x); toTop(); };
  // the parent writes the draft to this browser on every edit; Save draft writes it again and says so
  const editFacts = (f: Partial<ListingFacts>): void => { setFacts(f); setSavedAt(null); };
  const saveDraft = (): void => { setFacts(facts); setSavedAt(Date.now()); };
  const sectionMissing = missingIn(section, facts);
  const pagesDone = PROFILE_SECTIONS.filter((x) => missingIn(x, facts).length === 0).length;

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
  // promotions for this stage; small screens get a compact card after the form, when the operator allows it
  const ads = useAdSlides(remote, (["identity", "profile", "review"] as const)[stage]);
  const mobileAds = ads.settings.mobile_enabled && ads.slides ? ads.slides.filter((x) => x.campaign.mobile) : [];
  // one picture per stage: a half banner in the top right, fading into the paper on its left and below
  const banner = stage === 0 ? { src: earthSunrise, pos: "72% 42%" }
    : stage === 1 ? { src: waterfrontCityscape, pos: section === "transaction" ? "85% 60%" : section === "financial" ? "35% 55%" : "62% 45%" }
    : { src: globalNetwork, pos: "80% 40%" };
  const heading1 = stage === 0 ? <>Establish your <em className={ACCENT_WORD}>identity</em></>
    : stage === 2 ? <>Review and <em className={ACCENT_WORD}>publish</em></>
    : section === "overview" ? <>The company <em className={ACCENT_WORD}>profile</em></>
    : section === "financial" ? <>Financial <em className={ACCENT_WORD}>profile</em></> : <>Transaction <em className={ACCENT_WORD}>profile</em></>;
  const lede = stage === 0
    ? "Identity verification protects the integrity of the exchange. Your identity stays undisclosed to buyers until the NDA and disclosure conditions are met."
    : stage === 2
      ? (live ? "Publishing places the anonymised listing on the live exchange, where buyers can request an NDA. You can withdraw it at any time." : "This build is not connected to the live exchange. Saving keeps the listing in this browser only; no buyer will see it.")
      : SECTION_LEDE[section];

  return createPortal(
    <div ref={scrollers[0]} role="dialog" aria-modal="true" aria-labelledby="desk-heading" data-page="listing-desk"
      className="fixed inset-0 z-[200] overflow-y-auto bg-[#EFE8DC] text-desk-ink lg:overflow-hidden lg:p-5">
      <div className="lg:grid lg:h-full lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden lg:rounded-[20px] lg:shadow-[0_30px_70px_-40px_rgba(36,30,20,0.55)] lg:ring-1 lg:ring-black/5">

      {/* ── the rail: brand, the three stages, and the promotions canvas below them ── */}
      <DeskRail stage={stage} stageDone={stageDone} canReview={canReview} pagesDone={pagesDone} onGo={(i) => go(i)} onClose={onClose}>
        <AdPanel slides={ads.slides} settings={ads.settings} remote={remote} className="mt-6 hidden flex-1 lg:flex" />
      </DeskRail>

      {/* ── the workspace ───────────────────────────────────────────── */}
      <div ref={scrollers[1]} className="relative flex min-w-0 flex-col overflow-x-hidden bg-desk-paper lg:h-full lg:overflow-y-auto">
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-[280px] w-[54%] lg:block">
          <img src={banner.src} alt="" className="h-full w-full object-cover saturate-[0.85] [mask-image:linear-gradient(90deg,transparent_0%,#000_42%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_42%)]" style={{ objectPosition: banner.pos }} />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-desk-paper via-desk-paper/70 to-transparent" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4 px-6 pt-5 text-[12px] sm:px-10 lg:px-14 lg:pt-7">
          <span className={`inline-flex items-center gap-2 ${live ? "text-desk-ink" : "text-desk-muted"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? "bg-desk-success" : "border border-desk-muted"}`} />
            {live ? "Live exchange" : "This browser only · not connected to the live exchange"}
          </span>
          <div className="flex items-center gap-2">
            {stage === 1 && (
              <button type="button" onClick={saveDraft} aria-describedby="draft-state" className={`${BTN_SECONDARY} min-h-[36px] whitespace-nowrap px-3.5 text-[12.5px]`}>
                <svg aria-hidden width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-desk-gold-ink"><path d="M4.2 11.5H3.6A2.6 2.6 0 0 1 3.4 6.3 4.2 4.2 0 0 1 11.6 5a3.3 3.3 0 0 1 .7 6.5h-.5" />{savedAt ? <path d="m5.8 9.6 1.7 1.7 3-3" /> : <path d="M8 12.5V7.8m-1.8 1.8L8 7.8l1.8 1.8" />}</svg>
                {savedAt ? "Draft saved" : "Save draft"}
              </button>
            )}
            <span id="draft-state" role="status" className="sr-only">{savedAt ? "Draft saved in this browser." : ""}</span>
            <button type="button" onClick={onClose} className="hidden min-h-[36px] rounded-[10px] bg-desk-surface/85 px-3 text-desk-text ring-1 ring-desk-line backdrop-blur transition hover:text-desk-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-gold/60 lg:inline-flex lg:items-center lg:gap-1.5">Leave the desk <span aria-hidden>✕</span></button>
          </div>
        </div>

        <main className="relative z-10 w-full max-w-[940px] flex-1 px-6 pb-16 pt-8 sm:px-10 lg:px-14 lg:pt-12">
          {/* the heading; the stage's picture sits behind it as a half banner */}
          <div className="flex items-start justify-between gap-10">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <p className={EYEBROW}>Step {stage + 1} of 3</p>
                {stage === 1 && (
                  <ol aria-label="Company profile pages" className="flex items-center gap-1.5">
                    {PROFILE_SECTIONS.map((x, i) => (
                      <li key={x}><button type="button" onClick={() => goSection(x)} aria-current={x === section ? "page" : undefined} title={PROFILE_SECTION_LABEL[x]}
                        className="grid h-6 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-gold/60">
                        <span aria-hidden className={`block h-1 rounded-full transition-all ${x === section ? "w-7 bg-desk-gold" : i < sectionAt ? "w-3.5 bg-desk-gold/50" : "w-3.5 bg-desk-line-strong/70"}`} />
                        <span className="sr-only">{PROFILE_SECTION_LABEL[x]}{missingIn(x, facts).length ? "" : " (complete)"}</span>
                      </button></li>
                    ))}
                  </ol>
                )}
              </div>
              <h1 id="desk-heading" ref={heading} tabIndex={-1} className={`mt-4 outline-none ${H1}`}>{heading1}</h1>
              <p className={`mt-5 max-w-[54ch] ${LEDE}`}>{lede}</p>
            </div>
          </div>

          {stage === 0 && (
            <div className="mt-12">
              {verified ? <IdentityStatusCard identity={id.identity} /> : (
                <>
                  <div className="max-w-[440px]">
                    <CountrySelect id="id-country" label="Country of your identity document or eID" value={idCountry} onChange={setIdCountry}
                      hint="Used only to offer the verification methods that work for you. Never shown to buyers." />
                  </div>
                  <div className="mt-10"><IdentityMethods id={id} country={idCountry} /></div>
                </>
              )}
              {id.devTools && <div className="mt-8"><DevVerificationTools id={id} provider={devProvider} /></div>}
            </div>
          )}

          {stage === 1 && (
            <>
              <div className="mt-12"><ListingFactsForm key={section} value={facts} onChange={editFacts} tone="porcelain" context={context} showStatus={false} section={section} /></div>
              <div className="mt-14 border-t border-desk-line pt-8">
                <p className={`mb-4 ${EYEBROW}`}>As buyers see it</p>
                <div className="max-w-[360px]"><ListingPreview code={listing.code} context={context} facts={facts} identity={id.identity} /></div>
              </div>
            </>
          )}

          {stage === 2 && (
            <>
              <ProfileReview code={listing.code} facts={facts as ListingFacts} context={context} onEdit={(x) => go(1, x)} />
              <div className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-4 px-5 py-5 sm:px-7 ${CARD}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-desk-gold-tint text-desk-gold-ink"><Icon name="lock" className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1 basis-[240px]">
                  <p className="text-[15.5px] font-semibold text-desk-ink">{updating ? "Ready to publish the update?" : "Ready to publish?"}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-desk-muted">{live
                    ? "Buyers see the listing anonymised and request an NDA to learn more."
                    : "Nothing reaches buyers until this build is connected to the live exchange."}</p>
                </div>
                <button type="button" className={`${BTN_PRIMARY} max-sm:w-full`} disabled={!canReview} onClick={onPublish}>{updating ? "Publish the update" : live ? "Save and publish" : "Save in this browser"} <span aria-hidden>→</span></button>
              </div>
            </>
          )}

          {mobileAds.length > 0 && <AdPanel variant="compact" slides={mobileAds} settings={ads.settings} remote={remote} className="mt-12 lg:hidden" />}
        </main>

        {/* ── action bar: what this stage still requires, and the next action ── */}
        <footer className="sticky bottom-0 z-20 border-t border-desk-line bg-desk-paper/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5 sm:px-10 lg:px-14">
            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
              <dl className="grid gap-0.5 text-[12.5px]" aria-live="polite">
                <Req label="Identity" ok={verified} active={stage === 0 || stage === 2}
                  text={verified ? `Established${id.identity?.local ? " (test, development server)" : ""}` : identityNeeds.join(" · ")} />
                <Req label="Company profile" ok={profileDone} active={stage === 1 || stage === 2}
                  text={profileDone ? "Complete" : stage === 1 ? (sectionMissing.length ? `This page: ${sectionMissing.join(" · ")}` : `This page is complete · ${missing.length} elsewhere in the profile`) : `${missing.length} item${missing.length === 1 ? "" : "s"} to complete`} />
              </dl>
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-desk-faint">
                <svg aria-hidden width="11" height="13" viewBox="0 0 14 16" className="shrink-0"><path d="M7 1 1.5 3v4.5C1.5 11 4 13.8 7 15c3-1.2 5.5-4 5.5-7.5V3L7 1Z" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
                Encrypted in transit · your identity is never shown to buyers
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
              {stage === 1 && <button type="button" className={BTN_SECONDARY} onClick={() => (sectionAt === 0 ? go(0) : goSection(PROFILE_SECTIONS[sectionAt - 1]!))}><span aria-hidden>←</span> Back</button>}
              {stage === 2 && <button type="button" className={BTN_SECONDARY} onClick={() => go(1, "transaction")}><span aria-hidden>←</span> Back</button>}
              {stage === 0 && <button type="button" className={verified ? BTN_PRIMARY : BTN_SECONDARY} onClick={() => go(1)}>{verified ? "Continue" : "Continue to the profile"} <span aria-hidden>→</span></button>}
              {stage === 1 && sectionAt < 2 && <button type="button" className={BTN_PRIMARY} onClick={() => goSection(PROFILE_SECTIONS[sectionAt + 1]!)}>Continue <span aria-hidden>→</span></button>}
              {stage === 1 && sectionAt === 2 && <button type="button" className={BTN_PRIMARY} disabled={!canReview} onClick={() => go(2)} aria-describedby={canReview ? undefined : "why-locked"}>Continue to review <span aria-hidden>→</span></button>}
            </div>
            {stage === 1 && sectionAt === 2 && !canReview && <p id="why-locked" className="basis-full text-[12px] text-desk-muted">Review opens once {!verified && !profileDone ? "your identity is established and the profile is complete" : !verified ? "your identity is established" : "the profile is complete"}.</p>}
          </div>
        </footer>
      </div>
      </div>
    </div>,
    document.body,
  );
};

/** The desk's rail: brand, the three stages, and whatever fills the space below them (the promotions canvas). */
export const DeskRail: React.FC<{ stage: Stage; stageDone: readonly boolean[]; canReview: boolean; pagesDone: number; onGo: (s: Stage) => void; onClose: () => void; children?: React.ReactNode }> = ({ stage, stageDone, canReview, pagesDone, onGo, onClose, children }) => (
  <aside className="relative flex flex-col bg-desk-rail text-desk-ivory lg:h-full lg:overflow-y-auto">
    <div className="flex items-center justify-between px-6 pb-4 pt-5 lg:block lg:px-7 lg:pb-0 lg:pt-8">
      <div>
        <div className="font-display text-[28px] font-semibold leading-none text-desk-ivory">ExitOS</div>
        <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-desk-champagne/70">Listing desk</div>
      </div>
      <button type="button" onClick={onClose} className="min-h-[36px] px-1 text-[12.5px] text-desk-ivory/60 underline-offset-4 hover:text-desk-ivory hover:underline lg:hidden">Leave</button>
    </div>

    <nav aria-label="Listing stages" className="px-4 pb-4 lg:mt-9 lg:px-4 lg:pb-0">
      <ol className="flex gap-2 lg:flex-col lg:gap-1">
        {STAGES.map((t, i) => {
          const done = stageDone[i]!, locked = i === 2 && !canReview, here = stage === i;
          return (
            <li key={t} className={here ? "min-w-0 flex-[2] lg:flex-none" : "min-w-0 flex-1 lg:flex-none"}>
              <button type="button" onClick={() => onGo(i as Stage)} aria-current={here ? "step" : undefined} aria-disabled={locked || undefined}
                title={locked ? "Opens once your identity is established and the company profile is complete" : undefined}
                className={`group flex w-full items-center gap-3.5 rounded-[12px] border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-champagne/60 lg:px-3.5 lg:py-3 ${here
                  ? "border-white/10 bg-white/[0.06]" : "border-transparent hover:bg-white/[0.03]"} ${locked ? "cursor-not-allowed" : ""}`}>
                {done && !here
                  ? <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-desk-champagne/40 text-desk-champagne"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m2.5 6.2 2.3 2.3 4.7-5" /></svg></span>
                  : <span className={`w-7 shrink-0 text-center font-display text-[22px] leading-none ${here ? "text-desk-champagne" : "text-desk-ivory/35"}`}>{`0${i + 1}`}</span>}
                <span className={`min-w-0 ${here ? "" : "max-lg:hidden"}`}>
                  <span className={`block text-[14px] font-semibold ${here ? "text-desk-ivory" : locked ? "text-desk-ivory/35" : "text-desk-ivory/75 group-hover:text-desk-ivory"}`}>{t}</span>
                  <span className={`mt-0.5 hidden text-[12px] lg:block ${here ? "text-desk-ivory/55" : "text-desk-ivory/35"}`}>{done && !here ? "Completed" : STAGE_NOTE[i]}</span>
                  {i === 1 && !done && (
                    <span className="mt-2 hidden items-center gap-2 lg:flex" aria-label={`${pagesDone} of 3 profile pages complete`}>
                      <span aria-hidden className="h-[2px] w-20 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-desk-champagne/80 transition-all" style={{ width: `${(pagesDone / 3) * 100}%` }} /></span>
                      <span aria-hidden className="text-[10.5px] text-desk-ivory/40">{pagesDone}/3 pages</span>
                    </span>
                  )}
                </span>
                <span className="sr-only">{done ? " (complete)" : locked ? " (not yet available)" : ""}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>

    {children}
  </aside>
);

/** The listing preview: the code name and the saved values only, with honest gaps. */
const ListingPreview: React.FC<{ code: string; context: IntakeContext; facts: Partial<ListingFacts>; identity: SellerIdentity | null }> = ({ code, context, facts, identity }) => {
  const region = facts.region ? (facts.region === "Other" ? "Global" : facts.region) : null;
  const rows: Array<[string, string | null]> = [
    ["Sector", context.sector],
    ["Region", region],
    ["Stage", facts.stage ? STAGE_LABEL[facts.stage] : null],
    ["Asking", facts.askingMode ? askingText(facts as ListingFacts) : null],
  ];
  return (
    <section aria-label="Listing preview, as buyers see it before an NDA" className={`overflow-hidden ${CARD}`}>
      <div className="relative">
        <img src={waterfrontSkyline} alt="" aria-hidden className="block h-[92px] w-full object-cover object-[45%_60%] saturate-[0.82]" />
        <span className="absolute right-3 top-3 rounded-full bg-desk-surface/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-desk-muted">Pre-NDA</span>
      </div>
      <div className="px-4 pb-3 pt-3.5">
        <p className="font-display text-[22px] leading-none text-desk-ink">{code}</p>
        <dl className="mt-3 text-[13px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-t border-desk-line py-1.5">
              <dt className="text-desk-muted">{k}</dt>
              <dd className={v ? "text-right text-desk-ink" : "text-right italic text-desk-faint"}>{v ?? "Not set"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex items-center gap-2 border-t border-desk-line bg-desk-tint px-4 py-2.5 text-[12px] text-desk-muted">
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${identity ? "bg-desk-success" : "border border-desk-faint"}`} />
        {identity ? `${identity.local ? "Seller marked for testing" : "Verified seller"} · ${providerLabel(identity.provider)}` : "Seller identity not yet established"}
      </div>
    </section>
  );
};

/** One requirement group in the action bar. */
const Req: React.FC<{ label: string; ok: boolean; active: boolean; text: string }> = ({ label, ok, active, text }) => (
  <div className={`flex min-w-0 items-baseline gap-2 ${active ? "" : "opacity-60"}`}>
    <dt className="flex shrink-0 items-baseline gap-1.5 font-semibold text-desk-ink">
      <span aria-hidden className={ok ? "text-desk-success" : "text-desk-faint"}>{ok ? "✓" : "○"}</span>{label}<span className="sr-only">{ok ? ": done" : ": outstanding"}</span>
    </dt>
    <dd className="min-w-0 truncate text-desk-muted" title={text}>{text}</dd>
  </div>
);

/** The full listing for review, set as a buyer will read it after an NDA, with a way back to each page. */
const ProfileReview: React.FC<{ code: string; facts: ListingFacts; context: IntakeContext; onEdit: (x: ProfileSection) => void }> = ({ code, facts: f, context, onEdit }) => {
  type Row = [Parameters<typeof Icon>[0]["name"], string, string];
  const left: Row[] = [
    ["building", "Sector", context.sector],
    ["globe", "Region", f.region === "Other" ? "Global" : f.region],
    ["steps", "Company stage", f.stage ? STAGE_LABEL[f.stage] : "—"],
    ["tag", "Asking price", askingText(f)],
    ["box", "What is for sale", f.forSale.map((x) => FOR_SALE_LABEL[x]).join(" · ")],
  ];
  const right: Row[] = [
    ["coins", "How it makes money", f.models.map((x) => MODEL_LABEL[x]).join(" · ")],
    ["market", "Markets served", f.markets.join(" · ")],
    ["stack", "Technology stack", f.builtWith.join(" · ")],
    ["flag", "Country of operation", f.basedIn],
    ["chart", "Revenue and growth", context.unconfirmed ? "Not confirmed" : `${context.revenue} · ${context.growth}`],
  ];
  const col = (rows: Row[]): React.ReactNode => (
    <dl className="space-y-4">{rows.map(([icon, k, v]) => (
      <div key={k} className="relative min-w-0 pl-8">
        <dt className="text-[12px] text-desk-muted"><Icon name={icon} className="absolute left-0 top-0.5 text-desk-faint" />{k}</dt>
        <dd className="mt-0.5 text-[14px] font-medium leading-snug text-desk-ink">{v}</dd>
      </div>
    ))}</dl>
  );
  return (
    <section aria-label="The listing" className={`mt-12 p-5 sm:p-7 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <img src={waterfrontSkyline} alt="" aria-hidden className="hidden h-14 w-20 shrink-0 rounded-[10px] object-cover object-[45%_60%] saturate-[0.82] sm:block" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-desk-muted">Listing</p>
            <h2 className="mt-1 font-display text-[30px] font-medium leading-none text-desk-ink">{code}</h2>
          </div>
        </div>
        <details className="relative shrink-0">
          <summary className={`${BTN_SECONDARY} min-h-[36px] cursor-pointer list-none px-4 text-[12.5px] [&::-webkit-details-marker]:hidden`}>Edit</summary>
          <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-[12px] border border-desk-line bg-desk-surface py-1 shadow-[0_16px_40px_-20px_rgba(60,45,20,0.4)]">
            {PROFILE_SECTIONS.map((x) => <button key={x} type="button" onClick={() => onEdit(x)} className="block w-full px-4 py-2.5 text-left text-[13px] text-desk-text hover:bg-desk-tint hover:text-desk-ink focus-visible:bg-desk-tint focus-visible:outline-none">{PROFILE_SECTION_LABEL[x]}</button>)}
          </div>
        </details>
      </div>
      <div className="mt-7 grid gap-x-10 gap-y-4 border-t border-desk-line pt-6 sm:grid-cols-2">{col(left)}{col(right)}</div>
      <div className="mt-7 border-t border-desk-line pt-6">
        <p className="text-[12px] text-desk-muted">What the business does</p>
        <p className="mt-1.5 max-w-[68ch] font-display text-[19px] leading-[1.55] text-desk-ink">{f.summary}</p>
        {f.reasonForSale && <p className="mt-4 text-[13.5px] text-desk-text"><span className="text-desk-muted">Reason for sale · </span>{f.reasonForSale}</p>}
      </div>
    </section>
  );
};
