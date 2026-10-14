import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Modal, Field, inputCls, fmtMoney, notify } from "../lib/ui";
import { PageHeader, Section, Metric, Chip, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { parseNumber } from "../lib/intake-fields";
import { useAuth } from "../lib/auth";
import { buildMarketTape } from "../lib/market-tape";
import { LISTING_PUBLIC as ENGINE_PUBLIC, LISTING_PRIVATE as ENGINE_PRIVATE, LISTING_MATCHES, VALUATION_CANONICAL, useMemorandum } from "../lib/engines";
import { createListing, matchBuyersToListing, runInstitutionalValuation, type MemorandumInputs } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { memorandumInputs } from "../lib/documents/memorandum-inputs";
import { inlineLabel, label, labels } from "../lib/labels";
import { sectorLabel } from "../lib/market-stats";
import { canonicalValuationFor } from "../lib/canonical-valuation";

// Exit Marketplace — "Become the banker." Most founders never hire a
// banker because bankers are expensive; ExitOS does the banker's job.
// The "Publish Opportunity" pipeline runs the full sell-side workflow in
// one click — teaser, CIM, anonymization, buyer identification, outreach —
// each step backed by a real engine artifact (memorandum generator +
// listing engine). Below the pipeline, the same listing renders in the
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

type Phase = "idle" | "running" | "done";

interface PipelineStep {
  key: string;
  title: string;
  detail: string;       // what the step produced (shown once complete)
  running: string;      // verb shown while in flight
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
            <Tag>{sectorLabel(listing.sector)}</Tag>
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
  const [done, setDone]   = useState<number>(0);

  // The founder's saved intake when there is one; the demo company otherwise.
  const { company, fromIntake, story } = useMemo(() => loadActiveCompany(), []);
  const own = useMemo(() => {
    if (!fromIntake) return null;
    const institutional = runInstitutionalValuation(company);
    const canonical = canonicalValuationFor(company, institutional);
    const priv = withCanonicalAsk(createListing(company, { visibility: "private_full" }), canonical.headline);
    const pub = withCanonicalAsk(createListing(company, { visibility: "public_anonymized" }), canonical.headline);
    // the same inputs every other memorandum uses: code name, story, assumed fields
    const memo: Partial<MemorandumInputs> = memorandumInputs(company, true, story);
    return { priv, pub, matches: matchBuyersToListing(createListing(company, { visibility: "private_full" }), company, { limit: 15 }), memo };
  }, [company, fromIntake, story]);
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
  // the asking price as typed ($M), validated before it is applied
  const [editAskText, setEditAskText] = useState<string>(String(Math.round(baseListing.askingPriceUsd.mid / 1e5) / 10));
  const askParse = parseNumber(editAskText, { min: 0.1, max: 1_000_000, scale: 1e6 });
  const navTo = useNavigate();
  const [editNote, setEditNote] = useState("");

  const teaserInputs = useMemo(() => ({ anonymize: true, ...own?.memo }), [own]);
  const teaser = useMemorandum("buyer_teaser", teaserInputs);
  const cim    = useMemorandum("cim", own?.memo);

  // Distinct outreach channels across the matched buyers.
  const channels = useMemo(() => Array.from(new Set(matches.map((m) => m.suggestedOutreach))), [matches]);

  const steps: PipelineStep[] = [
    { key: "teaser",  title: "Teaser created",      running: "Writing anonymized teaser…",
      detail: teaser ? `${teaser.title} · ${teaser.wordCount} words · anonymized` : "Drafting…" },
    // PRELAUNCH-REVIEW: one-click publish run restored
    { key: "cim",     title: "CIM drafted",         running: "Drafting confidential memorandum…",
      detail: cim ? `${cim.sections.length} sections · ${cim.wordCount.toLocaleString()} words` : "Drafting…" },
    { key: "anon",    title: "Data anonymized",     running: "Masking identity + sensitive figures…",
      detail: `Identity masked → published as "${PUB.title}"` },
    { key: "buyers",  title: "Buyers identified",   running: "Scanning the buyer universe…",
      detail: `${matches.length} matched buyers · top fit score ${matches[0] ? fit(matches[0].matchScore) : "—"}` },
    { key: "outreach", title: "Outreach started",   running: "Sequencing outreach…",
      detail: `${matches.length} buyers queued across ${channels.length} channel${channels.length === 1 ? "" : "s"}` },
  ];

  // Advance the pipeline one step at a time while running.
  useEffect(() => {
    if (phase !== "running") return;
    if (done >= steps.length) { setPhase("done"); return; }
    const t = setTimeout(() => setDone((d) => d + 1), 850);
    return () => clearTimeout(t);
  }, [phase, done, steps.length]);

  const publish = (): void => { setDone(0); setPhase("running"); };
  const reset   = (): void => { setPhase("idle"); setDone(0); };

  const progressPct = Math.round((done / steps.length) * 100);

  const BTN = "rounded-sm bg-desk-gold px-3 py-1.5 text-[12px] font-semibold text-desk-ink hover:bg-[#AA8443] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const BTN_GHOST = "rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="marketplace" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Exchange · Marketplace · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Exit Marketplace"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Become the banker · {phase === "done" ? "Live" : view === "founder" ? "Founder view" : "Public view"}</span></>}
        description={fromIntake ? "Listing, sell-side pack and matched buyers built from your saved intake." : "Built from the demo company. Save an intake to build them for your company."}
        actions={<>
          <a href="/report/cim" target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>Confidential Information Memorandum →</a>
          <a href="/report/management" target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>Management Presentation →</a>
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
            ? <>You're live — review the {matches.length} buyers entering outreach and approve the first conversations.</>
            : <>Publish the opportunity and let ExitOS run the sell-side process end to end.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmtMoney(listing.askingPriceUsd.mid)}</span> asking · band {fmtMoney(listing.askingPriceUsd.low)}–{fmtMoney(listing.askingPriceUsd.high)}.</TakeCell>
            <TakeCell k="If you wait">Without a live process, qualified buyers never learn you're sellable — and bankers charge 1–2% to run it.</TakeCell>
            <TakeCell k="Top match">{matches[0] ? <>{matches[0].buyerName} — fit score {fit(matches[0].matchScore)}, top of {matches.length}.</> : "No matches yet."}</TakeCell>
            <TakeCell k="What ExitOS does">One click writes the teaser and CIM, anonymizes the data, identifies buyers and starts outreach.</TakeCell>
          </dl>
          <div className="mt-3">{phase === "done"
            ? <button type="button" onClick={reset} className={BTN}>Re-run</button>
            : <button type="button" onClick={publish} className={BTN}>Publish Opportunity</button>}</div>
        </div>
      </Section>

      {/* ── Become the banker · Publish Opportunity ─────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="The operating system for company sales." eyebrow="Become the banker" className="lg:col-span-5">
          <div className="px-4 py-4">
            <p className="text-[13px] leading-relaxed text-xo-muted">
              A sell-side banker builds the teaser, writes the CIM, anonymizes your numbers, finds the buyers and runs
              the outreach — for 1–2% of the deal. ExitOS does all five, in one click, the moment you publish.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {phase === "idle" && <button type="button" onClick={publish} className={BTN}>Publish Opportunity</button>}
              {phase === "running" && <button type="button" disabled className={BTN}>Publishing… {progressPct}%</button>}
              {phase === "done" && (
                <>
                  <span className="inline-flex items-center gap-2 rounded-sm border border-xo-verified/50 px-3 py-1.5 text-[12px] font-semibold text-xo-verified">
                    ● Live · {matches.length} buyers in outreach
                  </span>
                  <button type="button" onClick={reset} className={BTN_GHOST}>Re-run</button>
                </>
              )}
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-xo-line pt-4 text-center">
              <Manifesto value="0" label="Bankers hired" />
              <Manifesto value="1-click" label="To full process" />
              <Manifesto value="100%" label="Founder-owned" />
            </dl>
          </div>
        </Section>

        <Section title="Automated sell-side pipeline" className="lg:col-span-7"
          right={<span className="font-mono text-[11px] text-xo-muted">{done}/{steps.length}</span>}>
          <div className="px-4 py-4">
            <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-xo-line">
              <div className="h-full rounded-full bg-xo-action motion-safe:transition-all motion-safe:duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <ol aria-live="polite" className="mt-4 space-y-3">
              {steps.map((s, i) => {
                const isDone   = i < done || phase === "done";
                const isActive = phase === "running" && i === done;
                return (
                  <li key={s.key} className="flex items-start gap-3">
                    <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                      isDone ? "border-xo-verified/60 text-xo-verified" : isActive ? "border-xo-caution/60 text-xo-caution" : "border-xo-line text-xo-muted"}`}>
                      {isDone ? "✓" : isActive ? <Spinner /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-semibold ${isDone || isActive ? "text-xo-text" : "text-xo-muted"}`}>{s.title}</div>
                      <div className="mt-0.5 text-[12px] leading-snug text-xo-muted">{isDone ? s.detail : isActive ? s.running : "Waiting"}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            {phase === "done" && (
              <div className="mt-4 border border-xo-verified/40 bg-xo-ink p-3">
                <h3 className="text-[12px] font-semibold text-xo-verified">Now live · the Shopify of company sales</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-xo-muted">
                  Your opportunity is published anonymized, the data room is indexed, and {matches.length} matched buyers
                  are entering sequenced outreach. Engagement signals flow straight into the negotiation engine.
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {matches.slice(0, 6).map((m) => (
                    <li key={m.buyerName} className={`rounded-sm border px-1.5 py-px text-[11px] font-medium ${OUTREACH_STYLE[m.suggestedOutreach]}`}>
                      {m.buyerName} · {inlineLabel(m.suggestedOutreach)}
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
              <Tag>{sectorLabel(listing.sector)}</Tag>
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
              {phase === "done"
                ? <button type="button" disabled className={BTN_GHOST}>● Published to marketplace</button>
                : <button type="button" onClick={publish} className={BTN}>Publish Opportunity</button>}
              <button type="button" onClick={() => { setEditAskText(String(Math.round(listing.askingPriceUsd.mid / 1e5) / 10)); setEditNote(override.note); setEditOpen(true); }} className={BTN_GHOST}>Edit listing</button>
              {view === "public" && <button type="button" onClick={() => navTo("/console/acquisition-radar")} className={BTN_GHOST}>Request NDA</button>}
            </div>
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
                  <div className={`mt-0.5 text-[11px] font-semibold ${TYPE_STYLE[m.buyerType] ?? "text-xo-muted"}`}>{label(m.buyerType)}</div>
                  <p className="mt-1.5 text-[12px] leading-snug text-xo-muted">{m.rationale}</p>
                  <span className={`mt-2 inline-block rounded-sm border px-1.5 py-px text-[11px] font-medium ${OUTREACH_STYLE[m.suggestedOutreach]}`}>{label(m.suggestedOutreach)}</span>
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
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit listing" subtitle="Founder-side adjustments to the published opportunity" size="md"
        footer={<><Button variant="ghost" onClick={() => { setOverride({ askMid: null, note: "" }); setEditOpen(false); notify("Listing reset to engine values"); }}>Reset</Button><Button disabled={!askParse.ok} onClick={() => { if (!askParse.ok) return; setOverride({ askMid: askParse.value, note: editNote.trim() }); setEditOpen(false); notify("Listing updated"); }}>Save</Button></>}>
        <div className="space-y-4">
          <p className="rounded-sm border border-xo-line bg-xo-ink p-3 text-[12px] text-xo-muted">
            Valuation band (canonical, as everywhere in the console): {fmtMoney(baseListing.askingPriceUsd.low)} – {fmtMoney(baseListing.askingPriceUsd.high)} · readiness {baseListing.readinessScore.toFixed(0)}/100 · {sectorLabel(baseListing.sector)}
          </p>
          <div>
            <label htmlFor="mkt-ask" className={XO_LABEL}>Asking price, mid ($M)</label>
            <input id="mkt-ask" inputMode="decimal" value={editAskText} onChange={(e) => setEditAskText(e.target.value)}
              aria-invalid={!askParse.ok} aria-describedby="mkt-ask-msg" className={XO_INPUT} />
            <span id="mkt-ask-msg" className={`mt-1 block text-[12px] ${askParse.ok ? "text-xo-muted" : "text-xo-risk"}`}>{askParse.ok ? "Overrides the engine mid; band low/high unchanged." : askParse.error}</span>
          </div>
          <Field label="Founder note" hint="Shown on your founder view only">
            <textarea className={`${inputCls} min-h-[80px] resize-y`} placeholder="e.g. hold publication until the audit closes" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

const Spinner: React.FC = () => (
  <span className="block h-3 w-3 rounded-full border-[1.5px] border-xo-caution/40 border-t-xo-caution motion-safe:animate-spin" />
);

const Manifesto: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col-reverse">
    <dt className="mt-0.5 text-[11px] text-xo-muted">{label}</dt>
    <dd className="font-mono text-lg font-semibold">{value}</dd>
  </div>
);

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
