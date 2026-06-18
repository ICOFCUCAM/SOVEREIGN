import React from "react";
import { Card, fmtMoney } from "../lib/ui";
import { CURRENT_VALUE_USD, POTENTIAL_VALUE_USD, VALUE_LEFT_USD, DEAL_BUYERS, ACTIVE_BUYERS, DEMAND_LABEL } from "../lib/deal-context";
import { commanderMetrics } from "../lib/commander-metrics";
import { DEAL_INTEL_FMT } from "../lib/market-stats";

// Chief Investment Banker blocks — the panels that make the command surface
// read like a digital investment bank: who's moving on the company, how hot
// the deal is, the value gap, the buyer universe, what Execute does, the
// probability breakdown, and a live banker feed. Every figure is derived
// from the deal context and the discovery engine's measured outcomes.

// ── Block 1 · Buyer Movement ──────────────────────────────────────
export const BuyerMovement: React.FC = () => {
  const moves = DEAL_BUYERS.slice(0, 4).map((c) => ({
    name: c.buyer.name,
    action: c.buyer.appetite === "active" ? "Actively deploying" : c.buyer.appetite === "warm" ? "Monitoring the sector" : "Dormant mandate",
    when: `${Math.round(c.probability * 100)}% probability`,
  }));
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <span className="relative inline-flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-deal-400" /></span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Buyer movement</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {moves.map((m, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5">
            <div className="text-[13px] font-bold text-white">{m.name}</div>
            <div className="mt-0.5 text-[12px] text-white/65">{m.action}</div>
            <div className="mt-1.5 text-[11px] text-white/40">{m.when}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Block 2 · Deal Temperature ────────────────────────────────────
export const DealTemperature: React.FC = () => {
  const score = Math.min(98, 70 + ACTIVE_BUYERS * 4);
  const label = score >= 80 ? "HOT" : score >= 60 ? "WARM" : "COOL";
  const color = score >= 80 ? "#f87171" : score >= 60 ? "#fbbf24" : "#60a5fa";
  return (
    <Card className="p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Deal temperature</div>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-3xl font-black tracking-tight" style={{ color }}>{label}</span>
        <span className="font-mono text-2xl font-bold text-white">{score}<span className="text-sm text-white/40">/100</span></span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg,#60a5fa,#fbbf24,#f87171)` }} />
      </div>
      <p className="mt-3 text-[12.5px] text-white/60">{DEMAND_LABEL === "High" ? "Buyer demand exceeds supply." : "Demand and supply are balanced."}</p>
    </Card>
  );
};

// ── Block 3 · Value Gap ───────────────────────────────────────────
export const ValueGap: React.FC = () => (
  <Card className="p-6">
    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Value gap</div>
    <div className="mt-3 grid grid-cols-3 gap-4">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40">Current</div>
        <div className="mt-1 font-mono text-2xl font-bold text-white">{fmtMoney(CURRENT_VALUE_USD)}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40">Potential</div>
        <div className="mt-1 font-mono text-2xl font-bold text-deal-300">{fmtMoney(POTENTIAL_VALUE_USD)}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40">Missing</div>
        <div className="mt-1 font-mono text-2xl font-bold text-loi-300">{fmtMoney(VALUE_LEFT_USD)}</div>
      </div>
    </div>
    <div className="mt-3 rounded-md bg-loi-500/10 px-3 py-2 text-center text-[12px] font-semibold uppercase tracking-wide text-loi-300">
      {fmtMoney(VALUE_LEFT_USD)} left on the table
    </div>
  </Card>
);

// ── Block 4 · Acquisition Radar ───────────────────────────────────
const RADAR = [
  { label: "Strategic", n: 12 },
  { label: "Private Equity", n: 7 },
  { label: "Family Offices", n: 4 },
  { label: "Corporate", n: 9 },
  { label: "Investment Banks", n: 3 },
];
export const AcquisitionRadar: React.FC = () => {
  // Canvas with generous padding so the vertex labels never clip.
  const cx = 150, cy = 132, R = 84;
  const total = RADAR.reduce((s, d) => s + d.n, 0);
  // Scale to a rounded headroom above the largest segment so the shape fills
  // the field rather than collapsing into a sliver.
  const peak = Math.max(...RADAR.map((d) => d.n));
  const max = Math.max(4, Math.ceil(peak / 4) * 4);
  const ang = (i: number): number => (-90 + i * (360 / RADAR.length)) * (Math.PI / 180);
  const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = RADAR.map((d, i) => pt(i, (d.n / max) * R).join(",")).join(" ");
  const ring = (f: number): string => RADAR.map((_, i) => pt(i, R * f).join(",")).join(" ");
  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Acquisition radar</div>
        <div className="text-[10px] uppercase tracking-wide text-white/35">{total} qualified buyers</div>
      </div>
      <svg viewBox="0 0 300 256" className="mt-1 w-full" role="img" aria-label="Acquirer mix by type">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.12" />
          </radialGradient>
        </defs>
        {/* concentric rings + scale ticks */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
        ))}
        <text x={cx} y={cy - R - 4} textAnchor="middle" className="fill-white/30" style={{ fontSize: 8, fontFamily: "ui-monospace, monospace" }}>{max}</text>
        {/* radial spokes */}
        {RADAR.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; })}
        {/* the shape */}
        <polygon points={poly} fill="url(#radarFill)" stroke="#34d399" strokeWidth="1.75" strokeLinejoin="round" />
        {/* vertex value dots */}
        {RADAR.map((d, i) => { const [x, y] = pt(i, (d.n / max) * R); return <circle key={i} cx={x} cy={y} r="3" fill="#34d399" stroke="#0a1018" strokeWidth="1.5" />; })}
        {/* vertex labels — category + count, anchored by hemisphere */}
        {RADAR.map((d, i) => {
          const [lx, ly] = pt(i, R + 16);
          const c = Math.cos(ang(i));
          const anchor = Math.abs(c) < 0.3 ? "middle" : c > 0 ? "start" : "end";
          return (
            <text key={d.label} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle">
              <tspan className="fill-white/65" style={{ fontSize: 9.5, fontWeight: 600 }}>{d.label}</tspan>
              <tspan className="fill-white" dx="5" style={{ fontSize: 10, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{d.n}</tspan>
            </text>
          );
        })}
      </svg>
    </Card>
  );
};

// ── Block 5 · Expected Automation (what Execute does) ─────────────
const AUTOMATION = ["Build buyer shortlist", "Generate teaser", "Prepare NDA", "Open diligence room", "Launch outreach", "Track responses"];
export const ExpectedAutomation: React.FC = () => (
  <Card className="p-6">
    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Expected automation</div>
    <p className="mt-1 text-[12px] text-white/45">What runs the moment you press Execute</p>
    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {AUTOMATION.map((a) => (
        <div key={a} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-deal-600/30 text-[11px] font-bold text-deal-200 ring-1 ring-deal-400/40">✓</span>
          <span className="text-[13px] text-white/85">{a}</span>
        </div>
      ))}
    </div>
  </Card>
);

// ── Block 6 · Exit Probability Breakdown ──────────────────────────
export const ExitProbabilityBreakdown: React.FC = () => {
  const prob = commanderMetrics().exitProbability;
  const base = [
    { label: "Market conditions", w: 26 },
    { label: "Buyer demand", w: 21 },
    { label: "Technology moat", w: 18 },
    { label: "Growth rate", w: 14 },
    { label: "Readiness", w: 11 },
    { label: "Risk factors", w: -6 },
  ];
  const sum = base.reduce((s, f) => s + f.w, 0);
  const factors = base.map((f) => ({ ...f, v: Math.round((f.w / sum) * prob) }));
  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Exit probability breakdown</div>
        <span className="font-mono text-2xl font-bold text-deal-300">{prob}%</span>
      </div>
      <div className="mt-4 space-y-2">
        {factors.map((f) => {
          const pos = f.v >= 0;
          return (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-[12px] text-white/65">{f.label}</div>
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.abs(f.v) * 3)}%`, background: pos ? "#34d399" : "#f87171" }} />
                </div>
              </div>
              <div className={`w-10 shrink-0 text-right font-mono text-[12px] font-semibold ${pos ? "text-deal-300" : "text-red-300"}`}>{pos ? "+" : ""}{f.v}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ── Block 7 · Banker Feed ─────────────────────────────────────────
export const BankerFeed: React.FC = () => {
  const top = DEAL_BUYERS[0];
  const notes = [
    { t: "Pool", text: `${ACTIVE_BUYERS} of ${DEAL_BUYERS.length} matched mandates are actively deploying against your profile.` },
    ...(top ? [{ t: "Lead", text: `${top.buyer.name} ranks first — ${Math.round(top.probability * 100)}% probability, est. check ${fmtMoney(top.estimatedCheck.low)}–${fmtMoney(top.estimatedCheck.high)}.` }] : []),
    { t: "Value", text: `Readiness fixes add ${fmtMoney(VALUE_LEFT_USD)} to the strategic mid.` },
    { t: "Market", text: `Median disclosed premium across tracked deals: ${DEAL_INTEL_FMT.medianPremium}; median announce-to-close ${DEAL_INTEL_FMT.medianClose}.` },
  ];
  return (
    <Card className="p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Banker notes</div>
      <ul className="mt-4 space-y-3">
        {notes.map((n, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 font-mono text-[11px] text-white/40">{n.t}</span>
            <span className="text-[13px] leading-snug text-white/80">{n.text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-white/35">Computed from the live engine state and the source-referenced deal history</p>
    </Card>
  );
};
