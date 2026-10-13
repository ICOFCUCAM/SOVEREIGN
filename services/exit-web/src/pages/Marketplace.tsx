import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal, Field, inputCls, fmtMoney, notify } from "../lib/ui";
import { PageHeader, Section, Metric, Chip, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { parseNumber } from "../lib/intake-fields";
import { useAuth } from "../lib/auth";
import { buildMarketTape } from "../lib/market-tape";
import { LISTING_PUBLIC as ENGINE_PUBLIC, LISTING_PRIVATE as ENGINE_PRIVATE, LISTING_MATCHES, VALUATION_CANONICAL, useMemorandum } from "../lib/engines";
import { createListing, matchBuyersToListing, runInstitutionalValuation, runReadiness, runBuyerDiscovery, runDueDiligence, type MemorandumInputs } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { label, labels } from "../lib/labels";
import { canonicalValuationFor } from "../lib/canonical-valuation";

// Exit Marketplace — "Become the banker." The sell-side pack gathers the
// engine artefacts a banker would prepare — teaser, CIM, the anonymized
// view and the matched buyers. It publishes nothing and contacts no one:
// listing on the exchange happens from the intake, outreach stays the
// founder's. Below the pipeline, the same listing renders in the
// founder vs. public (anonymized) views.

const OUTREACH_STYLE: Record<string, string> = {
  direct:         "border-xo-verified/50 text-xo-verified",
  banker_intro:   "border-xo-action/50 text-xo-action",
  warm_referral:  "border-xo-caution/50 text-xo-caution",
  cold_intro:     "border-xo-line text-xo-muted",
};

const TYPE_STYLE: Record<string, string> = {
  strategic:      "text-xo-verified",
  pe:             "text-xo-caution",
  vc:             "text-xo-action",
  family_office:  "text-xo-brass",
  sponsor:        "text-xo-muted",
};

type Phase = "idle" | "done";

interface PipelineStep {
  key: string;
  title: string;
  detail: React.ReactNode;   // what the step produced (shown once prepared)
}

// D1: the console shows one enterprise value — the canonical (institutional)
// headline. The listing engine prices the ask from the strategic report, so
// the asking band and the ideal buyer's check size are re-based on the
// canonical band here (display only; the engine's matching is unchanged).
type EngineListing = typeof ENGINE_PRIVATE;
const withCanonicalAsk = (l: EngineListing, h: { low: number; mid: number; high: number }): EngineListing => ({
  ...l,
  askingPriceUsd: { ...l.askingPriceUsd, low: h.low, mid: h.mid, high: h.high },
  idealBuyerProfile: { ...l.idealBuyerProfile, checkSizeUsd: { ...l.idealBuyerProfile.checkSizeUsd, low: h.low, high: h.high } },
});
const LISTING_PRIVATE = withCanonicalAsk(ENGINE_PRIVATE, VALUATION_CANONICAL.headline);
const LISTING_PUBLIC = withCanonicalAsk(ENGINE_PUBLIC, VALUATION_CANONICAL.headline);
const fit = (score: number): string => `${(score * 100).toFixed(0)}/100`;

// Buyers share this route ("Browse Opportunities") but must only ever see
// the anonymized public listing — never the founder's identity, private
// figures, controls or matched-buyer list.
const Marketplace: React.FC = () => {
  const { session } = useAuth();
  return session?.role === "buyer" ? <BuyerMarketplace /> : <FounderMarketplace />;
};

const BuyerMarketplace: React.FC = () => {
  const listing = LISTING_PUBLIC;
  const tape = useMemo(() => buildMarketTape(), []);
  const LINK = "font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  return (
    <div data-page="marketplace" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Marketplace · Buyer" title="Browse Opportunities"
        badge={<Provenance kind="demo">Demo listing</Provenance>}
        description={<>The anonymized public view of the demo company's listing — the same view every buyer gets: no name, no jurisdiction. Every listing on the exchange, with NDA requests and offers, is on the <Link to="/console/acquisition-radar" className={LINK}>Acquisition Radar</Link>.</>} />
      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />
      <Section title={listing.title} eyebrow="Public listing · anonymized" className="border border-xo-line">
        <div className="px-4 py-4">
          <ul className="flex flex-wrap gap-2 text-[12px]">
            <Tag>{listing.businessModel}</Tag>
            <Tag>{listing.sector.replace(/_/g, " ")}</Tag>
            <Tag>founded {listing.foundedYear}</Tag>
            <Tag>jurisdiction {listing.jurisdiction}</Tag>
          </ul>
          <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] sm:grid-cols-3">
            {listing.headline.arrUsd != null && <DataRow label="ARR" value={fmtMoney(listing.headline.arrUsd)} />}
            {listing.headline.ttmRevenueUsd != null && <DataRow label="TTM revenue" value={fmtMoney(listing.headline.ttmRevenueUsd)} />}
            <DataRow label="Gross margin" value={`${(listing.headline.grossMarginPct * 100).toFixed(0)}%`} />
            <DataRow label="ARR growth YoY" value={`${(listing.headline.arrGrowthYoyPct * 100).toFixed(0)}%`} />
            <DataRow label="EBITDA margin" value={`${(listing.headline.ebitdaMarginPct * 100).toFixed(0)}%`} />
            <DataRow label="Asking range" value={`${fmtMoney(listing.askingPriceUsd.low)} – ${fmtMoney(listing.askingPriceUsd.high)}`} />
          </dl>
          <h3 className="mt-6 text-[13px] font-semibold">Highlights</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] text-xo-muted">
            {listing.highlights.map((h) => (
              <li key={h} className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-xo-verified" /> {h}</li>
            ))}
          </ul>
          <p className="mt-6 text-[12px] text-xo-muted">To request an NDA or make an indicative offer, open the listing on the <Link to="/console/acquisition-radar" className={LINK}>Acquisition Radar</Link>.</p>
        </div>
      </Section>
    </div>
  );
};

const FounderMarketplace: React.FC = () => {
  const [view, setView]   = useState<"public" | "founder">("founder");
  const [phase, setPhase] = useState<Phase>("idle");

  // The founder's saved intake when there is one; the demo company otherwise.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const own = useMemo(() => {
    if (!fromIntake) return null;
    const institutional = runInstitutionalValuation(company);
    const canonical = canonicalValuationFor(company, institutional);
    const priv = withCanonicalAsk(createListing(company, { visibility: "private_full" }), canonical.headline);
    const pub = withCanonicalAsk(createListing(company, { visibility: "public_anonymized" }), canonical.headline);
    const memo: Partial<MemorandumInputs> = {
      company, valuation: canonical, constitution: institutional,
      readiness: runReadiness(company), buyers: runBuyerDiscovery(company, { limit: 12 }), diligence: runDueDiligence(company),
    };
    return { priv, pub, matches: matchBuyersToListing(createListing(company, { visibility: "private_full" }), company, { limit: 15 }), memo };
  }, [company, fromIntake]);
  const PRIV = own?.priv ?? LISTING_PRIVATE;
  const PUB = own?.pub ?? LISTING_PUBLIC;
  const MATCHES = own?.matches ?? LISTING_MATCHES;

  const baseListing = view === "founder" ? PRIV : PUB;
  const matches  = MATCHES.matches;

  // Founder edits — local overrides applied on top of the engine listing.
  const [editOpen, setEditOpen] = useState(false);
  const [override, setOverride] = useState<{ askMid: number | null; note: string }>({ askMid: null, note: "" });
  const listing = override.askMid != null
    ? { ...baseListing, askingPriceUsd: { ...baseListing.askingPriceUsd, mid: override.askMid } }
    : baseListing;
  const [editAskText, setEditAskText] = useState<string>(String(Math.round(baseListing.askingPriceUsd.mid / 1e5) / 10));
  const askParse = parseNumber(editAskText, { min: 0.1, max: 1_000_000, scale: 1e6 });
  const [editNote, setEditNote] = useState("");

  const teaserInputs = useMemo(() => ({ anonymize: true, ...own?.memo }), [own]);
  const teaser = useMemorandum("buyer_teaser", teaserInputs);
  const cim    = useMemorandum("cim", own?.memo);

  // The sell-side pack: four artefacts the engines produce. Preparing it
  // publishes nothing and contacts no one — listing on the exchange happens
  // from the intake, and outreach stays the founder's.
  const LINK = "font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const steps: PipelineStep[] = [
    { key: "teaser",  title: "Teaser drafted",
      detail: teaser ? `${teaser.title} · ${teaser.wordCount} words · anonymized` : "Drafting…" },
    { key: "cim",     title: "CIM drafted",
      detail: cim ? <>{cim.sections.length} sections · {cim.wordCount.toLocaleString()} words · <Link to="/console/documents" className={LINK}>open in Documents</Link></> : "Drafting…" },
    { key: "anon",    title: "Anonymized public view",
      detail: `Buyers would see it as "${PUB.title}" — switch to "Public listing" below to check it` },
    { key: "buyers",  title: "Buyers matched",
      detail: `${matches.length} matched buyers · top fit score ${matches[0] ? fit(matches[0].matchScore) : "—"}` },
    { key: "outreach", title: "Outreach — not started",
      detail: <>ExitOS does not contact buyers from here. Plan who to approach in the <Link to="/console/outreach-plan" className={LINK}>Outreach Plan</Link>.</> },
  ];

  const prepare = (): void => setPhase("done");
  const reset   = (): void => setPhase("idle");
  const done = phase === "done" ? steps.length : 0;
  const progressPct = Math.round((done / steps.length) * 100);

  const BTN = "rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const BTN_GHOST = "rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="marketplace" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Exchange · Marketplace · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Exit Marketplace"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Become the banker · {view === "founder" ? "Founder view" : "Public view"}</span></>}
        description={fromIntake ? "Listing, sell-side pack and matched buyers built from your saved intake." : "Built from the demo company. Save an intake to build them for your company."}
        actions={<>
          <a href="/report/cim" target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>Confidential Information Memorandum (PDF) →</a>
          <a href="/report/management" target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>Management Presentation (PDF) →</a>
        </>} />

      <section aria-label="Listing summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Asking price (mid)" emphasis value={fmtMoney(listing.askingPriceUsd.mid)} sub={`band ${fmtMoney(listing.askingPriceUsd.low)}–${fmtMoney(listing.askingPriceUsd.high)}`} /></div>
        <div className="bg-xo-panel"><Metric label="Readiness" value={`${listing.readinessScore.toFixed(0)}/100`} sub={label(listing.readinessBand)} /></div>
        <div className="bg-xo-panel"><Metric label="Matched buyers" emphasis value={String(matches.length)} sub={MATCHES.summary.split(".")[0]} /></div>
        <div className="bg-xo-panel"><Metric label="Visibility" value={label(listing.visibility)} sub={view === "founder" ? "what you see" : "what buyers see"} /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(listing.askingPriceUsd.mid)}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{phase === "done"
            ? <>Your sell-side pack is ready — review the teaser and CIM, then list on the exchange when you are ready.</>
            : <>Prepare the sell-side pack: teaser, CIM, anonymized view and matched buyers.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmtMoney(listing.askingPriceUsd.mid)}</span> asking · band {fmtMoney(listing.askingPriceUsd.low)}–{fmtMoney(listing.askingPriceUsd.high)}.</TakeCell>
            <TakeCell k="If you wait">Without a listing, buyers on the exchange cannot discover you — and bankers charge 1–2% to run a process.</TakeCell>
            <TakeCell k="Top match">{matches[0] ? <>{matches[0].buyerName} — fit score {fit(matches[0].matchScore)}, top of {matches.length}.</> : "No matches yet."}</TakeCell>
            <TakeCell k="What ExitOS does">Drafts the teaser and CIM, builds the anonymized view and matches buyers. It does not publish the listing or contact buyers.</TakeCell>
          </dl>
          <div className="mt-3">{phase === "done"
            ? <Link to="/console/intake" className={BTN}>List on the exchange →</Link>
            : <button type="button" onClick={prepare} className={BTN}>Prepare the sell-side pack</button>}</div>
        </div>
      </Section>

      {/* ── Become the banker · the sell-side pack ──────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="The operating system for company sales." eyebrow="Become the banker" className="lg:col-span-5">
          <div className="px-4 py-4">
            <p className="text-[13px] leading-relaxed text-xo-muted">
              A sell-side banker builds the teaser, writes the CIM, anonymizes your numbers, finds the buyers and runs
              the outreach — for 1–2% of the deal. ExitOS drafts the first four for you; listing on the exchange and the outreach stay your decisions.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {phase === "idle" && <button type="button" onClick={prepare} className={BTN}>Prepare the sell-side pack</button>}
              {phase === "done" && (
                <>
                  <span className="text-[12px] font-semibold text-xo-verified">Pack prepared — nothing published or sent</span>
                  <button type="button" onClick={reset} className={BTN_GHOST}>Clear</button>
                </>
              )}
            </div>
          </div>
        </Section>

        <Section title="Sell-side pack" className="lg:col-span-7"
          right={<span className="text-[11px] text-xo-muted">{phase === "done" ? "4 artefacts prepared · outreach not started" : "Not prepared"}</span>}>
          <div className="px-4 py-4">
            <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-xo-line">
              <div className="h-full rounded-full bg-xo-action motion-safe:transition-all motion-safe:duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <ol aria-live="polite" className="mt-4 space-y-3">
              {steps.map((s, i) => {
                const isDone   = i < done;
                return (
                  <li key={s.key} className="flex items-start gap-3">
                    <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                      isDone ? "border-xo-verified/60 text-xo-verified" : "border-xo-line text-xo-muted"}`}>
                      {isDone ? (s.key === "outreach" ? "–" : "✓") : i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-semibold ${isDone ? "text-xo-text" : "text-xo-muted"}`}>{s.title}</div>
                      <div className="mt-0.5 text-[12px] leading-snug text-xo-muted">{isDone ? s.detail : "Not prepared yet"}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            {phase === "done" && (
              <div className="mt-4 border border-xo-line bg-xo-ink p-3">
                <h3 className="text-[12px] font-semibold">What happens next</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-xo-muted">
                  Nothing has been published or sent. To list the company on the exchange — where buyers on the Acquisition Radar see it anonymized and can request an NDA — use <Link to="/console/intake" className={LINK}>List on the exchange</Link>. Suggested first approaches for the matched buyers:
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {matches.slice(0, 6).map((m) => (
                    <li key={m.buyerName} className={`rounded-sm border px-1.5 py-px text-[11px] font-medium ${OUTREACH_STYLE[m.suggestedOutreach]}`}>
                      {m.buyerName} · {m.suggestedOutreach.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ── Your listing ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Your listing" className="lg:col-span-8"
          right={<div role="group" aria-label="Listing view" className="inline-flex gap-1">
            <Chip pressed={view === "founder"} onToggle={() => setView("founder")}>Founder view</Chip>
            <Chip pressed={view === "public"} onToggle={() => setView("public")}>Public listing</Chip>
          </div>}>
          <div className="px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-xo-brass">Listing</div>
            <h3 className="mt-1 font-serif text-[22px] font-semibold leading-tight">{listing.title}</h3>
            {listing.fullName && view === "founder" && (
              <p className="mt-1 text-[12px] text-xo-muted">Identity (founder view): <span className="text-xo-text">{listing.fullName}</span> · {listing.jurisdiction}</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-2 text-[12px]">
              <Tag>{listing.businessModel}</Tag>
              <Tag>{listing.sector.replace(/_/g, " ")}</Tag>
              <Tag>founded {listing.foundedYear}</Tag>
              <Tag>{listing.jurisdiction}</Tag>
            </ul>

            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] sm:grid-cols-3">
              {listing.headline.arrUsd != null && <DataRow label="ARR"           value={fmtMoney(listing.headline.arrUsd)} />}
              {listing.headline.ttmRevenueUsd != null && <DataRow label="TTM revenue" value={fmtMoney(listing.headline.ttmRevenueUsd)} />}
              <DataRow label="Gross margin"  value={`${(listing.headline.grossMarginPct * 100).toFixed(0)}%`} />
              <DataRow label="ARR growth YoY" value={`${(listing.headline.arrGrowthYoyPct * 100).toFixed(0)}%`} />
              <DataRow label="EBITDA margin" value={`${(listing.headline.ebitdaMarginPct * 100).toFixed(0)}%`} />
              <DataRow label="Asking range"  value={`${fmtMoney(listing.askingPriceUsd.low)} – ${fmtMoney(listing.askingPriceUsd.high)}`} />
            </dl>

            <h4 className="mt-6 text-[13px] font-semibold">Highlights</h4>
            <ul className="mt-2 space-y-1.5 text-[13px] text-xo-muted">
              {listing.highlights.map((h) => (
                <li key={h} className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-xo-verified" /> {h}</li>
              ))}
            </ul>

            <h4 className="mt-6 text-[13px] font-semibold">Ideal buyer profile</h4>
            <dl className="mt-2 grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-3">
              <div><dt className="text-xo-muted">Buyer types</dt><dd className="mt-1 font-medium">{labels(listing.idealBuyerProfile.preferredTypes)}</dd></div>
              <div><dt className="text-xo-muted">Check size</dt><dd className="mt-1 font-medium">{fmtMoney(listing.idealBuyerProfile.checkSizeUsd.low)} – {fmtMoney(listing.idealBuyerProfile.checkSizeUsd.high)}</dd></div>
              <div><dt className="text-xo-muted">Geography</dt><dd className="mt-1 font-medium">{listing.idealBuyerProfile.geography.join(" · ")}</dd></div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/console/intake" className={BTN}>List on the exchange →</Link>
              <button type="button" onClick={() => { setEditAskText(String(Math.round(listing.askingPriceUsd.mid / 1e5) / 10)); setEditNote(override.note); setEditOpen(true); }} className={BTN_GHOST}>Adjust preview</button>
            </div>
            {view === "public" && <p className="mt-3 text-[12px] text-xo-muted">This is the preview buyers would see. They request an NDA from the Acquisition Radar; there is nothing to request here.</p>}
            {override.askMid != null && <p className="mt-3 text-[12px] text-xo-caution">Preview only: the asking mid shown is your adjustment ({fmtMoney(override.askMid)}). It is not saved or published.</p>}
            {override.note && view === "founder" && (
              <p className="mt-3 border border-xo-caution/40 bg-xo-ink px-3 py-2 text-[12px] text-xo-muted"><span className="font-semibold text-xo-caution">Founder note:</span> {override.note}</p>
            )}
          </div>
        </Section>

        <div className="flex flex-col gap-px bg-xo-line lg:col-span-4">
          <Section title="Matched buyers" eyebrow="Matching engine"
            foot="Fit score: the discovery engine's weighted fit (sector, size, geography, activity), 0–100 — not a measured chance of a bid.">
            <ul>
              {matches.slice(0, 8).map((m) => (
                <li key={m.buyerName} className="border-b border-xo-line px-4 py-3 last:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{m.buyerName}</span>
                    <span className="font-mono text-[12px] tabular-nums"><span className="sr-only">fit score </span>{fit(m.matchScore)}</span>
                  </div>
                  <div className={`mt-0.5 text-[11px] font-semibold ${TYPE_STYLE[m.buyerType] ?? "text-xo-muted"}`}>{m.buyerType.replace(/_/g, " ")}</div>
                  <p className="mt-1.5 text-[12px] leading-snug text-xo-muted">{m.rationale}</p>
                  <span className={`mt-2 inline-block rounded-sm border px-1.5 py-px text-[11px] font-medium ${OUTREACH_STYLE[m.suggestedOutreach]}`}>{m.suggestedOutreach.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Marketplace mechanics" className="flex-1">
            <ul className="space-y-2 px-4 py-3 text-[12px] text-xo-muted">
              <li className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-verified" /> Listings publish anonymized by default</li>
              <li className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-verified" /> Buyers request an NDA; you mark it executed in your Inbox. Nothing is revealed automatically — you share identity and data yourself</li>
              <li className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-verified" /> Buyer interest, NDA requests and offers arrive in your Inbox</li>
              <li className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-verified" /> Success fee on closed deals · founder-paid</li>
            </ul>
          </Section>
        </div>
      </div>

      {/* ── Edit listing ────────────────────────────────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Adjust preview" subtitle="Changes this page's preview only — not saved, not published" size="md"
        footer={<><Button variant="ghost" onClick={() => { setOverride({ askMid: null, note: "" }); setEditOpen(false); notify("Preview reset to engine values"); }}>Reset</Button><Button disabled={!askParse.ok} onClick={() => { if (!askParse.ok) return; setOverride({ askMid: askParse.value, note: editNote.trim() }); setEditOpen(false); notify("Preview updated — not saved or published"); }}>Apply to preview</Button></>}>
        <div className="space-y-4">
          <p className="rounded-sm border border-xo-line bg-xo-ink p-3 text-[12px] text-xo-muted">
            Valuation band (canonical, as everywhere in the console): {fmtMoney(baseListing.askingPriceUsd.low)} – {fmtMoney(baseListing.askingPriceUsd.high)} · readiness {baseListing.readinessScore.toFixed(0)}/100 · {baseListing.sector.replace(/_/g, " ")}
          </p>
          <div>
            <label htmlFor="mkt-ask" className={XO_LABEL}>Asking price, mid ($M)</label>
            <input id="mkt-ask" inputMode="decimal" value={editAskText} onChange={(e) => setEditAskText(e.target.value)}
              aria-invalid={!askParse.ok} aria-describedby="mkt-ask-msg" className={XO_INPUT} />
            <span id="mkt-ask-msg" className={`mt-1 block text-[12px] ${askParse.ok ? "text-xo-muted" : "text-xo-risk"}`}>{askParse.ok ? "Overrides the engine mid in this preview; band low/high unchanged." : askParse.error}</span>
          </div>
          <Field label="Founder note" hint="Shown on your founder view of this page only; cleared when you leave">
            <textarea className={`${inputCls} min-h-[80px] resize-y`} placeholder="e.g. hold publication until the audit closes" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="rounded-sm border border-xo-line px-2 py-0.5 font-mono text-[11px] text-xo-muted">{children}</li>
);

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-[11px] text-xo-muted">{label}</dt>
    <dd className="mt-1 font-mono text-[14px] font-semibold tabular-nums">{value}</dd>
  </div>
);

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default Marketplace;
