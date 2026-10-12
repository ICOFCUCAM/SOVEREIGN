import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Field, inputCls, fmtMoney, notify } from "../lib/ui";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric, Chip } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { LISTING_PUBLIC, LISTING_PRIVATE, LISTING_MATCHES, useMemorandum } from "../lib/engines";
import BankerTake from "../components/BankerTake";

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

const Marketplace: React.FC = () => {
  const [view, setView]   = useState<"public" | "founder">("founder");
  const [phase, setPhase] = useState<Phase>("idle");
  const [done, setDone]   = useState<number>(0);

  const baseListing = view === "founder" ? LISTING_PRIVATE : LISTING_PUBLIC;
  const matches  = LISTING_MATCHES.matches;

  // Founder edits — local overrides applied on top of the engine listing.
  const [editOpen, setEditOpen] = useState(false);
  const [override, setOverride] = useState<{ askMid: number | null; note: string }>({ askMid: null, note: "" });
  const listing = override.askMid != null
    ? { ...baseListing, askingPriceUsd: { ...baseListing.askingPriceUsd, mid: override.askMid } }
    : baseListing;
  const [editAsk, setEditAsk] = useState<number>(baseListing.askingPriceUsd.mid);
  const [editNote, setEditNote] = useState("");

  const teaserInputs = useMemo(() => ({ anonymize: true }), []);
  const teaser = useMemorandum("buyer_teaser", teaserInputs);
  const cim    = useMemorandum("cim");

  // Distinct outreach channels across the matched buyers.
  const channels = useMemo(() => Array.from(new Set(matches.map((m) => m.suggestedOutreach))), [matches]);

  const steps: PipelineStep[] = [
    { key: "teaser",  title: "Teaser created",      running: "Writing anonymized teaser…",
      detail: teaser ? `${teaser.title} · ${teaser.wordCount} words · anonymized` : "Drafting…" },
    { key: "cim",     title: "CIM drafted",         running: "Drafting confidential memorandum…",
      detail: cim ? `${cim.sections.length} sections · ${cim.wordCount.toLocaleString()} words` : "Drafting…" },
    { key: "anon",    title: "Data anonymized",     running: "Masking identity + sensitive figures…",
      detail: `Identity masked → published as "${LISTING_PUBLIC.title}"` },
    { key: "buyers",  title: "Buyers identified",   running: "Scanning the buyer universe…",
      detail: `${matches.length} matched buyers · top fit ${matches[0] ? (matches[0].matchScore * 100).toFixed(0) : "0"}%` },
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

  const BTN = "rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const BTN_GHOST = "rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="marketplace" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Exchange · Marketplace" title="Exit Marketplace"
        badge={<span className="text-[12px] text-xo-muted">Become the banker · {phase === "done" ? "Live" : view === "founder" ? "Founder view" : "Public view"}</span>}
        actions={<>
          <a href="/report/cim" target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>Confidential Information Memorandum (PDF) →</a>
          <a href="/report/management" target="_blank" rel="noopener noreferrer" className={BTN_GHOST}>Management Presentation (PDF) →</a>
        </>} />

      <section aria-label="Listing summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Asking price (mid)" emphasis value={fmtMoney(listing.askingPriceUsd.mid)} sub={`band ${fmtMoney(listing.askingPriceUsd.low)}–${fmtMoney(listing.askingPriceUsd.high)}`} /></div>
        <div className="bg-xo-panel"><Metric label="Readiness" value={`${listing.readinessScore.toFixed(0)}/100`} sub={listing.readinessBand.replace(/_/g, " ")} /></div>
        <div className="bg-xo-panel"><Metric label="Matched buyers" emphasis value={String(matches.length)} sub={LISTING_MATCHES.summary.split(".")[0]} /></div>
        <div className="bg-xo-panel"><Metric label="Visibility" value={listing.visibility.replace(/_/g, " ")} sub={view === "founder" ? "you" : "buyers see"} /></div>
      </section>

      <MarketTape items={tape} />

      <BankerTake
        next={phase === "done"
          ? <>You're live — review the {matches.length} buyers entering outreach and approve the first conversations.</>
          : <>Publish the opportunity and let ExitOS run the sell-side process end to end.</>}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(listing.askingPriceUsd.mid)}</span> asking · band {fmtMoney(listing.askingPriceUsd.low)}–{fmtMoney(listing.askingPriceUsd.high)}.</>}
        inaction={<>Without a live process, qualified buyers never learn you're sellable — and bankers charge 1–2% to run it.</>}
        buyer={matches[0]
          ? <><span className="text-white">{matches[0].buyerName}</span> — {(matches[0].matchScore * 100).toFixed(0)}% match, top of {matches.length}.</>
          : "No matches yet — publish to surface the buyer set."}
        automate={<>One click writes the teaser and CIM, anonymizes the data, identifies buyers and starts outreach.</>}
        impact={<>{fmtMoney(listing.askingPriceUsd.mid)}</>}
        cta={{ label: phase === "done" ? "Re-run" : "Publish Opportunity", onClick: phase === "done" ? reset : publish }}
      />

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
              <div><dt className="text-xo-muted">Buyer types</dt><dd className="mt-1 font-medium">{listing.idealBuyerProfile.preferredTypes.join(" · ")}</dd></div>
              <div><dt className="text-xo-muted">Check size</dt><dd className="mt-1 font-medium">{fmtMoney(listing.idealBuyerProfile.checkSizeUsd.low)} – {fmtMoney(listing.idealBuyerProfile.checkSizeUsd.high)}</dd></div>
              <div><dt className="text-xo-muted">Geography</dt><dd className="mt-1 font-medium">{listing.idealBuyerProfile.geography.join(" · ")}</dd></div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              {phase === "done"
                ? <button type="button" disabled className={BTN_GHOST}>● Published to marketplace</button>
                : <button type="button" onClick={publish} className={BTN}>Publish Opportunity</button>}
              <button type="button" onClick={() => { setEditAsk(listing.askingPriceUsd.mid); setEditNote(override.note); setEditOpen(true); }} className={BTN_GHOST}>Edit listing</button>
              {view === "public" && <button type="button" className={BTN_GHOST}>Request NDA</button>}
            </div>
            {override.note && view === "founder" && (
              <p className="mt-3 border border-xo-caution/40 bg-xo-ink px-3 py-2 text-[12px] text-xo-muted"><span className="font-semibold text-xo-caution">Founder note:</span> {override.note}</p>
            )}
          </div>
        </Section>

        <div className="flex flex-col gap-px bg-xo-line lg:col-span-4">
          <Section title="Matched buyers" eyebrow="matchBuyersToListing">
            <ul>
              {matches.slice(0, 8).map((m) => (
                <li key={m.buyerName} className="border-b border-xo-line px-4 py-3 last:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{m.buyerName}</span>
                    <span className="font-mono text-[12px] tabular-nums">{(m.matchScore * 100).toFixed(0)}%</span>
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
              <li className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-verified" /> Buyers request NDA → de-anonymized data shared</li>
              <li className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-verified" /> Engagement signals feed the negotiation engine</li>
              <li className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-verified" /> Success fee on closed deals · founder-paid</li>
            </ul>
          </Section>
        </div>
      </div>

      {/* ── Edit listing ────────────────────────────────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit listing" subtitle="Founder-side adjustments to the published opportunity" size="md"
        footer={<><Button variant="ghost" onClick={() => { setOverride({ askMid: null, note: "" }); setEditOpen(false); notify("Listing reset to engine values"); }}>Reset</Button><Button onClick={() => { setOverride({ askMid: editAsk, note: editNote.trim() }); setEditOpen(false); notify("Listing updated"); }}>Save</Button></>}>
        <div className="space-y-4">
          <p className="rounded-sm border border-xo-line bg-xo-ink p-3 text-[12px] text-xo-muted">
            Engine band: {fmtMoney(baseListing.askingPriceUsd.low)} – {fmtMoney(baseListing.askingPriceUsd.high)} · readiness {baseListing.readinessScore.toFixed(0)}/100 · {baseListing.sector.replace(/_/g, " ")}
          </p>
          <Field label="Asking price (mid)" hint="Overrides the engine mid; band low/high unchanged">
            <input type="number" step={1_000_000} min={baseListing.askingPriceUsd.low} value={editAsk} onChange={(e) => setEditAsk(Number(e.target.value))} className={inputCls} />
          </Field>
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

export default Marketplace;
