import React from "react";
import { ACQ_INDEXES, MARKET_INTEL, fmtUsd } from "../lib/market-intel";
import { DNA_PROFILES } from "../lib/buyer-dna";

// ── THE ACQUISITION REACTOR SYSTEM ──────────────────────────────────
// Telemetry instruments, not decoration. Every node, ring and edge is sized
// and coloured by REAL data — sector indexes, disclosed value, the buyer
// registry. Only the slow rotation and node pulse are motion; the structure
// is the live state of the market. Reduced-motion stills the animation; the
// instrument still reads correctly.

const TAU = Math.PI * 2;
const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

/** REACTOR TELEMETRY — the live numeric readout beside the instruments. Every
 *  line is a real extremum from the registry/indexes, so the reactors are
 *  legible as data, not ornament. */
export const ReactorTelemetry: React.FC = () => {
  const hotSector = [...ACQ_INDEXES.indexes].filter((i) => i.trendPct != null).sort((a, b) => (b.trendPct ?? 0) - (a.trendPct ?? 0))[0];
  const busiest = [...DNA_PROFILES].filter((p) => p.events_indexed > 0).sort((a, b) => b.deals_12m - a.deals_12m)[0];
  const deepest = [...MARKET_INTEL.sectorHeat].sort((a, b) => b.disclosedUsd - a.disclosedUsd)[0];
  const rows: { k: string; v: string; tone?: string }[] = [
    { k: "Hottest sector", v: hotSector ? `${hotSector.sector} ${hotSector.trendPct! >= 0 ? "+" : ""}${Math.round((hotSector.trendPct ?? 0) * 100)}%` : "—", tone: "text-deal-300" },
    { k: "Busiest acquirer", v: busiest ? `${busiest.name} · ${busiest.deals_12m}/12m` : "—" },
    { k: "Deepest liquidity", v: deepest ? `${deepest.token} · ${fmtUsd(deepest.disclosedUsd)}` : "—", tone: "text-sky-300" },
    { k: "Total volume", v: ACQ_INDEXES.indexes.reduce((s, i) => s + i.volume, 0).toLocaleString() },
    { k: "Disclosed value", v: fmtUsd(MARKET_INTEL.totalDisclosedUsd) },
  ];
  return (
    <div className="divide-y divide-white/5">
      {rows.map((r) => (
        <div key={r.k} className="flex items-baseline justify-between gap-2 px-3 py-[7px] text-[11.5px]">
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">{r.k}</span>
          <span className={`font-mono tabular-nums ${r.tone ?? "text-white/80"}`}>{r.v}</span>
        </div>
      ))}
    </div>
  );
};

/** ACQUISITION REACTOR — sector acquisition volume as an orbital field.
 *  Node radius ∝ √volume; colour = 12-month trend; centre = total volume. */
export const AcquisitionReactor: React.FC<{ height?: number }> = ({ height = 200 }) => {
  const idx = [...ACQ_INDEXES.indexes].sort((a, b) => b.volume - a.volume).slice(0, 12);
  const maxVol = Math.max(...idx.map((i) => i.volume), 1);
  const total = ACQ_INDEXES.indexes.reduce((s, i) => s + i.volume, 0);
  const cx = 100, cy = 100, orbit = 72;
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Acquisition reactor — sector volume">
        {/* grid rings */}
        {[30, 50, 72].map((r) => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />)}
        <g className="ex-rspin">
          {idx.map((s, i) => {
            const a = (i / idx.length) * TAU - Math.PI / 2;
            const [x, y] = polar(cx, cy, orbit, a);
            const r = 3 + Math.sqrt(s.volume / maxVol) * 9;
            const up = (s.trendPct ?? 0) >= 0;
            const col = s.trendPct == null ? "#8aa0b8" : up ? "#45E38A" : "#f87171";
            return (
              <g key={s.sector}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke={col} strokeOpacity="0.18" strokeWidth="0.6" />
                <circle className="ex-node" cx={x} cy={y} r={r} fill={col} fillOpacity="0.85" style={{ animationDelay: `${i * 0.18}s` }} />
              </g>
            );
          })}
        </g>
        {/* core */}
        <circle cx={cx} cy={cy} r="20" fill="rgba(56,130,246,0.08)" stroke="rgba(56,130,246,0.4)" strokeWidth="0.8" />
        <text x={cx} y={cy - 1} textAnchor="middle" className="fill-white font-mono" style={{ fontSize: 13, fontWeight: 700 }}>{total.toLocaleString()}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" className="fill-white/40" style={{ fontSize: 5.5, letterSpacing: 1 }}>ACQUISITIONS</text>
      </svg>
    </div>
  );
};

/** LIQUIDITY REACTOR — disclosed capital depth as concentric wells. Ring
 *  radius ∝ cumulative disclosed value across the top sectors. */
export const LiquidityReactor: React.FC<{ height?: number }> = ({ height = 200 }) => {
  const sectors = [...MARKET_INTEL.sectorHeat].sort((a, b) => b.disclosedUsd - a.disclosedUsd).slice(0, 6);
  const totalUsd = MARKET_INTEL.totalDisclosedUsd;
  const maxUsd = Math.max(...sectors.map((s) => s.disclosedUsd), 1);
  const cx = 100, cy = 100;
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Liquidity reactor — disclosed capital">
        <g className="ex-rspin-r">
          {sectors.map((s, i) => {
            const r = 18 + (i + 1) * 11;
            const frac = s.disclosedUsd / maxUsd;
            const arc = frac * TAU * 0.92;
            const [sx, sy] = polar(cx, cy, r, -Math.PI / 2);
            const [ex, ey] = polar(cx, cy, r, -Math.PI / 2 + arc);
            const large = arc > Math.PI ? 1 : 0;
            return (
              <g key={s.token}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`} fill="none" stroke="#58C6FF" strokeOpacity={0.35 + frac * 0.5} strokeWidth="3" strokeLinecap="round" />
              </g>
            );
          })}
        </g>
        <text x={cx} y={cy - 1} textAnchor="middle" className="fill-white font-mono" style={{ fontSize: 12, fontWeight: 700 }}>{fmtUsd(totalUsd)}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" className="fill-white/40" style={{ fontSize: 5.5, letterSpacing: 1 }}>DISCLOSED</text>
      </svg>
    </div>
  );
};

/** BUYER NETWORK REACTOR — active acquirers as a pulsing node graph, sized by
 *  12-month cadence, linked to the core. */
export const BuyerNetworkReactor: React.FC<{ height?: number }> = ({ height = 200 }) => {
  const buyers = [...DNA_PROFILES].filter((p) => p.events_indexed > 0).sort((a, b) => b.deals_12m - a.deals_12m).slice(0, 14);
  const maxDeals = Math.max(...buyers.map((p) => p.deals_12m), 1);
  const cx = 100, cy = 100, orbit = 74;
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Buyer network reactor">
        <g className="ex-rspin">
          {buyers.map((p, i) => {
            const a = (i / buyers.length) * TAU - Math.PI / 2;
            const ringR = orbit - (i % 2) * 18;
            const [x, y] = polar(cx, cy, ringR, a);
            const r = 2.5 + (p.deals_12m / maxDeals) * 8;
            const hot = p.deals_12m >= 2;
            const col = hot ? "#45E38A" : "#FFB14A";
            return (
              <g key={p.buyer_id}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke={col} strokeOpacity="0.14" strokeWidth="0.5" />
                <circle className="ex-node" cx={x} cy={y} r={r} fill={col} fillOpacity="0.85" style={{ animationDelay: `${i * 0.13}s` }} />
              </g>
            );
          })}
        </g>
        <circle cx={cx} cy={cy} r="18" fill="rgba(69,227,138,0.07)" stroke="rgba(69,227,138,0.4)" strokeWidth="0.8" />
        <text x={cx} y={cy - 1} textAnchor="middle" className="fill-white font-mono" style={{ fontSize: 13, fontWeight: 700 }}>{buyers.length}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" className="fill-white/40" style={{ fontSize: 5.5, letterSpacing: 1 }}>ACQUIRERS</text>
      </svg>
    </div>
  );
};
