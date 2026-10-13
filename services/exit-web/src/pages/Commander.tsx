import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, BuyerNetworkReactor, ReactorTelemetry } from "../components/Reactor";
import { MARKET_INTEL } from "../lib/market-intel";
import { Button, fmtMoney } from "../lib/ui";
import { commanderMetrics, exitProbabilityParts } from "../lib/commander-metrics";
import { dealContextFor } from "../lib/deal-context";
import { DEAL_INTEL_FMT } from "../lib/market-stats";
import { runBuyerDiscovery, runReadiness, runReadinessAnalysis } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { PageHeader, Section, Metric, Bar, ActionLink, Fact, Provenance } from "../components/xo";

// ── CHIEF INVESTMENT BANKER ─────────────────────────────────────────
// Page 05 of the ExitOS institutional redesign (docs/redesign/PAGE-05-
// CHIEF-INVESTMENT-BANKER.md). The paid founder's command surface, read as
// a decision: position (value, odds, buyers, time) → the banker's brief and
// Execute → why the odds are what they are → who is circling → the market.
// The Liquidity Board, Morning Briefing and banker blocks that only this
// page used are folded in here on the xo design system.

type BuyerType = keyof ReturnType<typeof runBuyerDiscovery>["byType"];
const TYPE_AXES: { key: BuyerType; label: string }[] = [
  { key: "strategic", label: "Strategic" },
  { key: "pe", label: "Private Equity" },
  { key: "vc", label: "Venture" },
  { key: "family_office", label: "Family Office" },
  { key: "sponsor", label: "Sponsor" },
];
const AS_OF = DNA_AS_OF.slice(0, 10);   // registry snapshot date
const AUTOMATION = ["Build buyer shortlist", "Generate teaser", "Prepare NDA", "Open diligence room", "Launch outreach", "Track responses"];

/** Acquirer mix by type, drawn to scale on a radar; counts printed at each vertex. */
const AcquirerMixRadar: React.FC<{ data: { label: string; n: number }[] }> = ({ data }) => {
  const cx = 150, cy = 132, R = 84;
  const peak = Math.max(...data.map((d) => d.n));
  const max = Math.max(4, Math.ceil(peak / 4) * 4);
  const ang = (i: number): number => (-90 + i * (360 / data.length)) * (Math.PI / 180);
  const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = data.map((d, i) => pt(i, (d.n / max) * R).join(",")).join(" ");
  const ring = (f: number): string => data.map((_, i) => pt(i, R * f).join(",")).join(" ");
  // the view box reaches 36 units past each side so the longest label ("Private Equity 0") is not cut off
  return (
    <svg viewBox="-36 0 372 256" className="w-full" role="img" aria-label={`Acquirer mix by type: ${data.map((d) => `${d.label} ${d.n}`).join(", ")}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="#22314b" strokeWidth="1" />)}
      <text x={cx} y={cy - R - 4} textAnchor="middle" fill="#8796ad" style={{ fontSize: 8, fontFamily: "ui-monospace, monospace" }}>{max}</text>
      {data.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#22314b" strokeWidth="1" />; })}
      <polygon points={poly} fill="#34d399" fillOpacity="0.2" stroke="#34d399" strokeWidth="1.75" strokeLinejoin="round" />
      {data.map((d, i) => { const [x, y] = pt(i, (d.n / max) * R); return <circle key={i} cx={x} cy={y} r="3" fill="#34d399" stroke="#0b1220" strokeWidth="1.5" />; })}
      {data.map((d, i) => {
        const [lx, ly] = pt(i, R + 16);
        const c = Math.cos(ang(i));
        const anchor = Math.abs(c) < 0.3 ? "middle" : c > 0 ? "start" : "end";
        return (
          <text key={d.label} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle">
            <tspan fill="#a3b1c6" style={{ fontSize: 9.5, fontWeight: 600 }}>{d.label}</tspan>
            <tspan fill="#e8edf5" dx="5" style={{ fontSize: 10, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{d.n}</tspan>
          </text>
        );
      })}
    </svg>
  );
};

const Commander: React.FC = () => {
  const navigate = useNavigate();
  // The founder's company when they have saved figures, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const E = useMemo(() => {
    const analysis = runReadinessAnalysis(company, runReadiness(company));
    return { ctx: dealContextFor(company), analysis, buyers: runBuyerDiscovery(company, { limit: 12 }) };
  }, [company]);
  const m = commanderMetrics(E.ctx, E.analysis);
  const DEAL_BUYERS = E.ctx.dealBuyers, ACTIVE_BUYERS = E.ctx.activeBuyers, DEMAND_LABEL = E.ctx.demandLabel;
  const CURRENT_VALUE_USD = E.ctx.currentValueUsd, POTENTIAL_VALUE_USD = E.ctx.potentialValueUsd, VALUE_LEFT_USD = E.ctx.valueLeftUsd;
  const BUYERS = E.buyers;
  const tape = useMemo(() => buildMarketTape(), []);

  // carried over from CommanderBlocks (see the gap register for what follows)
  const moves = DEAL_BUYERS.slice(0, 4).map((c) => ({
    name: c.buyer.name,
    action: c.buyer.appetite === "active" ? "Actively deploying" : c.buyer.appetite === "warm" ? "Monitoring the sector" : "Dormant mandate",
    when: `${Math.round(c.probability * 100)}% probability`,
  }));
  const temp = Math.min(98, 70 + ACTIVE_BUYERS * 4);
  const tempLabel = temp >= 80 ? "HOT" : temp >= 60 ? "WARM" : "COOL";
  // the index's real inputs, part by part (no invented factors)
  const pp = exitProbabilityParts(E.ctx);
  const factors = [
    { label: `Exit Score ${pp.exitScore}/100 × 0.35`, v: pp.readiness, max: 35 },
    { label: `Active buyers ${pp.activeBuyers} of 6 (capped) × 0.40`, v: pp.demand, max: 40 },
    { label: `Negotiation leverage "${pp.leverageLabel}" × 0.25 (sample offers)`, v: pp.leverage, max: 25 },
  ];
  const radar = TYPE_AXES.map((a) => ({ label: a.label, n: BUYERS.byType[a.key] ?? 0 }));
  const radarTotal = radar.reduce((s, d) => s + d.n, 0);
  const top = DEAL_BUYERS[0];
  const notes = [
    { t: "Pool", text: `${ACTIVE_BUYERS} of ${DEAL_BUYERS.length} matched mandates are actively deploying against your profile.` },
    ...(top ? [{ t: "Lead", text: `${top.buyer.name} ranks first — ${Math.round(top.probability * 100)}% probability, est. check ${fmtMoney(top.estimatedCheck.low)}–${fmtMoney(top.estimatedCheck.high)}.` }] : []),
    { t: "Value", text: `Readiness fixes add ${fmtMoney(VALUE_LEFT_USD)} to the enterprise value.` },
    { t: "Market", text: `Median disclosed premium across tracked deals: ${DEAL_INTEL_FMT.medianPremium}; median announce-to-close ${DEAL_INTEL_FMT.medianClose}.` },
  ];
  const layers = [
    { roman: "II", label: "Investment Banker", to: "/console", v: fmtMoney(m.companyValue), sub: "enterprise value" },
    { roman: "III", label: "Market", to: "/console/market-map", v: MARKET_INTEL.totalEvents.toLocaleString(), sub: "indexed acquisitions" },
    { roman: "IV", label: "Transaction", to: "/console/pipeline", v: `${m.timeToExitMonths}mo`, sub: "to exit" },
    { roman: "V", label: "Buyer", to: "/console/buyers", v: String(m.activeBuyers), sub: "active acquirers" },
  ];

  return (
    <div data-page="chief-investment-banker" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Chief Investment Banker · Transaction desk" title={company.name}
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">demand {m.demandLabel} · horizon {m.timeToExitMonths}mo · confidence index {m.confidencePct}%</span></>}
        actions={<>
          <a href="/report/board" target="_blank" rel="noopener noreferrer" className="rounded-sm border border-xo-action/50 px-3 py-1.5 text-[12px] font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Board Memorandum (PDF) →<span className="sr-only"> (opens in a new tab)</span></a>
          <a href="/report" target="_blank" rel="noopener noreferrer" className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Publishing Center →<span className="sr-only"> (opens in a new tab)</span></a>
        </>} />

      {/* ── position (Founder Liquidity Board) ─────────────────────── */}
      <Section title="Founder Liquidity Board" eyebrow="Position" className="border border-xo-line">
        <div className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-5">
          <div className="bg-xo-panel"><Metric label="Enterprise Value" emphasis value={fmtMoney(m.companyValue)} sub="institutional framework mid" /></div>
          <div className="bg-xo-panel"><Metric label="Expected Value" emphasis value={<span className="text-xo-verified">{fmtMoney(m.potential)}</span>} sub="after the priced readiness fixes" /></div>
          <div className="bg-xo-panel"><Metric label="Active Buyers" value={String(m.activeBuyers)} sub={`demand ${m.demandLabel.toLowerCase()} · mandates matching`} /></div>
          <div className="bg-xo-panel"><Metric label="Close-probability index" value={`${m.exitProbability}%`} sub="heuristic — breakdown below" /></div>
          <div className="bg-xo-panel"><Metric label="Time to Liquidity" value={<>{m.timeToExitMonths}<span className="text-[13px] text-xo-faint"> mo</span></>} sub="once a buyer is engaged" /></div>
        </div>
      </Section>

      {/* ── the banker's brief + Execute (Morning Briefing) ────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Recommended action" eyebrow={`Morning Briefing · Chief Investment Banker · ${company.name}`} className="lg:col-span-7">
          <div className="px-4 py-4">
            <p className="max-w-[60ch] text-[16px] font-semibold leading-snug">{m.recommendedAction}</p>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
              <div><dt className="text-[11px] text-xo-faint">Expected value increase</dt><dd className="font-mono text-[16px] font-semibold tabular-nums text-xo-verified">+{fmtMoney(m.expectedIncreaseUsd)}</dd></div>
              <div><dt className="text-[11px] text-xo-faint">Confidence index</dt><dd className="font-mono text-[16px] font-semibold tabular-nums">{m.confidencePct}%</dd></div>
            </dl>
            <p className="mt-1 max-w-[60ch] text-[11px] text-xo-faint">Confidence index = 64 + 3 × active buyers + 12 × negotiation leverage (high = 1, medium = 0.6, low = 0.3; from sample offers), capped at 92 — a heuristic, not the valuation confidence.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => navigate("/console/autopilot")}>Execute →</Button>
              <ActionLink to="/console/autopilot" className="text-[13px]">See the plan</ActionLink>
            </div>
            <p className="mt-3 text-[12px] text-xo-faint">Execute opens Autonomous Exit, where the agents' work is laid out step by step and each step waits for your approval. Nothing is sent from this page.</p>
          </div>
        </Section>
        <Section title="Briefing register" eyebrow="What the desk is watching" className="lg:col-span-5">
          <dl className="divide-y divide-xo-line px-4 py-1">
            <Fact k="Enterprise value" v={fmtMoney(m.companyValue)} />
            <Fact k="Expected realized value" v={fmtMoney(m.potential)} />
            <Fact k="Value actions open" v={<Link to="/console/readiness" className="text-xo-action hover:underline">{m.fixCount} priced fixes · ~8 months</Link>} />
            <Fact k="Buyer activity" v={<Link to="/console/intelligence" className="text-xo-action hover:underline">{m.strategicActive > 0 ? `${m.strategicActive} strategic acquirer${m.strategicActive === 1 ? "" : "s"} in market` : "No strategic acquirer in market yet"}</Link>} />
          </dl>
        </Section>
      </div>

      {/* ── why the odds are what they are ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Exit probability breakdown" eyebrow={`Close-probability index ${m.exitProbability}%`} className="lg:col-span-5"
          foot="These three parts are the index's only inputs. It is a heuristic, not a measured likelihood.">
          <ul className="space-y-2 px-4 py-3">
            {factors.map((f) => (
              <li key={f.label} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-xo-muted">{f.label}</span>
                <span className="flex shrink-0 items-center gap-2"><Bar value={f.v} max={f.max} width="w-20" /><span className="w-16 text-right font-mono tabular-nums">{f.v.toFixed(1)} / {f.max}</span></span>
              </li>
            ))}
            <li className="flex justify-between border-t border-xo-line pt-2 text-[12px]"><span className="text-xo-muted">Total (rounded)</span><span className="font-mono tabular-nums">{m.exitProbability}</span></li>
          </ul>
        </Section>
        <Section title="Deal temperature index" eyebrow={tempLabel} className="lg:col-span-3" foot="70 + 4 × active buyers, capped at 98 — a heuristic.">
          <div className="px-4 py-4">
            <div className="font-mono text-[28px] font-semibold tabular-nums">{temp}<span className="text-[13px] text-xo-faint"> /100</span></div>
            <div className="mt-2"><Bar value={temp} width="w-full" tone="brass" /></div>
            <p className="mt-2 text-[13px] text-xo-muted">{DEMAND_LABEL === "High" ? "Buyer demand exceeds supply." : "Demand and supply are balanced."}</p>
          </div>
        </Section>
        <Section title="Value gap" eyebrow="Now vs after fixes" className="lg:col-span-4">
          <dl className="grid grid-cols-3 gap-2 px-4 py-4">
            <div><dt className="text-[11px] text-xo-faint">Current</dt><dd className="font-mono text-[15px] font-semibold tabular-nums">{fmtMoney(CURRENT_VALUE_USD)}</dd></div>
            <div><dt className="text-[11px] text-xo-faint">Potential</dt><dd className="font-mono text-[15px] font-semibold tabular-nums text-xo-verified">{fmtMoney(POTENTIAL_VALUE_USD)}</dd></div>
            <div><dt className="text-[11px] text-xo-faint">Missing</dt><dd className="font-mono text-[15px] font-semibold tabular-nums text-xo-caution">{fmtMoney(VALUE_LEFT_USD)}</dd></div>
          </dl>
          <p className="px-4 pb-3 text-[12px] text-xo-caution">{fmtMoney(VALUE_LEFT_USD)} left on the table</p>
        </Section>
      </div>

      <Section title="What Autonomous Exit prepares" eyebrow="Each step waits for your approval" className="border border-xo-line">
        <ol className="grid gap-2 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
          {AUTOMATION.map((a, i) => <li key={a} className="flex items-center gap-2 border border-xo-line px-3 py-2 text-[13px]"><span className="font-mono text-[11px] text-xo-faint">{i + 1}</span>{a}</li>)}
        </ol>
      </Section>

      {/* ── who is circling ────────────────────────────────────────── */}
      <Section title="Buyer appetite" eyebrow="Your top-ranked mandates" className="border border-xo-line" foot="Appetite is a registry profile attribute of each buyer, not recent activity.">
        <ul className="grid gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-4">
          {moves.map((mv) => (
            <li key={mv.name} className="bg-xo-panel px-4 py-3">
              <div className="text-[13px] font-semibold">{mv.name}</div>
              <div className="text-[12px] text-xo-muted">{mv.action}</div>
              <div className="mt-1 text-[11px] text-xo-faint">{mv.when}</div>
            </li>
          ))}
        </ul>
      </Section>
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-2">
        <Section title="Acquirer mix" eyebrow={`Top ${radarTotal} ranked buyers by type (list capped at 12)`}><div className="px-4 py-3"><AcquirerMixRadar data={radar} /></div></Section>
        <Section title="Banker notes" eyebrow="From the deal context" foot="Computed from the engines for this company and the source-referenced deal history.">
          <ul className="space-y-3 px-4 py-3">
            {notes.map((n) => <li key={n.t} className="flex gap-3 text-[13px]"><span className="w-12 shrink-0 font-mono text-[11px] text-xo-faint">{n.t}</span><span className="leading-snug">{n.text}</span></li>)}
          </ul>
        </Section>
      </div>

      {/* ── layers and market ─────────────────────────────────────── */}
      <nav aria-label="Command layers" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 lg:grid-cols-4">
        {layers.map((d) => (
          <Link key={d.roman} to={d.to} className="group bg-xo-panel px-4 py-3 hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action">
            <span className="flex items-center gap-2 text-[11px] text-xo-faint"><span className="font-mono font-semibold text-xo-brass">{d.roman}</span>{d.label} layer<span aria-hidden className="ml-auto text-xo-action">→</span></span>
            <span className="mt-1 block font-mono text-[17px] font-semibold tabular-nums">{d.v}</span>
            <span className="block text-[11px] text-xo-faint">{d.sub}</span>
          </Link>
        ))}
      </nav>
      <RegistryTape items={tape} asOf={AS_OF} />
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-3">
        <Section title="Acquisition reactor" foot={`Sector acquisition volume in the indexed registry, snapshot as of ${AS_OF}. Rotation is decorative.`}><AcquisitionReactor height={196} /></Section>
        <Section title="Buyer network reactor" foot={`Active acquirers by 12-month cadence, snapshot as of ${AS_OF}.`}><BuyerNetworkReactor height={196} /></Section>
        <Section title="Registry extremes" eyebrow={`Snapshot · as of ${AS_OF}`} foot="Extremes from the registry and sector indexes."><ReactorTelemetry /></Section>
      </div>
    </div>
  );
};

export default Commander;
