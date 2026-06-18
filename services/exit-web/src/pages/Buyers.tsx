import React, { useMemo, useState } from "react";
import { Button, Modal, Field, inputCls, fmtMoney, copyText } from "../lib/ui";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
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
  const all = BUYERS.candidates;
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<{ type: string; appetite: string; interest: string }>({ type: "all", appetite: "all", interest: "all" });
  const candidates = useMemo(() => all.filter((c) => {
    if (filter.type !== "all" && c.buyer.buyerType !== filter.type) return false;
    if (filter.appetite !== "all" && c.buyer.appetite !== filter.appetite) return false;
    if (filter.interest === "hot" && c.probability < 0.6) return false;
    if (filter.interest === "warm" && (c.probability < 0.35 || c.probability >= 0.6)) return false;
    return true;
  }), [all, filter]);
  const activeFilters = [filter.type, filter.appetite, filter.interest].filter((f) => f !== "all").length;
  const activeBucket = candidates.filter((c) => c.buyer.appetite === "active");
  const sortedByCheck = candidates.slice().sort((a, b) =>
    (a.buyer.checkSizeLowUsd + a.buyer.checkSizeHighUsd) / 2 - (b.buyer.checkSizeLowUsd + b.buyer.checkSizeHighUsd) / 2);
  const medianCheck = sortedByCheck[Math.floor(candidates.length / 2)];
  const medianCheckUsd = medianCheck ? (medianCheck.buyer.checkSizeLowUsd + medianCheck.buyer.checkSizeHighUsd) / 2 : 0;

  const [intro, setIntro] = useState<{ name: string; text: string } | null>(null);

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Sourcing"
        title="Buyer Marketplace"
        tag="Profiles ranked"
        metrics={[
          { k: "Active mandates", v: String(activeBucket.length), accent: true, sub: "recent-12mo activity" },
          { k: "In our sector", v: String(candidates.filter((c) => c.fitDimensions.sectorFit === 1).length), sub: "direct match" },
          { k: "Median target check", v: fmtMoney(medianCheckUsd), sub: "across registry" },
          { k: "Top match", v: candidates[0] ? `${(candidates[0].probability * 100).toFixed(0)}%` : "—", accent: true, sub: candidates[0]?.buyer.name },
        ]}
      />


      {/* ── Filter ────────────────────────────────────────────────── */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter buyers" subtitle={`${candidates.length} of ${all.length} match`} size="md"
        footer={<><Button variant="ghost" onClick={() => setFilter({ type: "all", appetite: "all", interest: "all" })}>Clear</Button><Button onClick={() => setFilterOpen(false)}>Done</Button></>}>
        <div className="space-y-4">
          <Field label="Buyer type">
            <select className={inputCls} value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}>
              <option value="all">All types</option>
              <option value="strategic">Strategic</option>
              <option value="pe">Private equity</option>
              <option value="family_office">Family office</option>
              <option value="sponsor">Sponsor</option>
            </select>
          </Field>
          <Field label="Appetite">
            <select className={inputCls} value={filter.appetite} onChange={(e) => setFilter((f) => ({ ...f, appetite: e.target.value }))}>
              <option value="all">Any appetite</option>
              <option value="active">Active</option>
              <option value="warm">Warm</option>
              <option value="dormant">Dormant</option>
            </select>
          </Field>
          <Field label="Interest level">
            <select className={inputCls} value={filter.interest} onChange={(e) => setFilter((f) => ({ ...f, interest: e.target.value }))}>
              <option value="all">Any interest</option>
              <option value="hot">Hot (≥60%)</option>
              <option value="warm">Warm (35–59%)</option>
            </select>
          </Field>
        </div>
      </Modal>

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

      <Frame>
        <Panel title="Buyer profiles · ranked against your company" className="lg:col-span-12"
          right={<button onClick={() => setFilterOpen(true)} className="rounded bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55 ring-1 ring-white/10 hover:text-white">Filter{activeFilters > 0 ? ` · ${activeFilters}` : ""}</button>}>
          {candidates.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-white/50">No buyers match these filters. <button className="font-semibold text-deal-300 hover:text-deal-200" onClick={() => setFilter({ type: "all", appetite: "all", interest: "all" })}>Clear filters</button></div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-white/10 lg:grid-cols-2">
              {candidates.map((c) => {
                const it = interest(c);
                const ff = friendliness(c);
                const avgCheck = (c.buyer.checkSizeLowUsd + c.buyer.checkSizeHighUsd) / 2;
                const lastDeal = c.signals.find((s) => /last deal|acquired|20\d\d/i.test(s.text))?.text;
                return (
                  <div key={c.buyer.name} className="bg-ink-900 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-mono text-[15px] font-bold text-white">{c.buyer.name}</h3>
                        <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${TYPE_STYLE[c.buyer.buyerType]}`}>{c.buyer.buyerType.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: it.color, background: `${it.color}1f` }}>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: it.color }} /> {it.label} · {it.pct}%
                      </div>
                    </div>
                    <p className="mt-2 text-[11.5px] leading-snug text-white/55">{c.buyer.thesis}</p>
                    <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 border-t border-white/10 pt-2 text-[10.5px]">
                      <Metric label="Appetite" value={c.buyer.appetite} accent={c.buyer.appetite === "active" ? "#34d399" : c.buyer.appetite === "warm" ? "#fbbf24" : undefined} />
                      <Metric label="Avg deal" value={fmtMoney(avgCheck)} />
                      <Metric label="To close" value={c.outcomes.medianCloseDays != null ? `~${c.outcomes.medianCloseDays}d` : "—"} />
                      <Metric label="Last acq." value={lastDeal ? lastDeal.replace(/^last deal:?\s*/i, "") : "—"} small />
                      <Metric label="Founder-friendly" value={ff.label} accent={ff.score >= 80 ? "#34d399" : undefined} />
                      <Metric label="Match" value={c.probability.toFixed(2)} accent="#6ee7b7" />
                    </dl>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-deal-700 to-deal-400" style={{ width: `${ff.score}%` }} /></div>
                      <button onClick={() => setIntro({ name: c.buyer.name, text: warmIntro(c) })} className="shrink-0 rounded bg-deal-600/80 px-2 py-1 text-[10px] font-semibold text-white ring-1 ring-deal-400/40 hover:bg-deal-500">✦ Warm intro</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </Frame>

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
