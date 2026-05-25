import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import {
  ArrowRight, ArrowUpRight, LayoutGrid, Scale, Truck, Banknote, GraduationCap, ShoppingCart,
  Landmark, Vote, Rocket, Cpu, Network, Activity, Database, ShieldCheck, Server, Globe,
} from 'lucide-react';

const CAT_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'Governance Integrity': Scale,
  'Sovereign Government OS': Landmark,
  'Sovereign Electoral Infrastructure': Vote,
  'Transport & Logistics Infrastructure': Truck,
  'Sovereign Payments & Banking': Banknote,
  'Sovereign Financial Operating System': Landmark,
  'Education & Credentialing': GraduationCap,
  'Sovereign Knowledge & Intelligence OS': Cpu,
  'Operations Command': Activity,
  'Sovereign Deployment Infrastructure': Rocket,
  'Commerce & Marketplace': ShoppingCart,
};

const ArtCard: React.FC<{ p: EcosystemProduct }> = ({ p }) => {
  const Icon = CAT_ICON[p.category] || Network;
  const live = !!p.url;
  const cls = 'group relative block overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 transition-all duration-500 h-52';
  const inner = (
    <>
      {/* Imagery / cinematic art */}
      {p.image_url ? (
        <img src={p.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700" />
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 20%, ${p.accent}40, transparent 60%), linear-gradient(160deg, #0A1024, #05070F)` }} />
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: `linear-gradient(${p.accent} 1px, transparent 1px), linear-gradient(90deg, ${p.accent} 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            maskImage: 'radial-gradient(ellipse at 70% 30%, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 30%, black, transparent 75%)',
          }} />
          <Icon className="absolute right-4 bottom-2 w-28 h-28 opacity-[0.10] group-hover:opacity-20 transition-opacity" style={{ color: p.accent }} />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070F] via-[#05070F]/40 to-transparent" />

      <div className="relative h-full p-5 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-[0.22em] px-2 py-0.5 rounded" style={{ background: `${p.accent}1f`, color: p.accent }}>{p.category}</span>
          <span className="inline-flex items-center gap-1 text-[8px] font-mono uppercase tracking-wider text-white/50">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p.accent }} /> Deployable
          </span>
        </div>
        <div className="mt-auto">
          <h3 className="text-xl font-bold text-white">{p.name}</h3>
          <p className="text-sm text-white/55 line-clamp-1">{p.tagline}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white/70 group-hover:text-white transition">
            {live ? 'View preview' : 'Explore'}
            {live ? <ArrowUpRight className="w-3.5 h-3.5" style={{ color: p.accent }} /> : <ArrowRight className="w-3.5 h-3.5" style={{ color: p.accent }} />}
          </span>
        </div>
      </div>
    </>
  );
  return live
    ? <a href={p.url as string} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
    : <Link to="/marketplace" className={cls}>{inner}</Link>;
};

const Spark: React.FC<{ color: string; seed: number }> = ({ color, seed }) => {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const h = 10 + ((Math.sin(i * 1.3 + seed) + 1) / 2) * 14;
    return `${i * 6},${20 - h}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 66 20" className="w-16 h-5">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
};

const LiveIntelligence: React.FC<{ listings: number }> = ({ listings }) => {
  const rows = [
    { icon: Network, label: 'Edge Network', value: 'Multi-region', color: '#00D9FF' },
    { icon: Cpu, label: 'AI Valuation Engine', value: 'kernel v3', color: '#7C3AED' },
    { icon: Rocket, label: 'Deployment Engine', value: '< 2 min', color: '#10B981' },
    { icon: Database, label: 'Database Cluster', value: 'Healthy', color: '#22D3EE' },
    { icon: ShieldCheck, label: 'Trust & Security', value: '99.99%', color: '#F59E0B' },
    { icon: ShoppingCart, label: 'Marketplace Services', value: `${listings} listings`, color: '#06B6D4' },
    { icon: Server, label: 'Infrastructure Health', value: 'Excellent', color: '#10B981' },
  ];
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white font-semibold text-sm">Live System Intelligence</span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All systems operational
        </span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="flex items-center gap-3">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: r.color }} />
              <span className="text-sm text-white/75 flex-1 truncate">{r.label}</span>
              <span className="text-[11px] font-mono text-white/45 tabular-nums">{r.value}</span>
              <Spark color={r.color} seed={i} />
              <span className="text-[9px] font-mono uppercase text-emerald-300">Live</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Decorative dot-cloud world map.
const REGION_DOTS = [
  { c: '#00D9FF', pts: [[18, 34], [22, 40], [16, 46], [26, 52], [20, 58]] }, // Americas
  { c: '#7C3AED', pts: [[48, 30], [52, 34], [50, 40]] }, // Europe
  { c: '#10B981', pts: [[52, 50], [50, 58], [56, 54]] }, // Africa
  { c: '#F59E0B', pts: [[66, 36], [72, 42], [76, 38], [70, 48]] }, // Asia
  { c: '#22D3EE', pts: [[82, 62], [86, 66]] }, // Oceania
];
const GlobalPresence: React.FC = () => (
  <div className="glass-strong rounded-2xl p-5">
    <div className="text-white font-semibold text-sm mb-3">Global Presence</div>
    <div className="relative rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden" style={{ aspectRatio: '2.2 / 1' }}>
      <svg viewBox="0 0 100 70" className="absolute inset-0 w-full h-full">
        {REGION_DOTS.flatMap((r, ri) => r.pts.map(([x, y], i) => (
          <circle key={`${ri}-${i}`} cx={x} cy={y} r="1.2" fill={r.c} className="animate-node" style={{ animationDelay: `${(ri + i) * 0.4}s`, transformOrigin: `${x}px ${y}px` }} />
        )))}
      </svg>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
      {[['Americas', '#00D9FF'], ['Europe', '#7C3AED'], ['Africa', '#10B981'], ['Asia', '#F59E0B'], ['Oceania', '#22D3EE']].map(([l, c]) => (
        <span key={l} className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white/50">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c as string }} /> {l}
        </span>
      ))}
    </div>
  </div>
);

const EcosystemSection: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      setProducts((data || []) as EcosystemProduct[]);
    })();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Intro */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-4">Ecosystem in motion</div>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter text-white leading-[0.95]">Real systems.<br />Real impact.</h2>
            <p className="text-white/50 mt-4 max-w-md leading-relaxed">A connected ecosystem of sovereign infrastructure powering governments, enterprises, and millions of users — domain to startup to civilization.</p>
          </div>
          <Link to="/marketplace" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass hover:glass-strong text-white font-semibold text-sm self-start">
            <LayoutGrid className="w-4 h-4 text-cyan-400" /> View All Systems
          </Link>
        </div>

        {/* Composite: cards + intelligence/map */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 content-start">
            {products.map((p) => <ArtCard key={p.id} p={p} />)}
          </div>
          <div className="space-y-5">
            <LiveIntelligence listings={products.length} />
            <GlobalPresence />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
