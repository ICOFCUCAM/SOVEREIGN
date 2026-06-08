import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";
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
  direct:         "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  banker_intro:   "bg-stage-loi/15 text-stage-loi ring-stage-loi/40",
  warm_referral:  "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  cold_intro:     "bg-white/5 text-white/60 ring-white/15",
};

const TYPE_STYLE: Record<string, string> = {
  strategic:      "text-deal-300",
  pe:             "text-loi-300",
  vc:             "text-stage-loi",
  family_office:  "text-stage-engaged",
  sponsor:        "text-white/65",
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

  const listing  = view === "founder" ? LISTING_PRIVATE : LISTING_PUBLIC;
  const matches  = LISTING_MATCHES.matches;

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

  return (
    <div>
      <SectionHeader
        kicker="Module 11 · Marketplace"
        title="Exit Marketplace"
        description="Most founders never hire a banker — because bankers are expensive. ExitOS is the banker. Publish once and the operating system runs the entire sell-side process for you."
      />

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
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Left — the pitch + CTA */}
          <div className="border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">Become the banker</div>
            <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-white">
              The operating system for company sales.
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/65">
              A sell-side banker builds the teaser, writes the CIM, anonymizes your numbers, finds the buyers and runs
              the outreach — for 1–2% of the deal. ExitOS does all five, in one click, the moment you publish.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {phase === "idle" && <Button onClick={publish}>Publish Opportunity</Button>}
              {phase === "running" && <Button disabled>Publishing… {progressPct}%</Button>}
              {phase === "done" && (
                <>
                  <span className="inline-flex items-center gap-2 rounded-md bg-deal-600/20 px-3 py-2 text-[12px] font-semibold text-deal-200 ring-1 ring-deal-500/40">
                    ● Live · {matches.length} buyers in outreach
                  </span>
                  <Button variant="ghost" onClick={reset}>Re-run</Button>
                </>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
              <Manifesto value="0" label="Bankers hired" />
              <Manifesto value="1-click" label="To full process" />
              <Manifesto value="100%" label="Founder-owned" />
            </div>
          </div>

          {/* Right — the pipeline */}
          <div className="bg-ink-900/40 p-7">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Automated sell-side pipeline</div>
              <div className="font-mono text-[11px] text-white/45">{done}/{steps.length}</div>
            </div>

            {/* progress rail */}
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-deal-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>

            <ol className="mt-5 space-y-3">
              {steps.map((s, i) => {
                const isDone   = i < done || phase === "done";
                const isActive = phase === "running" && i === done;
                return (
                  <li key={s.key} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${
                      isDone   ? "bg-deal-600/30 text-deal-200 ring-deal-500/50"
                      : isActive ? "bg-loi-500/20 text-loi-200 ring-loi-400/50"
                      : "bg-white/5 text-white/35 ring-white/15"}`}>
                      {isDone ? "✓" : isActive ? <Spinner /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[13px] font-semibold ${isDone ? "text-white" : isActive ? "text-white" : "text-white/45"}`}>
                        {s.title}
                      </div>
                      <div className={`mt-0.5 text-[11.5px] leading-snug ${isDone ? "text-white/55" : "text-white/35"}`}>
                        {isDone ? s.detail : isActive ? s.running : "Waiting"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {phase === "done" && (
              <div className="mt-5 rounded-lg border border-deal-500/30 bg-deal-600/10 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">Now live · the Shopify of company sales</div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">
                  Your opportunity is published anonymized, the data room is indexed, and {matches.length} matched buyers
                  are entering sequenced outreach. Engagement signals flow straight into the negotiation engine.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {matches.slice(0, 6).map((m) => (
                    <span key={m.buyerName} className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${OUTREACH_STYLE[m.suggestedOutreach]}`}>
                      {m.buyerName} · {m.suggestedOutreach.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-white">Your listing</h2>
        <div className="inline-flex rounded-md border border-white/15 bg-ink-800/40 p-1">
          <button
            onClick={() => setView("founder")}
            className={`rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${view === "founder" ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}
          >
            Founder view
          </button>
          <button
            onClick={() => setView("public")}
            className={`rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${view === "public" ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}
          >
            Public listing
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Asking price (mid)"   value={fmtMoney(listing.askingPriceUsd.mid)} sub={`band ${fmtMoney(listing.askingPriceUsd.low)} – ${fmtMoney(listing.askingPriceUsd.high)}`} accent="#34d399" />
        <Kpi label="Readiness"             value={`${listing.readinessScore.toFixed(0)}/100`} sub={listing.readinessBand.replace(/_/g, " ")} />
        <Kpi label="Matched buyers"        value={String(matches.length)} sub={LISTING_MATCHES.summary.split(".")[0]} />
        <Kpi label="Visibility"            value={listing.visibility.replace(/_/g, " ")} sub={view === "founder" ? "you" : "buyers see"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-400">Listing</div>
          <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-white">{listing.title}</h2>
          {listing.fullName && view === "founder" && (
            <div className="mt-1 text-[12px] text-white/55">Identity (founder view): <span className="text-white/85">{listing.fullName}</span> · {listing.jurisdiction}</div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
            <Tag>{listing.businessModel}</Tag>
            <Tag>{listing.sector.replace(/_/g, " ")}</Tag>
            <Tag>founded {listing.foundedYear}</Tag>
            <Tag>{listing.jurisdiction}</Tag>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] sm:grid-cols-3">
            {listing.headline.arrUsd != null && <DataRow label="ARR"           value={fmtMoney(listing.headline.arrUsd)} />}
            {listing.headline.ttmRevenueUsd != null && <DataRow label="TTM revenue" value={fmtMoney(listing.headline.ttmRevenueUsd)} />}
            <DataRow label="Gross margin"  value={`${(listing.headline.grossMarginPct * 100).toFixed(0)}%`} />
            <DataRow label="ARR growth YoY" value={`${(listing.headline.arrGrowthYoyPct * 100).toFixed(0)}%`} />
            <DataRow label="EBITDA margin" value={`${(listing.headline.ebitdaMarginPct * 100).toFixed(0)}%`} />
            <DataRow label="Asking range"  value={`${fmtMoney(listing.askingPriceUsd.low)} – ${fmtMoney(listing.askingPriceUsd.high)}`} />
          </div>

          <h3 className="mt-7 font-serif text-base font-bold text-white">Highlights</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] text-white/75">
            {listing.highlights.map((h) => (
              <li key={h} className="flex items-baseline gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-deal-400" /> {h}
              </li>
            ))}
          </ul>

          <h3 className="mt-7 font-serif text-base font-bold text-white">Ideal buyer profile</h3>
          <div className="mt-2 grid grid-cols-3 gap-3 text-[12px]">
            <div>
              <dt className="text-white/40">Buyer types</dt>
              <dd className="mt-1 font-medium text-white/85">{listing.idealBuyerProfile.preferredTypes.join(" · ")}</dd>
            </div>
            <div>
              <dt className="text-white/40">Check size</dt>
              <dd className="mt-1 font-medium text-white/85">{fmtMoney(listing.idealBuyerProfile.checkSizeUsd.low)} – {fmtMoney(listing.idealBuyerProfile.checkSizeUsd.high)}</dd>
            </div>
            <div>
              <dt className="text-white/40">Geography</dt>
              <dd className="mt-1 font-medium text-white/85">{listing.idealBuyerProfile.geography.join(" · ")}</dd>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {phase === "done"
              ? <Button variant="ghost" disabled>● Published to marketplace</Button>
              : <Button onClick={publish}>Publish Opportunity</Button>}
            <Button variant="ghost">Edit listing</Button>
            {view === "public" && <Button variant="ghost">Request NDA</Button>}
          </div>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="font-serif text-base font-bold text-white">Matched buyers</h3>
            <p className="mt-1 text-[11px] text-white/45">Surfaced by @exit/engines · matchBuyersToListing</p>
            <div className="mt-4 space-y-3">
              {matches.slice(0, 8).map((m) => (
                <div key={m.buyerName} className="rounded border border-white/10 bg-ink-900/40 p-3">
                  <div className="flex items-baseline justify-between">
                    <div className="font-medium text-white">{m.buyerName}</div>
                    <span className="font-mono text-[12px] text-deal-300">{(m.matchScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${TYPE_STYLE[m.buyerType] ?? "text-white/55"}`}>{m.buyerType.replace(/_/g, " ")}</div>
                  <p className="mt-2 text-[11px] leading-snug text-white/55">{m.rationale}</p>
                  <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${OUTREACH_STYLE[m.suggestedOutreach]}`}>
                    {m.suggestedOutreach.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-serif text-base font-bold text-white">Marketplace mechanics</h3>
            <ul className="mt-3 space-y-2 text-[12px] text-white/65">
              <li className="flex items-baseline gap-2"><span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" /> Listings publish anonymized by default</li>
              <li className="flex items-baseline gap-2"><span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" /> Buyers request NDA → de-anonymized data shared</li>
              <li className="flex items-baseline gap-2"><span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" /> Engagement signals feed the negotiation engine</li>
              <li className="flex items-baseline gap-2"><span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" /> Success fee on closed deals · founder-paid</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
};

const Spinner: React.FC = () => (
  <span className="block h-3 w-3 animate-spin rounded-full border-[1.5px] border-loi-300/40 border-t-loi-200" />
);

const Manifesto: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <div className="font-mono text-lg font-bold text-white">{value}</div>
    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">{label}</div>
  </div>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded-full border border-white/10 bg-ink-900/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-white/65">{children}</span>
);

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</dt>
    <dd className="mt-1 font-mono text-sm font-semibold text-white">{value}</dd>
  </div>
);

export default Marketplace;
