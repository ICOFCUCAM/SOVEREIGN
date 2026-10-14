import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListingFactsForm, type IntakeContext } from "./ListingFacts";
import { IdentityMethods, IdentityStatusCard, DevVerificationTools, type IdentityState, type SellerIdentity } from "./IdentityGate";
import { CountrySelect } from "./CountrySelect";
import earthSunrise from "../assets/desk/earth-sunrise-1672.webp";
import waterfrontSkyline from "../assets/desk/waterfront-skyline-720.webp";
import waterfrontCityscape from "../assets/desk/waterfront-cityscape-1672.webp";
import waterfrontCityscapeSmall from "../assets/desk/waterfront-cityscape-720.webp";
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
}

const STAGES = ["Identity", "Company profile", "Review and publish"] as const;
type Stage = 0 | 1 | 2;

// the seller's identity-document country: private to this browser, never part of the listing
const ID_COUNTRY_KEY = "exitos.identity-country.v1";
// the picker starts at the United States until the founder chooses; their choice is remembered here
const DEFAULT_ID_COUNTRY = "US";
const loadIdCountry = (): string => { try { return localStorage.getItem(ID_COUNTRY_KEY) ?? DEFAULT_ID_COUNTRY; } catch { return DEFAULT_ID_COUNTRY; } };
const saveIdCountry = (c: string): void => { try { localStorage.setItem(ID_COUNTRY_KEY, c); } catch { /* kept for this visit */ } };

const PRIMARY = "inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#B9924F] bg-[linear-gradient(180deg,#E3C182_0%,#C9A262_48%,#A9813F_100%)] px-6 py-3 text-[13.5px] font-semibold text-[#1E1A12] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_24px_-12px_rgba(140,100,40,0.8)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8834A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF8F2] disabled:cursor-not-allowed disabled:border-[#D8CFC0] disabled:bg-none disabled:bg-[#E3DBCD] disabled:text-[#9A9387] disabled:shadow-none";
const BACK = "inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-5 py-3 text-[13.5px] font-semibold text-ex-graphite shadow-[0_6px_16px_-10px_rgba(60,45,20,0.45)] ring-1 ring-[#E4DACA] transition hover:ring-[#C9A262] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8834A]";
const SECTION_LEDE: Record<ProfileSection, string> = {
  overview: "What prospective buyers read before they request an NDA. Your draft is kept in this browser as you type.",
  financial: "How the business performs and what you are asking for it. Buyers see revenue and growth as ranges only.",
  transaction: "What transfers to the buyer, how the business earns money, where it sells and what it is built on.",
};
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
  const STAGE_NOTE = ["Verify who you are", "Build your business profile", "Go live on the exchange"];
  const GOLD_WORD = "bg-gradient-to-r from-[#A87F3F] via-[#C9A262] to-[#9A7236] bg-clip-text italic text-transparent";

  return createPortal(
    <div ref={scrollers[0]} role="dialog" aria-modal="true" aria-labelledby="desk-heading" data-page="listing-desk"
      className="fixed inset-0 z-[200] overflow-y-auto bg-[radial-gradient(1200px_700px_at_80%_0%,#FFFFFF_0%,#F3EDE2_45%,#E6DDCD_100%)] text-ex-graphite lg:overflow-hidden lg:p-6">
      <div className="lg:grid lg:h-full lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden lg:rounded-[22px] lg:border lg:border-[#C9A86A]/55 lg:shadow-[0_40px_90px_-40px_rgba(36,30,20,0.6),0_0_0_6px_rgba(255,255,255,0.4)]">

      {/* ── the rail: brand, the three stages, the listing preview ───── */}
      <aside className="relative flex flex-col bg-[linear-gradient(180deg,#17150F_0%,#0B0A08_100%)] text-ex-ivory lg:h-full lg:overflow-y-auto">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-[#C9A86A]/10 via-[#C9A86A]/55 to-[#C9A86A]/10 lg:block" />
        <div className="flex items-center justify-between px-6 pb-5 pt-6 lg:block lg:px-7 lg:pb-0 lg:pt-9">
          <div>
            <div className="font-display text-[30px] font-semibold leading-none text-[#F5ECDA]">ExitOS</div>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#C9A86A]/75">Listing desk</div>
          </div>
          <button type="button" onClick={onClose} className="text-[12.5px] text-ex-ivory/60 underline-offset-4 hover:text-ex-ivory hover:underline lg:hidden">Leave</button>
        </div>

        <nav aria-label="Listing stages" className="px-4 pb-4 lg:mt-10 lg:px-5 lg:pb-0">
          <ol className="flex gap-2 lg:flex-col lg:gap-2.5">
            {STAGES.map((t, i) => {
              const done = stageDone[i]!, locked = i === 2 && !canReview, here = stage === i;
              return (
                <li key={t} className={here ? "min-w-0 flex-[2] lg:flex-none" : "min-w-0 flex-1 lg:flex-none"}>
                  <button type="button" onClick={() => go(i as Stage)} aria-current={here ? "step" : undefined} aria-disabled={locked || undefined}
                    title={locked ? "Opens once your identity is established and the company profile is complete" : undefined}
                    className={`group flex w-full items-center gap-4 rounded-[14px] border px-3 py-2.5 text-left transition lg:px-4 lg:py-4 ${here
                      ? "border-[#C9A86A]/75 bg-[linear-gradient(135deg,rgba(201,168,106,0.18),rgba(201,168,106,0.03))] shadow-[0_0_0_1px_rgba(201,168,106,0.15),0_0_30px_-6px_rgba(214,176,104,0.6)]"
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"} ${locked ? "cursor-not-allowed" : ""}`}>
                    <span className={`font-display text-[24px] leading-none lg:w-8 lg:text-[28px] ${here ? "text-[#E2C07F]" : done ? "text-[#C9A86A]/75" : "text-ex-ivory/35"}`}>{done && !here ? "✓" : `0${i + 1}`}</span>
                    <span className={`min-w-0 ${here ? "" : "max-lg:hidden"}`}>
                      <span className={`block text-[14.5px] font-semibold ${here ? "text-white" : locked ? "text-ex-ivory/35" : "text-ex-ivory/80 group-hover:text-white"}`}>{t}</span>
                      <span className={`mt-0.5 hidden text-[12px] lg:block ${here ? "text-ex-ivory/60" : "text-ex-ivory/35"}`}>{STAGE_NOTE[i]}</span>
                      {i === 1 && !done && (
                        <span className="mt-2 hidden items-center gap-2 lg:flex" aria-label={`${pagesDone} of 3 profile pages complete`}>
                          <span aria-hidden className="h-[3px] w-24 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#A87F3F,#E2C07F)] transition-all" style={{ width: `${(pagesDone / 3) * 100}%` }} /></span>
                          <span aria-hidden className="text-[10.5px] text-ex-ivory/45">{pagesDone}/3 pages</span>
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

        <div className="mt-auto hidden px-5 pb-6 pt-8 lg:block">
          <ListingPreview code={listing.code} context={context} facts={facts} identity={id.identity} />
        </div>
      </aside>

      {/* ── the workspace ───────────────────────────────────────────── */}
      <div ref={scrollers[1]} className="relative flex min-w-0 flex-col overflow-x-hidden bg-[#FBF8F2] lg:h-full lg:overflow-y-auto">
        {/* stage one: the earth at sunrise, fading into the paper on the left */}
        {stage === 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[64%] lg:block">
            <img src={earthSunrise} alt="" className="h-full w-full object-cover object-[78%_center] [mask-image:linear-gradient(90deg,transparent_0%,#000_40%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_40%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#FBF8F2_0%,rgba(251,248,242,0.92)_22%,rgba(251,248,242,0.35)_55%,rgba(251,248,242,0)_80%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#FBF8F2]/80 to-transparent" />
          </div>
        )}
        {/* the profile pages: the waterfront city, top right, fading into the paper */}
        {stage === 1 && (
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-[440px] w-[62%] lg:block">
            <img src={waterfrontCityscape} alt="" className={`h-full w-full object-cover [mask-image:linear-gradient(90deg,transparent_0%,#000_40%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_40%)] ${section === "transaction" ? "object-[88%_60%]" : section === "financial" ? "object-[30%_55%]" : "object-[62%_45%]"}`} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#FBF8F2_0%,rgba(251,248,242,0.85)_20%,rgba(251,248,242,0.2)_52%,rgba(251,248,242,0)_75%)]" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FBF8F2] via-[#FBF8F2]/60 to-transparent" />
          </div>
        )}
        <div className="relative z-10 flex items-center justify-between gap-4 px-6 pt-6 text-[12px] sm:px-10 lg:px-14 lg:pt-8">
          <span className={`inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 backdrop-blur ${live ? "text-ex-graphite" : "text-[#6E685E]"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? "bg-[#4E7A52]" : "border border-[#7A7469]"}`} />
            {live ? "Live exchange" : "This browser only · not connected to the live exchange"}
          </span>
          <div className="flex items-center gap-2">
          {stage === 1 && (
            <button type="button" onClick={saveDraft} aria-describedby="draft-state"
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 font-semibold text-ex-graphite shadow-[0_8px_20px_-12px_rgba(60,45,20,0.5)] ring-1 ring-[#E4DACA] transition hover:ring-[#C9A262]">
              <svg aria-hidden width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[#A8834A]"><path d="M4.2 11.5H3.6A2.6 2.6 0 0 1 3.4 6.3 4.2 4.2 0 0 1 11.6 5a3.3 3.3 0 0 1 .7 6.5h-.5" />{savedAt ? <path d="m5.8 9.6 1.7 1.7 3-3" /> : <path d="M8 12.5V7.8m-1.8 1.8L8 7.8l1.8 1.8" />}</svg>
              {savedAt ? "Draft saved" : "Save draft"}
            </button>
          )}
          <span id="draft-state" role="status" className="sr-only">{savedAt ? "Draft saved in this browser." : ""}</span>
          <button type="button" onClick={onClose} className="hidden rounded-full bg-white/75 px-3.5 py-1.5 text-[#4F4A42] shadow-sm ring-1 ring-black/5 backdrop-blur hover:text-ex-graphite lg:inline">Leave the desk <span aria-hidden>✕</span></button>
          </div>
        </div>

        {/* small screens: the picture as a banner */}
        {stage === 0 && <img src={earthSunrise} alt="" aria-hidden className="mt-5 h-40 w-full object-cover object-[80%_40%] lg:hidden" />}
        {stage === 1 && <img src={waterfrontCityscapeSmall} alt="" aria-hidden className="mt-5 h-40 w-full object-cover object-[70%_55%] lg:hidden" />}

        <main className={`relative z-10 w-full flex-1 px-6 pb-16 pt-8 sm:px-10 lg:px-14 lg:pt-14 ${stage === 0 ? "max-w-[620px]" : "max-w-[880px]"}`}>
          <div className="flex items-center gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8834A]">Step {stage + 1} of 3</p>
            {stage === 1 && (
              <ol aria-label="Company profile pages" className="flex items-center gap-1.5">
                {PROFILE_SECTIONS.map((x, i) => (
                  <li key={x}><button type="button" onClick={() => goSection(x)} aria-current={x === section ? "page" : undefined} title={PROFILE_SECTION_LABEL[x]}
                    className={`block h-1.5 rounded-full transition-all ${x === section ? "w-7 bg-[#B9924F]" : i < sectionAt ? "w-3.5 bg-[#B9924F]/55" : "w-3.5 bg-[#D9CEBB]"}`}><span className="sr-only">{PROFILE_SECTION_LABEL[x]}{missingIn(x, facts).length ? "" : " (complete)"}</span></button></li>
                ))}
              </ol>
            )}
          </div>
          <h1 id="desk-heading" ref={heading} tabIndex={-1} className="mt-4 font-display text-[48px] font-medium leading-[0.98] tracking-[-0.01em] text-[#1A1916] outline-none sm:text-[64px] lg:text-[74px]">
            {stage === 0 && <>Establish your<br /><em className={GOLD_WORD}>identity</em></>}
            {stage === 1 && section === "overview" && <>The company<br /><em className={GOLD_WORD}>profile</em></>}
            {stage === 1 && section === "financial" && <>Financial profile</>}
            {stage === 1 && section === "transaction" && <>Transaction profile</>}
            {stage === 2 && <>Review and<br /><em className={GOLD_WORD}>publish</em></>}
          </h1>

          {stage === 0 && (
            <>
              <p className="mt-6 max-w-[50ch] text-[16px] leading-[1.7] text-[#4F4A42]">
                Identity verification helps protect the integrity of the ExitOS acquisition exchange. Your identity remains undisclosed to prospective buyers until the applicable NDA and disclosure conditions are satisfied.
              </p>
              {verified ? (
                <div className="mt-10"><IdentityStatusCard identity={id.identity} /></div>
              ) : (
                <>
                  <div className="mt-10 max-w-[440px]">
                    <CountrySelect id="id-country" label="Country of your identity document or eID" value={idCountry} onChange={setIdCountry}
                      hint="Used only to offer the verification methods that work for you. Never shown to buyers." />
                  </div>
                  <div className="mt-10"><IdentityMethods id={id} country={idCountry} /></div>
                </>
              )}
              {id.devTools && <div className="mt-8"><DevVerificationTools id={id} provider={devProvider} /></div>}
            </>
          )}

          {stage === 1 && (
            <>
              <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.7] text-[#4F4A42]">{SECTION_LEDE[section]}</p>
              <div className="mt-12"><ListingFactsForm key={section} value={facts} onChange={editFacts} tone="porcelain" context={context} showStatus={false} section={section} /></div>
            </>
          )}

          {stage === 2 && (
            <>
              <p className="mt-6 max-w-[60ch] text-[16px] leading-[1.7] text-[#4F4A42]">
                {live ? "Publishing places the anonymised listing on the live exchange, where buyers can request an NDA. You can withdraw it at any time." : "This build is not connected to the live exchange. Saving keeps the listing in this browser only; no buyer will see it."}
              </p>
              <ProfileReview facts={facts as ListingFacts} context={context} />
            </>
          )}

          {/* on small screens the rail's preview follows the stage */}
          <div className="mt-14 lg:hidden"><ListingPreview code={listing.code} context={context} facts={facts} identity={id.identity} /></div>
        </main>

        {/* ── action bar: security note, what this stage still requires, the next action ── */}
        <footer className="sticky bottom-0 z-20 border-t border-[#E7DECF] bg-[#FBF8F2]/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 sm:px-10 lg:px-14">
            <div className="min-w-0 flex-1 basis-full space-y-1 sm:basis-auto">
              <p className="flex items-center gap-2 text-[12px] text-[#6E685E]">
                <svg aria-hidden width="14" height="16" viewBox="0 0 14 16" className="shrink-0 text-[#A8834A]"><path d="M7 1 1.5 3v4.5C1.5 11 4 13.8 7 15c3-1.2 5.5-4 5.5-7.5V3L7 1Z" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="m4.6 8 1.7 1.7L9.6 6.4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                Encrypted in transit · your identity is never shown to buyers
              </p>
              <dl className="grid gap-0.5 text-[12px]" aria-live="polite">
                <Req label="Identity" ok={verified} active={stage === 0 || stage === 2}
                  text={verified ? `Established${id.identity?.local ? " (test, development server)" : ""}` : identityNeeds.join(" · ")} />
                <Req label="Company profile" ok={profileDone} active={stage === 1 || stage === 2}
                  text={profileDone ? "Complete" : stage === 1 ? (sectionMissing.length ? `This page: ${sectionMissing.join(" · ")}` : `This page is complete · ${missing.length} elsewhere in the profile`) : `${missing.length} item${missing.length === 1 ? "" : "s"} to complete`} />
              </dl>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {stage === 1 && <button type="button" className={BACK} onClick={() => (sectionAt === 0 ? go(0) : goSection(PROFILE_SECTIONS[sectionAt - 1]!))}><span aria-hidden>←</span> Back</button>}
              {stage === 2 && <button type="button" className={BACK} onClick={() => go(1, "transaction")}><span aria-hidden>←</span> Back</button>}
              {stage === 0 && <button type="button" className={PRIMARY} onClick={() => go(1)}>Continue <span aria-hidden>→</span></button>}
              {stage === 1 && sectionAt < 2 && <button type="button" className={PRIMARY} onClick={() => goSection(PROFILE_SECTIONS[sectionAt + 1]!)}>Continue <span aria-hidden>→</span></button>}
              {stage === 1 && sectionAt === 2 && <button type="button" className={PRIMARY} disabled={!canReview} onClick={() => go(2)} aria-describedby={canReview ? undefined : "why-locked"}>Continue to review <span aria-hidden>→</span></button>}
              {stage === 2 && <button type="button" className={PRIMARY} disabled={!canReview} onClick={onPublish}>{updating ? "Publish the update" : live ? "Publish to the exchange" : "Save in this browser"}</button>}
            </div>
            {stage === 1 && sectionAt === 2 && !canReview && <p id="why-locked" className={`basis-full text-[11.5px] ${FAINT}`}>Review opens once {!verified && !profileDone ? "your identity is established and the profile is complete" : !verified ? "your identity is established" : "the profile is complete"}.</p>}
          </div>
        </footer>
      </div>
      </div>
    </div>,
    document.body,
  );
};

/** The listing preview: a picture, the code name and the saved values only, with honest gaps. */
const ListingPreview: React.FC<{ code: string; context: IntakeContext; facts: Partial<ListingFacts>; identity: SellerIdentity | null }> = ({ code, context, facts, identity }) => {
  const region = facts.region ? (facts.region === "Other" ? "Global" : facts.region) : null;
  const rows: Array<[string, string | null]> = [
    ["Sector", context.sector],
    ["Region", region],
    ["Stage", facts.stage ? STAGE_LABEL[facts.stage] : null],
    ["Asking", facts.askingMode ? askingText(facts as ListingFacts) : null],
  ];
  return (
    <section aria-label="Listing preview, as buyers see it before an NDA" className="overflow-hidden rounded-[14px] border border-[#C9A86A]/50 bg-[#13110D] text-ex-ivory shadow-[0_20px_40px_-24px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-[0.2em]">
        <span className="text-[#D9B676]">Listing preview</span><span className="text-ex-ivory/35">Pre-NDA</span>
      </div>
      <div className="relative mx-3 overflow-hidden rounded-[10px]">
        <img src={waterfrontSkyline} alt="" aria-hidden className="block h-[112px] w-full object-cover object-[45%_60%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <span className="absolute bottom-2 left-3 font-display text-[22px] leading-none text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">{code}</span>
      </div>
      <dl className="px-4 pb-3 pt-2 text-[12.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] py-1.5 last:border-0">
            <dt className="text-ex-ivory/45">{k}</dt>
            <dd className={v ? "text-right text-ex-ivory" : "text-right italic text-ex-ivory/35"}>{v ?? "Not set"}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[11.5px]">
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${identity ? "bg-[#D9B676]" : "border border-ex-ivory/40"}`} />
        <span className="text-ex-ivory/60">{identity ? `${identity.local ? "Seller marked for testing" : "Verified seller"} · ${providerLabel(identity.provider)}` : "Seller identity not yet established"}</span>
      </div>
    </section>
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
