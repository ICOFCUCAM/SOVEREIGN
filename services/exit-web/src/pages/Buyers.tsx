import React from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";
import { BUYERS } from "../lib/engines";

// Buyer Marketplace — registry view backed by the same engine output as
// Intelligence, but presented as cards (full thesis + appetite +
// geography) rather than a ranked table.

const TYPE_STYLE: Record<string, string> = {
  strategic:      "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  pe:             "bg-loi-500/15 text-loi-400 ring-loi-400/40",
  family_office:  "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40",
  sponsor:        "bg-white/5 text-white/65 ring-white/15",
};

const APPETITE_STYLE: Record<"active" | "warm" | "dormant", string> = {
  active:  "text-deal-400",
  warm:    "text-loi-400",
  dormant: "text-white/45",
};

const Buyers: React.FC = () => {
  const candidates = BUYERS.candidates;
  const activeBucket = candidates.filter((c) => c.buyer.appetite === "active");
  const medianCheck = candidates.length > 0
    ? candidates.slice().sort((a, b) => (a.buyer.checkSizeLowUsd + a.buyer.checkSizeHighUsd) / 2 - (b.buyer.checkSizeLowUsd + b.buyer.checkSizeHighUsd) / 2)[Math.floor(candidates.length / 2)]
    : null;
  const medianCheckUsd = medianCheck ? (medianCheck.buyer.checkSizeLowUsd + medianCheck.buyer.checkSizeHighUsd) / 2 : 0;

  return (
    <div>
      <SectionHeader
        kicker="Module 03 · Sourcing"
        title="Buyer Marketplace"
        description="Curated directory of strategic and financial buyers ranked against your company profile."
        actions={<><Button variant="ghost">Filter</Button><Button>Approach buyer</Button></>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active mandates"     value={String(activeBucket.length)} sub="recent-12mo activity" accent="#34d399" />
        <Kpi label="In our sector"       value={String(candidates.filter((c) => c.fitDimensions.sectorFit === 1).length)} sub="direct match" />
        <Kpi label="Median target check" value={fmtMoney(medianCheckUsd)} sub="across registry" />
        <Kpi label="Top match"           value={candidates[0] ? `${(candidates[0].probability * 100).toFixed(0)}%` : "—"} sub={candidates[0]?.buyer.name ?? ""} accent="#fbbf24" />
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
        {candidates.map((c) => (
          <Card key={c.buyer.name} className="!rounded-none border-0 bg-ink-800/95 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-lg font-bold text-white">{c.buyer.name}</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${TYPE_STYLE[c.buyer.buyerType]}`}>
                {c.buyer.buyerType.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/65">{c.buyer.thesis}</p>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-[11px]">
              <div>
                <dt className="text-white/40">Check size</dt>
                <dd className="mt-0.5 font-medium text-white/85">{fmtMoney(c.buyer.checkSizeLowUsd)} – {fmtMoney(c.buyer.checkSizeHighUsd)}</dd>
              </div>
              <div>
                <dt className="text-white/40">Appetite</dt>
                <dd className={`mt-0.5 font-semibold uppercase tracking-wide ${APPETITE_STYLE[c.buyer.appetite]}`}>{c.buyer.appetite}</dd>
              </div>
              <div>
                <dt className="text-white/40">Match</dt>
                <dd className="mt-0.5 font-mono font-medium text-deal-300">{c.probability.toFixed(2)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.buyer.sectorsActive.slice(0, 4).map((s) => (
                <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/45">{s.replace(/_/g, " ")}</span>
              ))}
              {c.buyer.geographyPreferred.length > 0 && (
                <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/45">{c.buyer.geographyPreferred.slice(0, 3).join(" · ")}{c.buyer.geographyPreferred.length > 3 ? " …" : ""}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Buyers;
