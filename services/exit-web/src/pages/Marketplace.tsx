import React, { useState } from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";
import { LISTING_PUBLIC, LISTING_PRIVATE, LISTING_MATCHES } from "../lib/engines";

// Exit Marketplace — two views over the same engine output:
//   (a) "Public" — the anonymized listing as buyers see it
//   (b) "Founder" — the de-anonymized listing + matched buyers
// Backs the listing engine (createListing + matchBuyersToListing).

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

const Marketplace: React.FC = () => {
  const [view, setView] = useState<"public" | "founder">("founder");
  const listing = view === "founder" ? LISTING_PRIVATE : LISTING_PUBLIC;
  const matches = LISTING_MATCHES.matches;

  return (
    <div>
      <SectionHeader
        kicker="Module 11 · Marketplace"
        title="Exit Marketplace"
        description="The two-sided marketplace where founders list businesses for sale and buyers browse anonymized opportunities ranked by the listing engine."
        actions={
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
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Asking price (mid)"   value={fmtMoney(listing.askingPriceUsd.mid)} sub={`band ${fmtMoney(listing.askingPriceUsd.low)} – ${fmtMoney(listing.askingPriceUsd.high)}`} accent="#34d399" />
        <Kpi label="Readiness"             value={`${listing.readinessScore.toFixed(0)}/100`} sub={listing.readinessBand.replace(/_/g, " ")} />
        <Kpi label="Matched buyers"        value={String(matches.length)} sub={LISTING_MATCHES.summary.split(".")[0]} />
        <Kpi label="Visibility"            value={listing.visibility.replace(/_/g, " ")} sub={view === "founder" ? "you" : "buyers see"} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
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
            <Button>Publish to marketplace</Button>
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
