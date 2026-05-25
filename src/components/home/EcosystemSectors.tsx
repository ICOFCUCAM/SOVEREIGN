import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Reveal from '@/components/Reveal';
import { ArrowRight } from 'lucide-react';

// ── Operational visuals ──────────────────────────────────────────────
// Each sector gets a believable mini "operations theater" keyed to its
// domain. Restrained, cinematic, accent-driven — not infographic spam.

type Motif = 'logistics' | 'finance' | 'governance' | 'knowledge' | 'deployment' | 'mesh';

function motifFor(category: string): Motif {
  const c = category.toLowerCase();
  if (/(logistic|transport|mobility)/.test(c)) return 'logistics';
  if (/(pay|bank|financ|settle)/.test(c)) return 'finance';
  if (/(govern|elector|integrit|oversight|civic)/.test(c)) return 'governance';
  if (/(knowledge|educat|intellig|learn)/.test(c)) return 'knowledge';
  if (/(deploy|cloud|commerce|marketplace|operation)/.test(c)) return 'deployment';
  return 'mesh';
}

const Frame: React.FC<{ accent: string; children: React.ReactNode }> = ({ accent, children }) => (
  <div className="relative w-full rounded-2xl border border-white/10 overflow-hidden glass-strong" style={{ aspectRatio: '16 / 11' }}>
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 70% at 30% 10%, ${accent}22, transparent 60%), linear-gradient(160deg, #0A1024, #05070F)` }} />
    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`, backgroundSize: '26px 26px' }} />
    {/* operations header strip */}
    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 border-b border-white/5">
      <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">Operations · live</span>
      <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Nominal
      </span>
    </div>
    <div className="absolute inset-x-0 bottom-0 top-9">{children}</div>
  </div>
);

const LogisticsViz: React.FC<{ accent: string }> = ({ accent }) => (
  <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    {[[20, 40], [80, 30], [150, 50], [110, 88], [40, 92], [175, 95]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="2.4" fill={accent} className={i % 2 ? 'animate-node' : ''} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.5}s` }} />
        <circle cx={x} cy={y} r="6" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="0.6" />
      </g>
    ))}
    {[['M20,40 Q60,10 80,30', 0], ['M80,30 Q130,20 150,50', 0.5], ['M150,50 Q140,75 110,88', 1], ['M40,92 Q70,80 110,88', 1.5], ['M150,50 Q175,70 175,95', 0.8]].map(([d, delay], i) => (
      <g key={`r${i}`}>
        <path d={d as string} fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="0.8" />
        <path d={d as string} fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${delay}s` }} />
      </g>
    ))}
  </svg>
);

const FinanceViz: React.FC<{ accent: string }> = ({ accent }) => (
  <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    {Array.from({ length: 18 }).map((_, i) => {
      const h = 14 + ((Math.sin(i * 1.7) + 1) / 2) * 64;
      return <rect key={i} x={10 + i * 10} y={104 - h} width="5.5" height={h} rx="1" fill={accent} opacity={0.25 + (i % 5) * 0.12} className={i % 4 === 0 ? 'animate-flicker' : ''} style={{ animationDelay: `${i * 0.2}s` }} />;
    })}
    <line x1="6" y1="104" x2="194" y2="104" stroke={accent} strokeOpacity="0.3" strokeWidth="0.6" />
    <polyline points={Array.from({ length: 18 }, (_, i) => `${12 + i * 10},${44 - ((Math.sin(i * 0.9 + 1) + 1) / 2) * 26}`).join(' ')} fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const GovernanceViz: React.FC<{ accent: string }> = ({ accent }) => {
  const nodes: Array<[number, number, boolean]> = [[40, 30, false], [100, 22, false], [160, 40, false], [70, 70, true], [130, 78, false], [100, 100, false]];
  const edges = [[0, 1], [1, 2], [0, 3], [1, 3], [3, 5], [3, 4], [2, 4], [4, 5]];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {edges.map(([a, b], i) => <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={accent} strokeOpacity="0.22" strokeWidth="0.6" />)}
      {nodes.map(([x, y, flag], i) => (
        <g key={i}>
          {flag && <circle cx={x} cy={y} r="7" fill="none" stroke="#FF5470" strokeWidth="0.9" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px` }} />}
          <circle cx={x} cy={y} r={flag ? 3.2 : 2.4} fill={flag ? '#FF5470' : accent} className={flag ? 'animate-node' : ''} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}
    </svg>
  );
};

const KnowledgeViz: React.FC<{ accent: string }> = ({ accent }) => {
  const nodes = Array.from({ length: 11 }, (_, i) => [25 + (i * 53) % 150, 20 + (i * 37) % 80] as [number, number]);
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {nodes.map((n, i) => i < nodes.length - 1 && <line key={i} x1={n[0]} y1={n[1]} x2={nodes[(i + 3) % nodes.length][0]} y2={nodes[(i + 3) % nodes.length][1]} stroke={accent} strokeOpacity="0.18" strokeWidth="0.5" />)}
      {nodes.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r="2" fill={accent} className={i % 3 === 0 ? 'animate-node' : 'animate-flicker'} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.3}s` }} />)}
    </svg>
  );
};

const DeploymentViz: React.FC<{ accent: string }> = ({ accent }) => {
  const regions: Array<[number, number]> = [[35, 45], [60, 35], [95, 50], [120, 38], [150, 58], [80, 80], [140, 88]];
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {regions.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill="none" stroke={accent} strokeWidth="0.8" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.6}s` }} />
          <circle cx={x} cy={y} r="2" fill={accent} />
        </g>
      ))}
      <path d="M35,45 L60,35 L95,50 L120,38 L150,58" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" className="animate-travel" />
    </svg>
  );
};

const VIZ: Record<Motif, React.FC<{ accent: string }>> = {
  logistics: LogisticsViz, finance: FinanceViz, governance: GovernanceViz,
  knowledge: KnowledgeViz, deployment: DeploymentViz, mesh: KnowledgeViz,
};

const SectorPanel: React.FC<{ p: EcosystemProduct; flip: boolean }> = ({ p, flip }) => {
  const Viz = VIZ[motifFor(p.category)];
  const caps = (p.capabilities || []).slice(0, 4);
  const metrics = (p.metrics || []).slice(0, 3);
  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
      <div className={flip ? 'lg:order-2' : ''}>
        <Frame accent={p.accent}><Viz accent={p.accent} /></Frame>
      </div>
      <div className={flip ? 'lg:order-1' : ''}>
        <span className="inline-block text-[10px] font-mono uppercase tracking-[0.24em] px-2.5 py-1 rounded mb-5" style={{ background: `${p.accent}1f`, color: p.accent }}>{p.category}</span>
        <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.02] mb-4">{p.name}</h3>
        <p className="text-base text-white/55 max-w-md leading-relaxed mb-6">{p.tagline}</p>
        {caps.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-6 max-w-md">
            {caps.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm text-white/70">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.accent }} /> {c}
              </div>
            ))}
          </div>
        )}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3 mb-7">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-xl font-bold text-white tabular-nums leading-none">{m.value}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1">{m.label}</div>
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
    <section className="py-28 sm:py-40 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
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
