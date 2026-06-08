import React from "react";
import { Card, fmtMoney } from "../lib/ui";
import { CURRENT_VALUE_USD, POTENTIAL_VALUE_USD, VALUE_LEFT_USD, DEAL_BUYERS, ACTIVE_BUYERS, DEMAND_LABEL } from "../lib/deal-context";
import { commanderMetrics } from "../lib/commander-metrics";

// Chief Investment Banker blocks — the panels that make the command surface
// read like a digital investment bank: who's moving on the company, how hot
// the deal is, the value gap, the buyer universe, what Execute does, the
// probability breakdown, and a live banker feed. Company-side numbers are
// deal-context-derived; market activity is illustrative in demo mode.

// ── Block 1 · Buyer Movement ──────────────────────────────────────
export const BuyerMovement: React.FC = () => {
  const b = (i: number): string => DEAL_BUYERS[i]?.buyer.name ?? "A buyer";
  const moves = [
    { name: b(0), action: "Viewed profile", when: "17 minutes ago" },
    { name: b(1), action: "Opened teaser", when: "31 minutes ago" },
    { name: b(2), action: "Requested financials", when: "2 hours ago" },
    { name: b(3), action: "Monitoring", when: "Confidence 88%" },
  ];
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
  const cx = 110, cy = 108, R = 76, max = 12;
  const pt = (i: number, r: number): [number, number] => {
    const a = (-90 + i * (360 / RADAR.length)) * (Math.PI / 180);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = RADAR.map((d, i) => pt(i, (d.n / max) * R).join(",")).join(" ");
  const ring = (f: number): string => RADAR.map((_, i) => pt(i, R * f).join(",")).join(" ");
  return (
    <Card className="p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Acquisition radar</div>
      <div className="mt-2 grid items-center gap-4 sm:grid-cols-[220px_1fr]">
        <svg viewBox="0 0 220 210" className="w-full">
          {[0.33, 0.66, 1].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
          {RADAR.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; })}
          <polygon points={poly} fill="rgba(52,211,153,0.18)" stroke="#34d399" strokeWidth="1.5" />
          {RADAR.map((d, i) => { const [x, y] = pt(i, (d.n / max) * R); return <circle key={i} cx={x} cy={y} r="2.5" fill="#34d399" />; })}
        </svg>
        <ul className="space-y-1.5">
          {RADAR.map((d) => (
            <li key={d.label} className="flex items-center justify-between text-[12.5px]">
              <span className="text-white/70">{d.label}</span>
              <span className="font-mono font-bold text-white">{d.n}</span>
            </li>
          ))}
        </ul>
      </div>
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
  const b0 = DEAL_BUYERS[0]?.buyer.name ?? "A strategic acquirer";
  const notes = [
    { t: "09:12", text: `${b0} acquisition activity in logistics increased 14%.` },
    { t: "09:25", text: "Two strategic buyers entered the sector." },
    { t: "10:08", text: "Valuation estimate revised upward." },
    { t: "11:16", text: "Buyer interest score moved from 78 to 84." },
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
      <p className="mt-3 text-[11px] text-white/35">Live market intelligence · illustrative in demo mode</p>
    </Card>
  );
};
