import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import { ArrowRight, ArrowUpRight, FileText, Scale, Banknote, Truck, Cpu, GraduationCap, ShoppingCart, Server } from 'lucide-react';
import HudCorners from '@/components/HudCorners';

// Featured sovereign infrastructures — independent flagships available
// for deployment. National Shell leads the rotation as the cinematic
// centerpiece; ordering here is editorial, not a hierarchy claim.
const FEATURED_SLUGS = [
  'civicos-national-shell',
  'civicos',
  'emergency-ai-platform',
  'veritas-banking',
  'elecpro',
  'veritas-os',
  'veritas-operations',
  'sovereign-dispatch',
];

const deployValueOf = (p: EcosystemProduct): string | null => {
  const m = (p.metrics || []).find((x) => /value|valuation|infrastructure|deployment|price|asking/i.test(x.label)) || p.metrics?.[0];
  return m?.value || null;
};

const flagshipMetrics = (p: EcosystemProduct): Array<[string, string, string?]> => {
  const m = p.metrics || [];
  if (m.length >= 3) return m.slice(0, 3).map((x) => [x.label, x.value]) as Array<[string, string, string?]>;
  const fill: Array<[string, string]> = [
    ['Deployment value', deployValueOf(p) || '—'],
    ['Status', (p.status || 'Operational').replace(/^\w/, (c) => c.toUpperCase())],
    ['Class', (p.category || 'Sovereign infrastructure')],
  ];
  return [...m.map((x) => [x.label, x.value] as [string, string]), ...fill].slice(0, 3) as Array<[string, string, string?]>;
};

interface Pillar { label: string; desc: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent: string; anchor: string }
const PILLARS: Pillar[] = [
  { label: 'Governance', desc: 'Civic & electoral systems', icon: Scale, accent: '#6366F1', anchor: 'governance' },
  { label: 'Finance', desc: 'Sovereign banking rails', icon: Banknote, accent: '#10B981', anchor: 'finance' },
  { label: 'Mobility', desc: 'Logistics & transport', icon: Truck, accent: '#F59E0B', anchor: 'mobility' },
  { label: 'Intelligence', desc: 'AI cognition & knowledge', icon: Cpu, accent: '#7C4DFF', anchor: 'intelligence' },
  { label: 'Education', desc: 'Learning & credentials', icon: GraduationCap, accent: '#22D3EE', anchor: 'education' },
  { label: 'Commerce', desc: 'Markets & acquisition', icon: ShoppingCart, accent: '#00C2FF', anchor: 'commerce' },
  { label: 'Infrastructure', desc: 'Sovereign cloud & edge', icon: Server, accent: '#00E599', anchor: 'operations' },
];

// Hardcoded fallback so the LEFT flagship panel always renders, even
// when the ecosystem_products query returns nothing (fresh environment,
// transient DB outage, RLS misconfiguration). National Shell is the
// canonical flagship; this object mirrors the shape the query would
// have returned for slug='civicos-national-shell'.
const FALLBACK_FLAGSHIP: EcosystemProduct = {
  id: 'fallback-civicos-national-shell',
  slug: 'civicos-national-shell',
  name: 'CivicOS · National Shell',
  category: 'Sovereign government',
  tagline: 'A whole-of-government operating runtime — civic, electoral, fiscal and identity systems on one deployable spine.',
  description: null,
  capabilities: [],
  status: 'Operational',
  accent: '#00C2FF',
  source_project_ref: null,
  is_featured: true,
  sort_order: 0,
  metrics: [
    { label: 'Deployment value', value: 'Sovereign-scale' },
    { label: 'Scope',            value: 'Whole-of-government' },
    { label: 'Class',            value: 'Flagship infrastructure' },
  ],
};

// ── LEFT · sovereign acquisition terminal (driven by featured infrastructure) ──
const AcquisitionTerminal: React.FC<{ assets: EcosystemProduct[] }> = ({ assets }) => {
  const effective = assets.length > 0 ? assets : [FALLBACK_FLAGSHIP];
  const [flag, ...rest] = effective;
  const accent = flag.accent || '#00C2FF';
  const metrics = flagshipMetrics(flag);
  return (
    <div className="group/panel relative h-full flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.025] to-white/[0.008] p-8 sm:p-14 lg:p-16 overflow-hidden transition-colors hover:border-white/20">
      <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.6 }} />
      <span className="absolute -left-40 -top-40 w-[32rem] h-[32rem] rounded-full blur-[120px] opacity-[0.09] group-hover/panel:opacity-[0.16] transition-opacity duration-700" style={{ background: accent }} />
      <HudCorners color={accent} className="opacity-20 group-hover/panel:opacity-40 transition-opacity" />

      <div className="relative flex flex-col h-full">
        {/* command header — single quiet pulse, no second pill */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.28em] text-cyan-300/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live acquisition
          </span>
        </div>

        {/* flagship classification — one line, no secondary chip */}
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase tracking-[0.28em]" style={{ color: accent, opacity: 0.85 }}>Flagship · {flag.category}</span>
        </div>

        {/* dominant wordmark */}
        <Link to={`/systems/${flag.slug}`} className="group/name block">
          <h2 className="font-display text-[2.25rem] sm:text-5xl lg:text-6xl xl:text-[4rem] font-bold text-white tracking-cinematic leading-[0.95] mb-8 break-words group-hover/name:translate-x-0.5 transition-transform">
            {flag.name}
          </h2>
        </Link>
        <p className="text-white/55 leading-relaxed text-[16px] max-w-lg">{flag.tagline || 'A deployable sovereign institution, engineered for planetary scale.'}</p>

        {/* acquisition telemetry — quieter scale, more whitespace */}
        <div className="grid grid-cols-3 mt-14 pt-10 border-t border-white/8 gap-x-8">
          {metrics.map(([label, value], i) => (
            <div key={label}>
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35 mb-3">{label}</div>
              <div className="text-[26px] sm:text-[28px] font-semibold tabular-nums leading-none tracking-tight text-white" style={{ color: i === 0 ? accent : undefined, opacity: i === 0 ? 0.92 : 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* provenance signature — quiet institutional grounding */}
        <div className="mt-10 flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.32em] text-white/30">
          <span>Sovereign infrastructure</span>
          <span className="h-px flex-1 bg-white/8" />
          <span>Institutional acquisition</span>
        </div>

        {/* institutional CTA system */}
        <div className="flex flex-wrap items-center gap-3 mt-10">
          <Link to={`/systems/${flag.slug}`} className="group/cta inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)`, boxShadow: `0 16px 60px -28px ${accent}66` }}>
            Enter acquisition <ArrowUpRight className="w-4 h-4 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform" />
          </Link>
          <Link to={`/systems/${flag.slug}`} className="inline-flex items-center gap-2 px-6 py-3.5 text-white/55 text-[12px] font-mono uppercase tracking-[0.24em] transition-all duration-500 hover:text-white">
            <FileText className="w-3.5 h-3.5" /> Request sovereign review
          </Link>
        </div>

        {/* secondary strategic acquisitions — text-only rows, flagship dominates */}
        <div className="mt-auto pt-12">
          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/30 mb-1">Secondary acquisitions</div>
          {rest.slice(0, 4).map((p) => {
            const ac = p.accent || '#00C2FF';
            const val = deployValueOf(p);
            return (
              <Link key={p.id} to={`/systems/${p.slug}`} className="group/row relative flex items-center justify-between gap-4 py-4 border-t border-white/8 hover:border-white/20 transition-colors">
                <div className="min-w-0">
                  <div className="font-display text-xl font-bold text-white tracking-tight truncate group-hover/row:translate-x-0.5 transition-transform">{p.name}</div>
                  <div className="flex items-center gap-2.5 mt-1.5 text-[9px] font-mono uppercase tracking-[0.16em]">
                    <span style={{ color: ac }} className="truncate max-w-[14rem]">{p.category}</span>
                    <span className="text-white/25">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300/60"><span className="w-1 h-1 rounded-full bg-emerald-400" /> Acquisition ready</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-lg font-bold text-white tabular-nums leading-none">{val || '—'}</div>
                    <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/35 mt-1">Deployment value</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/25 group-hover/row:text-white group-hover/row:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
          <Link to="/marketplace" className="group inline-flex items-center gap-2 mt-7 text-[11px] font-mono uppercase tracking-[0.28em] text-white/40 hover:text-white transition">
            View all assets <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── RIGHT · operating architecture (quiet validation, supports the flagship) ──
const ArchitectureMatrix: React.FC = () => (
  <div className="group/panel relative h-full flex flex-col rounded-[1.6rem] border border-white/8 bg-white/[0.008] p-8 sm:p-9 overflow-hidden transition-colors hover:border-white/15">
    <span className="absolute -right-28 -top-28 w-72 h-72 rounded-full blur-[110px] opacity-[0.05] group-hover/panel:opacity-10 transition-opacity duration-700" style={{ background: '#7C4DFF' }} />

    <div className="relative flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 mb-7">
        <span className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.26em] text-white/45">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400/70" /> Operating architecture
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">7 domains</span>
      </div>
      <div className="font-display text-2xl sm:text-3xl font-bold text-white/90 tracking-tighter leading-[0.98] mb-7">
        One operating layer.<br /><span className="text-white/45">Seven domains.</span>
      </div>

      {/* connected module spine */}
      <div className="relative flex-1">
        <div className="absolute left-[25px] top-5 bottom-5 w-px bg-white/8" />
        <div className="absolute left-[25px] top-5 bottom-5 w-px overflow-hidden">
          <div className="w-px h-8 animate-flow-y" style={{ background: 'linear-gradient(to bottom, transparent, rgba(124,77,255,0.5), transparent)' }} />
        </div>
        <div className="relative flex flex-col justify-between h-full gap-2">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.label} to={`/ecosystem#${p.anchor}`} className="group/mod relative flex items-center gap-3.5 rounded-lg px-3 py-2.5 hover:bg-white/[0.025] transition-colors">
                <span className="relative z-10 w-11 h-11 shrink-0 rounded-lg flex items-center justify-center" style={{ background: '#0a1024', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon className="relative w-[18px] h-[18px]" style={{ color: p.accent, opacity: 0.85 }} />
                </span>
                <div className="relative min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white/85">{p.label}</div>
                  <div className="text-[11px] text-white/35 leading-snug">{p.desc}</div>
                </div>
                <ArrowRight className="relative w-3.5 h-3.5 text-white/15 group-hover/mod:text-white/50 group-hover/mod:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      <Link to="/ecosystem" className="group inline-flex items-center gap-2 mt-7 text-[11px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition">
        Explore the ecosystem <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  </div>
);

const EcosystemPanels: React.FC = () => {
  const [assets, setAssets] = useState<EcosystemProduct[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').in('slug', FEATURED_SLUGS);
      if (!data) return;
      const order = new Map(FEATURED_SLUGS.map((s, i) => [s, i]));
      setAssets([...(data as EcosystemProduct[])].sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99)));
    })();
  }, []);

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-28 sm:py-36 overflow-hidden">
      {/* subtle dark infrastructure grid */}
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(120,160,220,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,220,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 75% 85% at 42% 50%, #000 25%, transparent 88%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 85% at 42% 50%, #000 25%, transparent 88%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 50% at 32% 45%, rgba(0,160,255,0.05), transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <span className="kicker text-white/45" style={{ letterSpacing: '0.3em' }}>Sovereign infrastructure universe</span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
          <span className="kicker text-white/30 hidden sm:inline" style={{ fontSize: '10px', letterSpacing: '0.2em' }}>Acquire · Operate · Deploy</span>
        </div>
        <div className="grid lg:grid-cols-[1.62fr_1fr] gap-7 items-stretch">
          <AcquisitionTerminal assets={assets} />
          <ArchitectureMatrix />
        </div>
      </div>
    </section>
  );
};

export default EcosystemPanels;
