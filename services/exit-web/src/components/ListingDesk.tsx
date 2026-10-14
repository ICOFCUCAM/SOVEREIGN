import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListingFactsForm, type IntakeContext } from "./ListingFacts";
import { VerificationPathways, IdentityStatusCard, DevVerificationTools, type IdentityState } from "./IdentityGate";
import { providersFor } from "../lib/identity";
import {
  missingFacts, askingText, STAGE_LABEL, FOR_SALE_LABEL, MODEL_LABEL, type ListingFacts,
} from "../lib/listing-facts";

// ── THE LISTING DESK ────────────────────────────────────────────────
// Listing a company is a formal act on an acquisition exchange, so it has a page of its own rather than
// a form inside the console: three stages (identity, company profile, review and publish), the
// opportunity brief buyers will read beside every stage, and one persistent action bar that says what
// is still required. Publishing stays gated on the server — identity and listing rules are enforced by
// the database, not by this page — and the page says plainly whether the listing goes to the live
// exchange or stays in this browser.

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

const PRIMARY = "inline-flex items-center justify-center gap-2 rounded-ex-xs bg-ex-graphite px-5 py-3 text-[13.5px] font-semibold text-ex-ivory transition hover:bg-[#111310] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-ex-porcelain disabled:cursor-not-allowed disabled:bg-[#B9B2A6] disabled:text-white";
const QUIET = "inline-flex items-center justify-center gap-2 rounded-ex-xs px-3 py-3 text-[13.5px] font-semibold text-ex-slate-ink transition hover:text-ex-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze";
const FAINT = "text-[#8A8378]";
const Rule: React.FC = () => <hr className="border-0 border-t border-[#D9D0C1]" />;

export const ListingDesk: React.FC<Props> = ({ onClose, listing, context, facts, setFacts, id, onPublish, updating, live }) => {
  const missing = missingFacts(facts);
  const verified = !!id.identity;
  const [stage, setStage] = useState<Stage>(() => (verified ? (missing.length ? 1 : 2) : 0));
  const complete = [verified, missing.length === 0, false];
  const sheet = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const go = (s: Stage): void => { setStage(s); sheet.current?.scrollTo({ top: 0 }); requestAnimationFrame(() => heading.current?.focus()); };

  // a sheet of its own: no page scroll beneath it, Escape returns to the console
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    heading.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const required = [...(verified ? [] : ["Establish your identity"]), ...missing];
  const canPublish = required.length === 0;
  const national = providersFor(facts.basedIn).suggested[0]!;

  // rendered at the document root, above the console and outside its stacking contexts
  return createPortal(
    <div ref={sheet} role="dialog" aria-modal="true" aria-labelledby="desk-heading" data-page="listing-desk"
      className="fixed inset-0 z-[200] overflow-y-auto bg-ex-porcelain text-ex-graphite [font-feature-settings:'kern','liga']">
      {/* ── top bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-[#D9D0C1] bg-ex-porcelain/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-4 sm:px-8">
          <span className="font-editorial text-[21px] font-semibold tracking-tight">ExitOS</span>
          <span aria-hidden className="h-4 w-px bg-[#D9D0C1]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ex-slate-ink">Listing desk</span>
          <span className={`ml-2 hidden items-center gap-1.5 text-[11.5px] sm:inline-flex ${live ? "text-ex-graphite" : "text-ex-bronze-ink"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ex-graphite" : "border border-ex-bronze-ink"}`} />
            {live ? "Live exchange" : "This browser only · not connected to the live exchange"}
          </span>
          <button type="button" onClick={onClose} className="ml-auto text-[13px] font-medium text-ex-slate-ink underline-offset-4 hover:text-ex-graphite hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze">
            Leave the desk
          </button>
        </div>
        {/* progress: restrained numerals on one fine rule */}
        <nav aria-label="Listing stages" className="mx-auto max-w-[1180px] px-5 pb-4 sm:px-8">
          <ol className="flex items-center gap-3">
            {STAGES.map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <li aria-hidden className={`h-px flex-1 ${complete[i - 1] ? "bg-ex-graphite" : "bg-[#D9D0C1]"}`} />}
                <li>
                  <button type="button" onClick={() => go(i as Stage)} aria-current={stage === i ? "step" : undefined}
                    className={`flex items-baseline gap-2 whitespace-nowrap text-[12.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze ${stage === i ? "text-ex-graphite" : "text-[#8A8378] hover:text-ex-graphite"}`}>
                    <span className={`font-editorial text-[14px] ${stage === i ? "text-ex-bronze-ink" : ""}`}>{complete[i] && stage !== i ? "✓" : `0${i + 1}`}</span>
                    <span className={`${stage === i ? "font-semibold" : ""} ${i === stage ? "" : "hidden sm:inline"}`}>{t}</span>
                    <span className="sr-only">{complete[i] ? " (complete)" : ""}</span>
                  </button>
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-14 px-5 pb-40 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* ── the stage ─────────────────────────────────────────────── */}
        <main className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ex-bronze-ink">Stage 0{stage + 1} of 03</p>
          <h1 id="desk-heading" ref={heading} tabIndex={-1} className="mt-3 font-editorial text-[36px] leading-[1.06] tracking-tight outline-none sm:text-[46px]">
            {stage === 0 && <>Establish your <em className="italic text-ex-bronze-ink">identity</em></>}
            {stage === 1 && <>The company <em className="italic text-ex-bronze-ink">profile</em></>}
            {stage === 2 && <>Review and <em className="italic text-ex-bronze-ink">publish</em></>}
          </h1>

          {stage === 0 && (
            <>
              <p className="mt-5 max-w-[62ch] text-[15.5px] leading-relaxed text-ex-slate-ink">
                Identity verification helps protect the integrity of the ExitOS acquisition exchange. Your identity remains undisclosed to prospective buyers until the applicable NDA and disclosure conditions are satisfied.
              </p>
              <div className="mt-12"><VerificationPathways id={id} basedIn={facts.basedIn} onBasedIn={(c) => setFacts({ ...facts, basedIn: c, region: facts.region ?? (/united states/i.test(c) ? "North America" : "Europe") })} /></div>
              <div className="mt-14"><Rule /></div>
              <ol className="mt-8 grid gap-8 sm:grid-cols-3">
                {[
                  ["You confirm with the provider", "On the provider's own page or app. ExitOS never sees your credentials."],
                  ["ExitOS records the result", "The method, date and country the provider reports — not your documents or identity number."],
                  ["Buyers see a verified seller", "Your listing carries “Verified seller” and the method, never your name."],
                ].map(([t, d], i) => (
                  <li key={t}>
                    <div className="font-editorial text-[13px] italic text-ex-bronze-ink">{["i", "ii", "iii"][i]}</div>
                    <div className="mt-1 text-[13.5px] font-semibold">{t}</div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ex-slate-ink">{d}</p>
                  </li>
                ))}
              </ol>
              {id.devTools && <div className="mt-10"><DevVerificationTools id={id} provider={national.id} /></div>}
            </>
          )}

          {stage === 1 && (
            <>
              <p className="mt-5 max-w-[62ch] text-[15.5px] leading-relaxed text-ex-slate-ink">What prospective buyers read before they request an NDA. Write it as you would for a serious acquirer. Your draft is kept in this browser as you type.</p>
              <div className="mt-12"><ListingFactsForm value={facts} onChange={setFacts} tone="porcelain" context={context} showStatus={false} /></div>
            </>
          )}

          {stage === 2 && (
            <>
              <p className="mt-5 max-w-[62ch] text-[15.5px] leading-relaxed text-ex-slate-ink">
                {live ? "Publishing places the anonymised listing on the live exchange, where verified buyers can request an NDA. You can withdraw it at any time." : "This build is not connected to the live exchange. Saving keeps the listing in this browser only; no buyer will see it."}
              </p>
              <ul className="mt-10 border-y border-[#D9D0C1]" aria-label="Requirements">
                {[
                  { ok: verified, t: "Identity", d: verified ? (id.identity?.local ? "Marked for testing in this development build." : "Established with a verification provider.") : "Not yet established.", fix: 0 as Stage },
                  { ok: missing.length === 0, t: "Company profile", d: missing.length ? `Still needed: ${missing.join(" · ")}.` : "Complete.", fix: 1 as Stage },
                ].map((r) => (
                  <li key={r.t} className="flex items-start gap-4 border-b border-[#E6DFD3] py-5 last:border-0">
                    <span aria-hidden className={`mt-0.5 font-editorial text-[16px] ${r.ok ? "text-ex-graphite" : "text-[#B9B2A6]"}`}>{r.ok ? "✓" : "○"}</span>
                    <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold">{r.t}<span className="sr-only">{r.ok ? ": complete" : ": incomplete"}</span></div><p className="mt-0.5 text-[13px] text-ex-slate-ink">{r.d}</p></div>
                    {!r.ok && <button type="button" onClick={() => go(r.fix)} className="text-[12.5px] font-semibold text-ex-bronze-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ex-bronze">Complete</button>}
                  </li>
                ))}
              </ul>
              {missing.length === 0 && <ProfileReview facts={facts as ListingFacts} />}
            </>
          )}
        </main>

        {/* ── supporting column ─────────────────────────────────────── */}
        <aside aria-label="Opportunity brief and status" className="space-y-8 lg:sticky lg:top-[132px] lg:self-start">
          <OpportunityBrief code={listing.code} context={context} facts={facts} />
          <IdentityStatusCard identity={id.identity} />
          <section aria-label="Confidentiality" className="border-t border-[#D9D0C1] pt-4 text-[12.5px] leading-relaxed">
            <div className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${FAINT}`}>Confidentiality</div>
            <p className="mt-2 text-ex-slate-ink"><span className="font-semibold text-ex-graphite">Before an NDA,</span> buyers see this brief: sector, region, revenue and growth ranges, the description, stage, transaction terms and the verification method.</p>
            <p className="mt-2 text-ex-slate-ink"><span className="font-semibold text-ex-graphite">Withheld until an NDA</span> and your disclosure: the company's name, your identity, exact financials and the data room.</p>
          </section>
        </aside>
      </div>

      {/* ── persistent action bar ─────────────────────────────────── */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#D9D0C1] bg-ex-porcelain/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-5 py-3.5 sm:px-8">
          <p role="status" aria-live="polite" className="min-w-0 basis-full text-[12.5px] text-ex-slate-ink sm:basis-auto sm:flex-1">
            {canPublish
              ? <><span className="font-semibold text-ex-graphite">Ready.</span> {live ? "The listing can be published." : "The listing can be saved in this browser."}</>
              : <><span className="font-semibold text-ex-graphite">{required.length} requirement{required.length === 1 ? "" : "s"} outstanding:</span> {required.slice(0, 3).join(" · ")}{required.length > 3 ? ` · and ${required.length - 3} more` : ""}.</>}
          </p>
          {stage > 0 && <button type="button" className={`${QUIET} max-sm:hidden`} onClick={() => go((stage - 1) as Stage)}><span aria-hidden>←</span> {STAGES[stage - 1]}</button>}
          {stage < 2
            ? <button type="button" className={PRIMARY} onClick={() => go((stage + 1) as Stage)}>{stage === 0 && !verified ? "Continue to the company profile" : `Continue to ${STAGES[stage + 1].toLowerCase()}`} <span aria-hidden>→</span></button>
            : <button type="button" className={PRIMARY} disabled={!canPublish} onClick={onPublish}>{updating ? "Publish the update" : live ? "Publish to the exchange" : "Save in this browser"}</button>}
        </div>
      </footer>
    </div>,
    document.body,
  );
};

/** The anonymised listing as a confidential opportunity brief — the saved values only. */
const OpportunityBrief: React.FC<{ code: string; context: IntakeContext; facts: Partial<ListingFacts> }> = ({ code, context, facts }) => {
  const region = facts.region ? (facts.region === "Other" ? "Global" : facts.region) : "Region not set";
  const forSale = (facts.forSale ?? []).map((x) => FOR_SALE_LABEL[x]).join(", ");
  return (
    <section aria-label="Opportunity brief, as buyers will see it" className="bg-white px-6 pb-6 pt-5 shadow-[0_1px_0_rgba(36,37,34,0.06),0_24px_48px_-36px_rgba(36,37,34,0.45)] ring-1 ring-[#E6DFD3]">
      <div className="flex items-baseline justify-between gap-3 border-b border-ex-graphite pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ex-graphite">Opportunity brief</span>
        <span className={`whitespace-nowrap text-[10px] uppercase tracking-[0.16em] ${FAINT}`}>Confidential · Pre-NDA</span>
      </div>
      <h2 className="mt-4 font-editorial text-[26px] leading-tight">{code}</h2>
      <p className="mt-0.5 text-[12.5px] text-ex-slate-ink">{context.sector} · {region}{facts.basedIn ? ` · ${facts.basedIn}` : ""}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 border-y border-[#E6DFD3] py-3">
        <div><dt className={`text-[10px] uppercase tracking-[0.16em] ${FAINT}`}>Revenue (TTM)</dt><dd className="mt-0.5 font-editorial text-[19px]">{context.unconfirmed ? "Not confirmed" : context.revenue}</dd></div>
        <div><dt className={`text-[10px] uppercase tracking-[0.16em] ${FAINT}`}>Growth</dt><dd className="mt-0.5 font-editorial text-[19px]">{context.unconfirmed ? "Not confirmed" : context.growth}</dd></div>
      </dl>
      <p className={`mt-4 text-[13px] leading-relaxed ${facts.summary ? "text-ex-graphite" : `italic ${FAINT}`}`}>{facts.summary?.trim() ? (facts.summary.length > 260 ? `${facts.summary.slice(0, 257).trimEnd()}…` : facts.summary) : "The business description appears here."}</p>
      <dl className="mt-4 space-y-1.5 text-[12.5px]">
        {([
          ["Stage", facts.stage ? STAGE_LABEL[facts.stage] : "—"],
          ["For sale", forSale || "—"],
          ["Asking", facts.askingMode ? askingText(facts as ListingFacts) : "—"],
        ] as const).map(([k, v]) => (
          <div key={k} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2"><dt className={FAINT}>{k}</dt><dd className="text-ex-graphite">{v}</dd></div>
        ))}
      </dl>
      <p className={`mt-5 border-t border-[#E6DFD3] pt-3 text-[11.5px] ${FAINT}`}>Company name and seller identity withheld until an NDA.</p>
    </section>
  );
};

/** The company profile, set as a buyer will read it. */
const ProfileReview: React.FC<{ facts: ListingFacts }> = ({ facts: f }) => (
  <section aria-label="Company profile" className="mt-10">
    <p className="max-w-[64ch] font-editorial text-[19px] leading-relaxed">{f.summary}</p>
    <dl className="mt-8 grid gap-x-10 gap-y-5 text-[13.5px] sm:grid-cols-2">
      {([
        ["Company stage", f.stage ? STAGE_LABEL[f.stage] : "—"],
        ["Asking price", askingText(f)],
        ["What is for sale", f.forSale.map((x) => FOR_SALE_LABEL[x]).join(" · ")],
        ["How it makes money", f.models.map((x) => MODEL_LABEL[x]).join(" · ")],
        ["Markets served", f.markets.join(" · ")],
        ["Technology stack", f.builtWith.join(" · ")],
        ["Country of operation", `${f.basedIn} · ${f.region === "Other" ? "Global" : f.region}`],
        ...(f.reasonForSale ? [["Reason for sale", f.reasonForSale]] : []),
      ] as Array<[string, string]>).map(([k, v]) => (
        <div key={k} className="border-t border-[#E6DFD3] pt-2"><dt className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${FAINT}`}>{k}</dt><dd className="mt-1">{v}</dd></div>
      ))}
    </dl>
  </section>
);
