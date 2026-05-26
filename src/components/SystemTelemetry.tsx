import React from 'react';

// ── Shared institutional telemetry visuals ───────────────────────────
// Visual manifestations of sovereign institutions running at scale — dense,
// alive, mission-critical operational environments, not dashboard widgets.

export type Motif = 'knowledge' | 'electoral' | 'logistics' | 'finance' | 'payments' | 'oversight' | 'governance' | 'deployment';

export function motifFor(category: string): Motif {
  const c = (category || '').toLowerCase();
  if (/elector|ballot|voting/.test(c)) return 'electoral';
  if (/integrit|oversight|anti|procure|forensic/.test(c)) return 'oversight';
  if (/govern|civic|govtech|operating infrastructure|government runtime/.test(c)) return 'governance';
  if (/logistic|transport|mobility/.test(c)) return 'logistics';
  if (/mobile|wallet|circulation/.test(c) || /\bpay/.test(c)) return 'payments';
  if (/bank|financ|settle|treasury|fintech/.test(c)) return 'finance';
  if (/knowledge|educat|intellig|learn|credential|\bai\b/.test(c)) return 'knowledge';
  return 'deployment';
}

export const TAG: Record<Motif, string> = {
  knowledge: 'Cognition grid · reasoning', electoral: 'National election command · live',
  logistics: 'Planetary logistics · live', finance: 'Treasury orchestration · live',
  payments: 'Settlement circulation · live', oversight: 'Anti-corruption command · active',
  governance: 'Civic mesh · live', deployment: 'Deployment mesh · live',
};

// Functional readouts — imply real infrastructure logic, not decoration.
export const READOUT: Record<Motif, string> = {
  knowledge: 'reasoning 4.2K ops/s · 1.2M docs indexed',
  electoral: '11/45 districts reporting · verified',
  logistics: '1,284 routes · 312 shipments in transit',
  finance: 'settlement $184.6B/24h · clearing',
  payments: 'circulation $4.2M/24h · 6 corridors',
  oversight: '4 anomalies flagged · 12 under trace',
  governance: '7 ministries linked · sync nominal',
  deployment: '23 regions · 47 edge nodes online',
};

// Coarse continent dot field shared by map-based environments.
const CONTINENT: [number, number][] = [
  [30, 40], [26, 50], [34, 46], [24, 60], [32, 62], [40, 70], [46, 78], [22, 44],
  [92, 30], [98, 36], [90, 42], [100, 48], [96, 54], [104, 60], [88, 62], [84, 50],
  [144, 36], [152, 42], [148, 50], [160, 48], [156, 58], [138, 62], [168, 70], [128, 40], [120, 36], [176, 56],
];
const Continents: React.FC = () => (
  <>{CONTINENT.map(([x, y], i) => <circle key={`ct${i}`} cx={x} cy={y} r="1" fill="#4a72b8" opacity={0.4 + (i % 3) * 0.12} />)}</>
);

export const Frame: React.FC<{ accent: string; tag: string; readout?: string; children: React.ReactNode }> = ({ accent, tag, readout, children }) => (
  <div role="presentation" className="relative w-full h-full rounded-2xl border border-white/10 overflow-hidden glass-strong">
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 85% 75% at 28% 8%, ${accent}26, transparent 62%), linear-gradient(160deg, #0A1024, #05070F)` }} />
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 border-b border-white/5 z-10">
      <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">{tag}</span>
      <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Nominal
      </span>
    </div>
    <div className="absolute inset-x-0 top-9 bottom-7">{children}</div>
    {readout && (
      <div className="absolute bottom-0 inset-x-0 px-4 py-1.5 border-t border-white/5 bg-black/20">
        <span className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/40 truncate block">{readout}</span>
      </div>
    )}
  </div>
);

// VeritasOS — planetary knowledge constellation + central reasoning core.
const KnowledgeViz: React.FC<{ accent: string }> = ({ accent }) => {
  const core: [number, number] = [100, 60];
  const clusters: [number, number][] = [[44, 32], [150, 30], [40, 88], [158, 86], [100, 22], [100, 100]];
  // satellites around each cluster
  const sats = clusters.flatMap(([cx, cy], ci) =>
    Array.from({ length: 4 }, (_, k) => {
      const a = (k / 4) * Math.PI * 2 + ci;
      return [cx + Math.cos(a) * 13, cy + Math.sin(a) * 11, ci] as [number, number, number];
    }));
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {[18, 30, 44, 58].map((r, i) => <circle key={i} cx={core[0]} cy={core[1]} r={r} fill="none" stroke={accent} strokeOpacity="0.08" strokeWidth="0.4" />)}
      {/* cluster spokes + reasoning flow */}
      {clusters.map(([x, y], i) => (
        <g key={`cl${i}`}>
          <line x1={core[0]} y1={core[1]} x2={x} y2={y} stroke={accent} strokeOpacity="0.18" strokeWidth="0.6" />
          <line x1={core[0]} y1={core[1]} x2={x} y2={y} stroke="#fff" strokeWidth="1.1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.5}s` }} />
          <circle cx={x} cy={y} r="2.6" fill={accent} className="animate-node" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
      {/* satellites — semantic documents */}
      {sats.map(([x, y, ci], i) => (
        <g key={`s${i}`}>
          <line x1={clusters[ci][0]} y1={clusters[ci][1]} x2={x} y2={y} stroke={accent} strokeOpacity="0.12" strokeWidth="0.4" />
          <rect x={x - 1.8} y={y - 2.2} width="3.6" height="4.4" rx="0.6" fill={accent} opacity={0.5} className={i % 3 ? 'animate-flicker' : ''} style={{ animationDelay: `${i * 0.25}s` }} />
        </g>
      ))}
      <circle cx={core[0]} cy={core[1]} r="10" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${core[0]}px ${core[1]}px` }} />
      <circle cx={core[0]} cy={core[1]} r="5.5" fill={accent} className="animate-node" style={{ transformOrigin: `${core[0]}px ${core[1]}px` }} />
    </svg>
  );
};

// ELECPRO — national election command: district map reporting + tally + pathways.
const ElectoralViz: React.FC<{ accent: string }> = ({ accent }) => {
  const cols = 9, rows = 5;
  const reported = new Set(['1-0', '3-1', '5-0', '2-2', '6-1', '0-3', '7-2', '4-3', '8-0', '3-4', '6-4']);
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* national tally */}
      <rect x="16" y="8" width="168" height="3" rx="1.5" fill={accent} opacity="0.15" />
      <rect x="16" y="8" width="116" height="3" rx="1.5" fill={accent} className="animate-flicker" />
      {/* election districts */}
      {Array.from({ length: rows }).flatMap((_, r) => Array.from({ length: cols }).map((__, c) => {
        const x = 22 + c * 19; const y = 26 + r * 17; const on = reported.has(`${c}-${r}`);
        return (
          <g key={`${c}-${r}`}>
            <rect x={x - 6} y={y - 5} width="12" height="10" rx="1.5" fill={on ? accent : 'transparent'} fillOpacity={on ? 0.22 : 0} stroke={accent} strokeOpacity={on ? 0.6 : 0.18} strokeWidth="0.5" className={on ? 'animate-flicker' : ''} style={{ animationDelay: `${(c + r) * 0.2}s` }} />
            {on && <circle cx={x} cy={y} r="1.3" fill="#10B981" className="animate-node" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${(c + r) * 0.18}s` }} />}
          </g>
        );
      }))}
      {/* verification sync sweep */}
      <line x1="16" y1="113" x2="184" y2="113" stroke={accent} strokeOpacity="0.25" strokeWidth="0.5" />
      <line x1="16" y1="113" x2="184" y2="113" stroke="#fff" strokeWidth="1.2" className="animate-travel" />
    </svg>
  );
};

// FlyttGo — planetary logistics: continental fleet movement + dispatch core.
const LogisticsViz: React.FC<{ accent: string }> = ({ accent }) => {
  const hubs: [number, number][] = [[30, 44], [70, 30], [100, 50], [120, 34], [152, 54], [86, 84], [142, 86], [176, 44], [50, 70]];
  const routes = ['M30,44 Q50,24 70,30', 'M70,30 Q86,40 100,50', 'M100,50 Q110,30 120,34', 'M120,34 Q140,42 152,54', 'M152,54 Q168,46 176,44', 'M100,50 Q92,70 86,84', 'M86,84 Q114,90 142,86', 'M142,86 Q160,70 152,54', 'M30,44 Q40,60 50,70', 'M50,70 Q68,80 86,84', 'M70,30 Q120,55 152,54'];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <Continents />
      {routes.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="0.55" />
          <path d={d} fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${(i % 6) * 0.35}s` }} />
        </g>
      ))}
      {hubs.map(([x, y], i) => (
        <g key={`h${i}`}>
          {i % 3 === 0 && <circle cx={x} cy={y} r="6" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="0.5" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.5}s` }} />}
          <circle cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.7} fill={accent} className={i % 3 === 0 ? 'animate-node' : 'animate-flicker'} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
    </svg>
  );
};

// Veritas Financial — treasury orchestration: dense liquidity rails + settlement ledger.
const FinanceViz: React.FC<{ accent: string }> = ({ accent }) => {
  const rails = [22, 36, 50, 64, 78, 92, 106];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {rails.map((y, i) => (
        <g key={i}>
          <line x1="12" y1={y} x2="158" y2={y} stroke={accent} strokeOpacity="0.16" strokeWidth="0.5" />
          <line x1="12" y1={y} x2="158" y2={y} stroke="#fff" strokeWidth="1.1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.28}s` }} />
          <circle cx="12" cy={y} r="1.4" fill={accent} opacity="0.7" />
          {/* routing junctions between rails */}
          {i < rails.length - 1 && i % 2 === 0 && <line x1={60 + i * 8} y1={y} x2={60 + i * 8} y2={rails[i + 1]} stroke={accent} strokeOpacity="0.25" strokeWidth="0.5" />}
        </g>
      ))}
      {/* settlement ledger column */}
      <rect x="166" y="6" width="28" height="108" rx="2" fill={accent} opacity="0.05" />
      <line x1="166" y1="6" x2="166" y2="114" stroke={accent} strokeOpacity="0.3" strokeWidth="0.5" />
      {rails.map((y, i) => (
        <g key={`l${i}`}>
          <rect x="170" y={y - 2.5} width={10 + (i % 3) * 6} height="2" rx="1" fill={accent} opacity="0.55" className="animate-flicker" style={{ animationDelay: `${i * 0.3}s` }} />
          <circle cx="190" cy={y - 1.5} r="1.4" fill="#10B981" className="animate-node" style={{ transformOrigin: `190px ${y}px`, animationDelay: `${i * 0.35}s` }} />
        </g>
      ))}
    </svg>
  );
};

// Mobile Pay — continental financial bloodstream: money circulating between cities.
const PaymentsViz: React.FC<{ accent: string }> = ({ accent }) => {
  const cities: [number, number][] = [[32, 44], [70, 32], [100, 52], [128, 36], [158, 56], [88, 84], [146, 84], [50, 72]];
  const flows = ['M32,44 Q50,24 70,32', 'M70,32 Q86,40 100,52', 'M100,52 Q114,30 128,36', 'M128,36 Q148,44 158,56', 'M100,52 Q92,70 88,84', 'M88,84 Q118,90 146,84', 'M50,72 Q40,56 32,44', 'M158,56 Q156,72 146,84', 'M70,32 Q60,54 50,72'];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <Continents />
      {flows.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="0.55" />
          {/* twin packets per artery — circulation */}
          <path d={d} fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${(i % 5) * 0.3}s` }} />
          <path d={d} fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${(i % 5) * 0.3 + 1.2}s` }} />
        </g>
      ))}
      {cities.map(([x, y], i) => (
        <g key={`c${i}`}>
          <circle cx={x} cy={y} r="5" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="0.5" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.45}s` }} />
          <circle cx={x} cy={y} r="2.4" fill={accent} className="animate-node" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
    </svg>
  );
};

// ACT — anti-corruption command: forensic anomaly detection + tracing to an investigation core.
const OversightViz: React.FC<{ accent: string }> = ({ accent }) => {
  const cols = 12, rows = 6;
  const anomalies: [number, number][] = [[2, 1], [7, 3], [10, 0], [4, 4]];
  const probe: [number, number] = [100, 108];
  const cell = (c: number, r: number): [number, number] => [16 + c * 15.5, 14 + r * 15];
  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: rows }).flatMap((_, r) => Array.from({ length: cols }).map((__, c) => {
          const [x, y] = cell(c, r);
          return <rect key={`${c}-${r}`} x={x - 1.3} y={y - 1.3} width="2.6" height="2.6" rx="0.5" fill={accent} opacity={0.22 + ((c + r) % 3) * 0.1} />;
        }))}
        {/* tracing lines from anomalies to the investigation probe */}
        {anomalies.map(([c, r], i) => {
          const [x, y] = cell(c, r);
          return (
            <g key={`a${i}`}>
              <line x1={x} y1={y} x2={probe[0]} y2={probe[1]} stroke="#FF5470" strokeOpacity="0.4" strokeWidth="0.5" strokeDasharray="2 3" />
              <line x1={x} y1={y} x2={probe[0]} y2={probe[1]} stroke="#fff" strokeWidth="1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.5}s` }} />
              <circle cx={x} cy={y} r="6" fill="none" stroke="#FF5470" strokeWidth="0.9" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.4}s` }} />
              <rect x={x - 2} y={y - 2} width="4" height="4" rx="0.6" fill="#FF5470" className="animate-node" style={{ transformOrigin: `${x}px ${y}px` }} />
            </g>
          );
        })}
        {/* investigation core */}
        <circle cx={probe[0]} cy={probe[1]} r="3.4" fill={accent} className="animate-node" style={{ transformOrigin: `${probe[0]}px ${probe[1]}px` }} />
      </svg>
      {/* forensic sweep */}
      <div className="absolute inset-y-0 w-12 animate-sweep" style={{ background: `linear-gradient(90deg, transparent, ${accent}26, transparent)` }} />
    </div>
  );
};

// CivicOS — civic mesh: government hub + ministry systems.
const GovernanceViz: React.FC<{ accent: string }> = ({ accent }) => {
  const hub: [number, number] = [100, 60];
  const ministries: [number, number][] = [[40, 28], [100, 16], [160, 28], [178, 60], [160, 92], [100, 104], [40, 92], [22, 60]];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <circle cx={hub[0]} cy={hub[1]} r="40" fill="none" stroke={accent} strokeOpacity="0.08" strokeWidth="0.4" />
      {ministries.map(([x, y], i) => (
        <g key={i}>
          <line x1={hub[0]} y1={hub[1]} x2={x} y2={y} stroke={accent} strokeOpacity="0.2" strokeWidth="0.6" />
          {i % 2 === 0 && <line x1={hub[0]} y1={hub[1]} x2={x} y2={y} stroke="#fff" strokeWidth="1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.4}s` }} />}
          <rect x={x - 4.5} y={y - 3.5} width="9" height="7" rx="1" fill={accent} fillOpacity="0.12" stroke={accent} strokeOpacity="0.6" strokeWidth="0.6" />
          <circle cx={x} cy={y} r="1.3" fill={accent} className="animate-flicker" style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
      <circle cx={hub[0]} cy={hub[1]} r="8" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${hub[0]}px ${hub[1]}px` }} />
      <circle cx={hub[0]} cy={hub[1]} r="4.5" fill={accent} className="animate-node" style={{ transformOrigin: `${hub[0]}px ${hub[1]}px` }} />
    </svg>
  );
};

// Deployment / commerce — global edge mesh + provisioning pipeline.
const DeploymentViz: React.FC<{ accent: string }> = ({ accent }) => {
  const regions: [number, number][] = [[30, 46], [60, 34], [96, 50], [122, 36], [152, 58], [80, 82], [142, 88], [178, 44]];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <Continents />
      <path d="M30,46 L60,34 L96,50 L122,36 L152,58 L178,44" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="0.6" />
      <path d="M30,46 L60,34 L96,50 L122,36 L152,58 L178,44" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="animate-travel" />
      {regions.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.5}s` }} />
          <circle cx={x} cy={y} r="2" fill={accent} className={i % 2 ? 'animate-node' : ''} style={{ transformOrigin: `${x}px ${y}px` }} />
        </g>
      ))}
    </svg>
  );
};

export const VIZ: Record<Motif, React.FC<{ accent: string }>> = {
  knowledge: KnowledgeViz, electoral: ElectoralViz, logistics: LogisticsViz,
  finance: FinanceViz, payments: PaymentsViz, oversight: OversightViz,
  governance: GovernanceViz, deployment: DeploymentViz,
};

const SystemTelemetry: React.FC<{ category: string; accent: string; className?: string }> = ({ category, accent, className = '' }) => {
  const motif = motifFor(category);
  const Viz = VIZ[motif];
  return <div className={className}><Frame accent={accent} tag={TAG[motif]} readout={READOUT[motif]}><Viz accent={accent} /></Frame></div>;
};

export default SystemTelemetry;
