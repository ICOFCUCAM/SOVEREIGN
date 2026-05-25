import React from 'react';

// ── Shared institutional telemetry visuals ───────────────────────────
// Infrastructure-grade, per-domain visualizations used across the homepage
// ecosystem sectors and the marketplace acquisition panels. Restrained,
// technical, mission-critical — never generic dashboard demos.

export type Motif = 'knowledge' | 'electoral' | 'logistics' | 'finance' | 'oversight' | 'governance' | 'deployment';

export function motifFor(category: string): Motif {
  const c = (category || '').toLowerCase();
  if (/elector|ballot|voting/.test(c)) return 'electoral';
  if (/integrit|oversight|anti|procure|forensic/.test(c)) return 'oversight';
  if (/govern|civic|govtech/.test(c)) return 'governance';
  if (/logistic|transport|mobility/.test(c)) return 'logistics';
  if (/pay|bank|financ|settle|fintech/.test(c)) return 'finance';
  if (/knowledge|educat|intellig|learn|credential|\bai\b/.test(c)) return 'knowledge';
  return 'deployment';
}

export const TAG: Record<Motif, string> = {
  knowledge: 'Intelligence telemetry · live', electoral: 'Electoral telemetry · live',
  logistics: 'Fleet topology · live', finance: 'Settlement streams · live',
  oversight: 'Forensic monitoring · active', governance: 'Civic mesh · live', deployment: 'Deployment mesh · live',
};

export const Frame: React.FC<{ accent: string; tag: string; children: React.ReactNode }> = ({ accent, tag, children }) => (
  <div className="relative w-full h-full rounded-2xl border border-white/10 overflow-hidden glass-strong">
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 85% 75% at 28% 8%, ${accent}26, transparent 62%), linear-gradient(160deg, #0A1024, #05070F)` }} />
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 border-b border-white/5 z-10">
      <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">{tag}</span>
      <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Nominal
      </span>
    </div>
    <div className="absolute inset-x-0 bottom-0 top-9">{children}</div>
  </div>
);

const KnowledgeViz: React.FC<{ accent: string }> = ({ accent }) => {
  const core: [number, number] = [100, 60];
  const docs: [number, number][] = [[40, 28], [60, 18], [150, 26], [170, 44], [36, 70], [54, 92], [88, 100], [120, 98], [158, 84], [26, 48], [180, 64], [110, 24]];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {[16, 28, 42].map((r, i) => <circle key={i} cx={core[0]} cy={core[1]} r={r} fill="none" stroke={accent} strokeOpacity="0.1" strokeWidth="0.4" />)}
      {docs.map(([x, y], i) => (
        <g key={i}>
          <line x1={core[0]} y1={core[1]} x2={x} y2={y} stroke={accent} strokeOpacity="0.16" strokeWidth="0.5" />
          {i % 3 === 0 && <line x1={core[0]} y1={core[1]} x2={x} y2={y} stroke="#fff" strokeWidth="1.1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.4}s` }} />}
          <rect x={x - 2.4} y={y - 3} width="4.8" height="6" rx="0.8" fill={accent} opacity={0.5} className={i % 2 ? 'animate-flicker' : ''} style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
      <circle cx={core[0]} cy={core[1]} r="9" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${core[0]}px ${core[1]}px` }} />
      <circle cx={core[0]} cy={core[1]} r="5" fill={accent} className="animate-node" style={{ transformOrigin: `${core[0]}px ${core[1]}px` }} />
    </svg>
  );
};

const ElectoralViz: React.FC<{ accent: string }> = ({ accent }) => {
  const lanes = [40, 80, 120, 160];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="20" y="10" width="160" height="3" rx="1.5" fill={accent} opacity="0.15" />
      <rect x="20" y="10" width="112" height="3" rx="1.5" fill={accent} className="animate-flicker" />
      {lanes.map((x, i) => (
        <g key={i}>
          <line x1={x} y1="112" x2={x} y2="20" stroke={accent} strokeOpacity="0.2" strokeWidth="0.6" />
          <line x1={x} y1="112" x2={x} y2="20" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.5}s` }} />
          {[78, 46].map((gy, gi) => (
            <g key={gi}>
              <line x1={x - 7} y1={gy} x2={x + 7} y2={gy} stroke={accent} strokeOpacity="0.5" strokeWidth="0.7" />
              <circle cx={x} cy={gy} r="2" fill={gi === 1 ? accent : '#10B981'} className="animate-node" style={{ transformOrigin: `${x}px ${gy}px`, animationDelay: `${i * 0.4 + gi * 0.3}s` }} />
            </g>
          ))}
          <circle cx={x} cy="20" r="3" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${x}px 20px`, animationDelay: `${i * 0.6}s` }} />
        </g>
      ))}
    </svg>
  );
};

const LogisticsViz: React.FC<{ accent: string }> = ({ accent }) => {
  const hubs: [number, number][] = [[24, 44], [70, 26], [118, 38], [158, 28], [184, 56], [140, 78], [86, 92], [40, 86]];
  const routes = ['M24,44 Q48,18 70,26', 'M70,26 Q96,22 118,38', 'M118,38 Q140,20 158,28', 'M158,28 Q180,40 184,56', 'M184,56 Q165,70 140,78', 'M140,78 Q112,90 86,92', 'M86,92 Q58,92 40,86', 'M40,86 Q24,66 24,44', 'M70,26 Q100,55 140,78'];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {routes.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={accent} strokeOpacity="0.22" strokeWidth="0.6" />
          <path d={d} fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${(i % 5) * 0.4}s` }} />
        </g>
      ))}
      {hubs.map(([x, y], i) => (
        <g key={`h${i}`}>
          {i % 3 === 0 && <circle cx={x} cy={y} r="6" fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="0.5" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.5}s` }} />}
          <circle cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.8} fill={accent} className={i % 3 === 0 ? 'animate-node' : ''} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
    </svg>
  );
};

const FinanceViz: React.FC<{ accent: string }> = ({ accent }) => {
  const rails = [26, 46, 66, 86, 106];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {rails.map((y, i) => (
        <g key={i}>
          <line x1="14" y1={y} x2="170" y2={y} stroke={accent} strokeOpacity="0.18" strokeWidth="0.6" />
          <line x1="14" y1={y} x2="170" y2={y} stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.35}s` }} />
          <circle cx="14" cy={y} r="1.6" fill={accent} opacity="0.7" />
          <circle cx="178" cy={y} r="2.4" fill={accent} className="animate-node" style={{ transformOrigin: `178px ${y}px`, animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
      <line x1="178" y1="18" x2="178" y2="114" stroke={accent} strokeOpacity="0.3" strokeWidth="0.5" />
    </svg>
  );
};

const OversightViz: React.FC<{ accent: string }> = ({ accent }) => {
  const cols = 11, rows = 6;
  const flags = new Set(['2-1', '7-3', '9-0']);
  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: rows }).flatMap((_, r) => Array.from({ length: cols }).map((__, c) => {
          const x = 18 + c * 16.4; const y = 16 + r * 16;
          const flag = flags.has(`${c}-${r}`);
          return flag ? (
            <g key={`${c}-${r}`}>
              <circle cx={x} cy={y} r="6" fill="none" stroke="#FF5470" strokeWidth="0.9" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px` }} />
              <rect x={x - 2} y={y - 2} width="4" height="4" rx="0.6" fill="#FF5470" className="animate-node" style={{ transformOrigin: `${x}px ${y}px` }} />
            </g>
          ) : <rect key={`${c}-${r}`} x={x - 1.4} y={y - 1.4} width="2.8" height="2.8" rx="0.5" fill={accent} opacity={0.28 + ((c + r) % 3) * 0.12} />;
        }))}
      </svg>
      <div className="absolute inset-y-0 w-12 animate-sweep" style={{ background: `linear-gradient(90deg, transparent, ${accent}26, transparent)` }} />
    </div>
  );
};

const GovernanceViz: React.FC<{ accent: string }> = ({ accent }) => {
  const hub: [number, number] = [100, 60];
  const ministries: [number, number][] = [[40, 30], [100, 18], [160, 30], [176, 70], [134, 98], [66, 98], [24, 70]];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {ministries.map(([x, y], i) => (
        <g key={i}>
          <line x1={hub[0]} y1={hub[1]} x2={x} y2={y} stroke={accent} strokeOpacity="0.2" strokeWidth="0.6" />
          {i % 2 === 0 && <line x1={hub[0]} y1={hub[1]} x2={x} y2={y} stroke="#fff" strokeWidth="1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.4}s` }} />}
          <rect x={x - 4} y={y - 3} width="8" height="6" rx="1" fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="0.7" />
          <circle cx={x} cy={y} r="1.4" fill={accent} className="animate-flicker" style={{ animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
      <circle cx={hub[0]} cy={hub[1]} r="7" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${hub[0]}px ${hub[1]}px` }} />
      <circle cx={hub[0]} cy={hub[1]} r="4" fill={accent} className="animate-node" style={{ transformOrigin: `${hub[0]}px ${hub[1]}px` }} />
    </svg>
  );
};

const DeploymentViz: React.FC<{ accent: string }> = ({ accent }) => {
  const regions: [number, number][] = [[34, 46], [60, 34], [96, 50], [122, 36], [152, 58], [80, 82], [142, 88], [178, 44]];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <path d="M34,46 L60,34 L96,50 L122,36 L152,58 L178,44" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="0.6" />
      <path d="M34,46 L60,34 L96,50 L122,36 L152,58 L178,44" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="animate-travel" />
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
  finance: FinanceViz, oversight: OversightViz, governance: GovernanceViz, deployment: DeploymentViz,
};

const SystemTelemetry: React.FC<{ category: string; accent: string; className?: string }> = ({ category, accent, className = '' }) => {
  const motif = motifFor(category);
  const Viz = VIZ[motif];
  return <div className={className}><Frame accent={accent} tag={TAG[motif]}><Viz accent={accent} /></Frame></div>;
};

export default SystemTelemetry;
