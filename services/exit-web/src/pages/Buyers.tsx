import React, { useState } from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney, copyText, preview } from "../lib/ui";
import { BUYERS } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import type { BuyerCandidate } from "@exit/engines";
import BankerTake from "../components/BankerTake";

// Buyer Marketplace — buyer profile cards (not a directory). Each card surfaces
// the signals a founder actually decides on: interest level, appetite, average
// deal size, time-to-close, last acquisition and founder-friendliness. The
// primary action generates a warm introduction composed from the buyer thesis,
// the company profile and the engine's fit reasoning.

const TYPE_STYLE: Record<string, string> = {
  strategic:      "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  pe:             "bg-loi-500/15 text-loi-400 ring-loi-400/40",
  family_office:  "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40",
  sponsor:        "bg-white/5 text-white/65 ring-white/15",
};

// interest level from probability; founder-friendliness from buyer type +
// retrade history (PE that retrades hard reads less founder-friendly).
function interest(c: BuyerCandidate): { label: string; pct: number; color: string } {
  const p = c.probability;
  if (p >= 0.6) return { label: "Hot", pct: Math.round(p * 100), color: "#34d399" };
  if (p >= 0.35) return { label: "Warm", pct: Math.round(p * 100), color: "#fbbf24" };
  return { label: "Cool", pct: Math.round(p * 100), color: "#94a3b8" };
}
function friendliness(c: BuyerCandidate): { label: string; score: number } {
  let s = c.buyer.buyerType === "strategic" ? 78 : c.buyer.buyerType === "family_office" ? 88 : 64;
  const rt = c.outcomes.avgRetradePct;
  if (rt != null) s += rt < -0.03 ? -18 : rt >= 0 ? 8 : -6;
  s = Math.max(20, Math.min(96, s));
  return { label: s >= 80 ? "High" : s >= 60 ? "Moderate" : "Low", score: s };
}
function warmIntro(c: BuyerCandidate): string {
  const co = SAMPLE_COMPANY;
  const sector = co.sector.replace(/_/g, " ");
  const arrM = (co.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(0);
  return (
    `Subject: Introduction — ${co.name} (${sector})\n\n` +
    `Hi ${c.buyer.name} team,\n\n` +
    `I'm reaching out because ${co.name} aligns closely with your acquisition thesis: ${c.buyer.thesis} ` +
    `We're a ${sector} business at $${arrM}M ARR growing ${(co.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY, ` +
    `and your recent activity in the space — plus a check range of ${fmtMoney(c.buyer.checkSizeLowUsd)}–${fmtMoney(c.buyer.checkSizeHighUsd)} — ` +
    `makes a conversation worth both our time.\n\n` +
    `Happy to share an anonymized teaser under NDA. Would the coming week work for a short call?\n\nBest,\nJames`
  );
}

const Buyers: React.FC = () => {
  const candidates = BUYERS.candidates;
  const activeBucket = candidates.filter((c) => c.buyer.appetite === "active");
  const sortedByCheck = candidates.slice().sort((a, b) =>
    (a.buyer.checkSizeLowUsd + a.buyer.checkSizeHighUsd) / 2 - (b.buyer.checkSizeLowUsd + b.buyer.checkSizeHighUsd) / 2);
  const medianCheck = sortedByCheck[Math.floor(candidates.length / 2)];
  const medianCheckUsd = medianCheck ? (medianCheck.buyer.checkSizeLowUsd + medianCheck.buyer.checkSizeHighUsd) / 2 : 0;

  const [intro, setIntro] = useState<{ name: string; text: string } | null>(null);

  return (
    <div>
      <SectionHeader
        kicker="Module 03 · Sourcing"
        title="Buyer Marketplace"
        description="Buyer profiles ranked against your company — interest, appetite, deal size, speed and founder-friendliness at a glance. Generate a warm introduction in one click."
        actions={<Button variant="ghost" onClick={preview}>Filter</Button>}
      />

      {candidates[0] && (() => {
        const top = candidates[0];
        const it = interest(top);
        const topCheck = (top.buyer.checkSizeLowUsd + top.buyer.checkSizeHighUsd) / 2;
        return (
          <BankerTake
            next={<>Fire a warm intro to the hottest buyer and open the conversation this week.</>}
            stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(topCheck)}</span> typical check from {top.buyer.name}; {activeBucket.length} active mandate{activeBucket.length === 1 ? "" : "s"} in play.</>}
            inaction={<>Hot interest cools — buyers redeploy and the warm window closes without a touch.</>}
            buyer={<><span className="text-white">{top.buyer.name}</span> — {it.label.toLowerCase()} interest at {it.pct}%, {top.buyer.buyerType.replace(/_/g, " ")}.</>}
            automate={<>ExitOS drafts a personalized warm introduction for each buyer and routes it through the banker.</>}
            impact={<>{fmtMoney(topCheck)}</>}
            cta={{ label: "Send via The Banker", to: "/console/banker" }}
          />
        );
      })()}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active mandates"     value={String(activeBucket.length)} sub="recent-12mo activity" accent="#34d399" />
        <Kpi label="In our sector"       value={String(candidates.filter((c) => c.fitDimensions.sectorFit === 1).length)} sub="direct match" />
        <Kpi label="Median target check" value={fmtMoney(medianCheckUsd)} sub="across registry" />
        <Kpi label="Top match"           value={candidates[0] ? `${(candidates[0].probability * 100).toFixed(0)}%` : "—"} sub={candidates[0]?.buyer.name ?? ""} accent="#fbbf24" />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {candidates.map((c) => {
          const it = interest(c);
          const ff = friendliness(c);
          const avgCheck = (c.buyer.checkSizeLowUsd + c.buyer.checkSizeHighUsd) / 2;
          const lastDeal = c.signals.find((s) => /last deal|acquired|20\d\d/i.test(s.text))?.text;
          return (
            <Card key={c.buyer.name} className="p-6 transition hover:border-deal-400/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">{c.buyer.name}</h3>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${TYPE_STYLE[c.buyer.buyerType]}`}>
                    {c.buyer.buyerType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: it.color, background: `${it.color}1f` }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: it.color }} /> {it.label} interest · {it.pct}%
                </div>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-white/60">{c.buyer.thesis}</p>

              {/* 6-metric stack */}
              <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 border-t border-white/10 pt-4 text-[11px]">
                <Metric label="Appetite" value={c.buyer.appetite} accent={c.buyer.appetite === "active" ? "#34d399" : c.buyer.appetite === "warm" ? "#fbbf24" : undefined} />
                <Metric label="Avg deal size" value={fmtMoney(avgCheck)} />
                <Metric label="Time-to-close" value={c.outcomes.medianCloseDays != null ? `~${c.outcomes.medianCloseDays}d` : "—"} />
                <Metric label="Last acquisition" value={lastDeal ? lastDeal.replace(/^last deal:?\s*/i, "") : "—"} small />
                <Metric label="Founder-friendly" value={ff.label} accent={ff.score >= 80 ? "#34d399" : undefined} />
                <Metric label="Match" value={c.probability.toFixed(2)} accent="#6ee7b7" />
              </dl>

              {/* founder-friendliness meter */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-white/40"><span>Founder friendliness</span><span>{ff.score}/100</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-deal-700 to-deal-400" style={{ width: `${ff.score}%` }} />
                </div>
              </div>

              <div className="mt-4">
                <Button className="w-full" onClick={() => setIntro({ name: c.buyer.name, text: warmIntro(c) })}>
                  ✦ AI Generate Warm Introduction
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* warm-intro drawer */}
      {intro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIntro(null)}>
          <div className="max-w-xl rounded-lg border border-white/10 bg-ink-800/95 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">AI warm introduction · {intro.name}</div>
              <button onClick={() => setIntro(null)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-md border border-white/10 bg-ink-900/70 p-4 text-[13px] leading-relaxed text-white/80">{intro.text}</pre>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => copyText(intro.text)}>Copy</Button>
              <Button>Send via Banker AI →</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; accent?: string; small?: boolean }> = ({ label, value, accent, small }) => (
  <div>
    <dt className="text-white/40">{label}</dt>
    <dd className={`mt-0.5 font-semibold ${small ? "text-[10px] leading-tight" : ""} ${accent ? "" : "text-white/85"} ${label === "Appetite" || label === "Founder-friendly" ? "uppercase tracking-wide" : ""}`} style={accent ? { color: accent } : undefined}>{value}</dd>
  </div>
);

export default Buyers;
