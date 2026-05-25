import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Reveal from '@/components/Reveal';
import { ArrowRight } from 'lucide-react';

// ── Operational visuals ──────────────────────────────────────────────
// Each institution gets a distinct, infrastructure-grade telemetry view —
// not a shared dashboard demo. Restrained, technical, mission-critical.

type Motif = 'knowledge' | 'electoral' | 'logistics' | 'finance' | 'oversight' | 'governance' | 'deployment';

function motifFor(category: string): Motif {
  const c = category.toLowerCase();
  if (/elector|ballot|voting/.test(c)) return 'electoral';
  if (/integrit|oversight|anti|procure|forensic/.test(c)) return 'oversight';
  if (/govern|civic|government/.test(c)) return 'governance';
  if (/logistic|transport|mobility/.test(c)) return 'logistics';
  if (/pay|bank|financ|settle/.test(c)) return 'finance';
  if (/knowledge|educat|intellig|learn|credential/.test(c)) return 'knowledge';
  return 'deployment';
}

const Frame: React.FC<{ accent: string; tag: string; children: React.ReactNode }> = ({ accent, tag, children }) => (
  <div className="relative w-full rounded-2xl border border-white/10 overflow-hidden glass-strong" style={{ aspectRatio: '16 / 11' }}>
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

// VeritasOS — semantic knowledge graph + reasoning core.
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

// ELECPRO — electoral telemetry: secure pathways + verification gates + tally.
const ElectoralViz: React.FC<{ accent: string }> = ({ accent }) => {
  const lanes = [40, 80, 120, 160];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* tally bar */}
      <rect x="20" y="10" width="160" height="3" rx="1.5" fill={accent} opacity="0.15" />
      <rect x="20" y="10" width="112" height="3" rx="1.5" fill={accent} className="animate-flicker" />
      {lanes.map((x, i) => (
        <g key={i}>
          <line x1={x} y1="112" x2={x} y2="20" stroke={accent} strokeOpacity="0.2" strokeWidth="0.6" />
          <line x1={x} y1="112" x2={x} y2="20" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.5}s` }} />
          {/* verification gates */}
          {[78, 46].map((gy, gi) => (
            <g key={gi}>
              <line x1={x - 7} y1={gy} x2={x + 7} y2={gy} stroke={accent} strokeOpacity="0.5" strokeWidth="0.7" />
              <circle cx={x} cy={gy} r="2" fill={gi === 1 ? accent : '#10B981'} className="animate-node" style={{ transformOrigin: `${x}px ${gy}px`, animationDelay: `${i * 0.4 + gi * 0.3}s` }} />
            </g>
          ))}
          {/* biometric confirm */}
          <circle cx={x} cy="20" r="3" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${x}px 20px`, animationDelay: `${i * 0.6}s` }} />
        </g>
      ))}
    </svg>
  );
};

// FlyttGo — logistics routing + fleet movement topology.
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

// Mobile Pay / Veritas Financial — transaction streams + settlement.
const FinanceViz: React.FC<{ accent: string }> = ({ accent }) => {
  const rails = [26, 46, 66, 86, 106];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {rails.map((y, i) => (
        <g key={i}>
          <line x1="14" y1={y} x2="170" y2={y} stroke={accent} strokeOpacity="0.18" strokeWidth="0.6" />
          <line x1="14" y1={y} x2="170" y2={y} stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.35}s` }} />
          <circle cx="14" cy={y} r="1.6" fill={accent} opacity="0.7" />
          {/* settlement node */}
          <circle cx="178" cy={y} r="2.4" fill={accent} className="animate-node" style={{ transformOrigin: `178px ${y}px`, animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
      {/* settlement ledger column */}
      <line x1="178" y1="18" x2="178" y2="114" stroke={accent} strokeOpacity="0.3" strokeWidth="0.5" />
    </svg>
  );
};

// ACT — anti-corruption: forensic anomaly detection over a procurement grid.
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
      {/* forensic sweep */}
      <div className="absolute inset-y-0 w-12 animate-sweep" style={{ background: `linear-gradient(90deg, transparent, ${accent}26, transparent)` }} />
    </div>
  );
};

// CivicOS — civic network: central government hub + ministry systems.
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

// Deployment / commerce — region pings + provisioning pipeline.
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

const VIZ: Record<Motif, React.FC<{ accent: string }>> = {
  knowledge: KnowledgeViz, electoral: ElectoralViz, logistics: LogisticsViz,
  finance: FinanceViz, oversight: OversightViz, governance: GovernanceViz, deployment: DeploymentViz,
};
const TAG: Record<Motif, string> = {
  knowledge: 'Intelligence telemetry · live', electoral: 'Electoral telemetry · live',
  logistics: 'Fleet topology · live', finance: 'Settlement streams · live',
  oversight: 'Forensic monitoring · active', governance: 'Civic mesh · live', deployment: 'Deployment mesh · live',
};

const SectorPanel: React.FC<{ p: EcosystemProduct; flip: boolean }> = ({ p, flip }) => {
  const motif = motifFor(p.category);
  const Viz = VIZ[motif];
  const caps = (p.capabilities || []).slice(0, 4);
  const metrics = (p.metrics || []).slice(0, 3);
  return (
    <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
      <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
        {/* accent glow bleed — panel emerges from the ecosystem atmosphere */}
        <div className="absolute -inset-8 rounded-[2rem] blur-[60px] opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle, ${p.accent}, transparent 70%)` }} />
        <div className="relative"><Frame accent={p.accent} tag={TAG[motif]}><Viz accent={p.accent} /></Frame></div>
      </div>
      <div className={flip ? 'lg:order-1' : ''}>
        <span className="inline-block text-[10px] font-mono uppercase tracking-[0.24em] px-2.5 py-1 rounded mb-5" style={{ background: `${p.accent}1f`, color: p.accent }}>{p.category}</span>
        <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.02] mb-4">{p.name}</h3>
        <p className="text-base text-white/55 max-w-md leading-relaxed mb-6">{p.tagline}</p>
        {caps.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-7 max-w-md">
            {caps.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm text-white/70">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.accent }} /> {c}
              </div>
            ))}
          </div>
        )}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-x-px gap-y-px mb-7 rounded-lg overflow-hidden border border-white/10 max-w-md bg-white/[0.02]">
            {metrics.map((m) => (
              <div key={m.label} className="flex-1 min-w-[110px] px-4 py-3 border-r border-white/5 last:border-r-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1 h-1 rounded-full" style={{ background: p.accent }} />
                  <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40">{m.label}</span>
                </div>
                <div className="text-lg font-mono font-semibold text-white tabular-nums leading-none">{m.value}</div>
              </div>
            ))}
          </div>
        )}
        <Link to={`/systems/${p.slug}`} className="group inline-flex items-center gap-2 text-white font-semibold">
          Preview infrastructure <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: p.accent }} />
        </Link>
      </div>
    </div>
  );
};

const EcosystemSectors: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      const rows = (data || []) as EcosystemProduct[];
      const featured = rows.filter((r) => r.is_featured);
      setProducts((featured.length ? featured : rows).slice(0, 6));
    })();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="relative py-28 sm:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* environmental continuity — section emerges from the living ecosystem */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[12%] -left-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-a" style={{ background: 'rgba(0,194,255,0.05)' }} />
        <div className="absolute bottom-[10%] -right-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-b" style={{ background: 'rgba(124,77,255,0.05)' }} />
        {/* faint infrastructure spine threading the systems */}
        <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,194,255,0.1) 12%, rgba(0,194,255,0.1) 88%, transparent)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="max-w-2xl mb-20">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Ecosystem in motion</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98] mb-5">
            Infrastructure already in motion.
          </h2>
          <p className="text-lg text-white/55 leading-relaxed">
            Deployable systems powering sovereign digital civilization — governance, finance, mobility and intelligence, operating at scale.
          </p>
        </div>

        <div className="space-y-28 sm:space-y-36">
          {products.map((p, i) => (
            <Reveal key={p.id} y={40}><SectorPanel p={p} flip={i % 2 === 1} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSectors;
