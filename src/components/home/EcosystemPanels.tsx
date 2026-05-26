import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { ArrowRight, ArrowUpRight, TrendingUp, Scale, Banknote, Truck, Cpu, GraduationCap, ShoppingCart, Server } from 'lucide-react';
import HudCorners from '@/components/HudCorners';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);
const tamOf = (d: Domain) => `$${(0.8 + Math.max(0, d.valuation_score - 80) * 0.35).toFixed(1)}B`;
const statusOf = (d: Domain) => ((d.inquiry_count || 0) > 0 ? 'In negotiation' : 'Available');

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

// ── LEFT · sovereign acquisition terminal ──
const AcquisitionTerminal: React.FC<{ domains: Domain[] }> = ({ domains }) => {
  if (domains.length === 0) return null;
  const [flag, ...rest] = domains;
  const accent = ACCENT[flag.category || ''] || '#00C2FF';
  return (
    <div className="group/panel relative h-full flex flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.014] p-8 sm:p-10 overflow-hidden transition-colors hover:border-white/20">
      <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -left-28 -top-28 w-80 h-80 rounded-full blur-[100px] opacity-[0.1] group-hover/panel:opacity-20 transition-opacity duration-700" style={{ background: accent }} />
      <HudCorners color={accent} className="opacity-25 group-hover/panel:opacity-50 transition-opacity" />

      <div className="relative flex flex-col h-full">
        {/* command header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <span className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.26em] text-cyan-300/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live acquisition
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">AI-brokered</span>
        </div>

        {/* flagship — dominant focal block */}
        <Link to={`/d/${encodeURIComponent(flag.domain_name)}`} className="group block">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em]" style={{ color: accent }}>Flagship · {flag.category || 'sovereign'}</span>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/45">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusOf(flag) === 'Available' ? '#10B981' : '#FFB547' }} /> {statusOf(flag)}
            </span>
          </div>
          <div className="font-display text-[2.1rem] sm:text-5xl lg:text-7xl font-bold text-white tracking-tighter leading-[0.92] mb-4 break-words group-hover:translate-x-0.5 transition-transform">{flag.domain_name}</div>
          <p className="text-white/55 leading-relaxed text-base sm:text-lg max-w-md">{flag.tagline || 'A deployable sovereign institution, engineered for planetary scale.'}</p>

          {/* terminal readout */}
          <div className="grid grid-cols-3 mt-8 rounded-2xl border border-white/10 bg-black/30 overflow-hidden divide-x divide-white/8">
            <div className="px-3 sm:px-4 py-5"><div className="text-xl sm:text-3xl font-bold tabular-nums leading-none" style={{ color: accent }}>{flag.valuation_score}<span className="text-sm sm:text-base text-white/40">/100</span></div><div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-2">AI valuation</div></div>
            <div className="px-3 sm:px-4 py-5"><div className="text-xl sm:text-3xl font-bold text-white tabular-nums leading-none">{tamOf(flag)}</div><div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-2">Market</div></div>
            <div className="px-3 sm:px-4 py-5"><div className="text-xl sm:text-3xl font-bold text-white tabular-nums leading-none">{price(Number(flag.price_usd || 0))}</div><div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-2">Asking</div></div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-7">
            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-all group-hover:-translate-y-px" style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)`, boxShadow: `0 0 32px ${accent}33` }}>
              Enter acquisition <ArrowUpRight className="w-4 h-4" />
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-white/55"><TrendingUp className="w-4 h-4 text-amber-400" /> Make an offer</span>
          </div>
        </Link>

        {/* secondary assets */}
        <div className="mt-auto pt-7">
          {rest.slice(0, 2).map((d) => {
            const ac = ACCENT[d.category || ''] || '#00C2FF';
            return (
              <Link key={d.id} to={`/d/${encodeURIComponent(d.domain_name)}`} className="group/row relative flex items-center justify-between gap-4 py-4 border-t border-white/8 hover:border-white/20 transition-colors">
                <div className="min-w-0">
                  <div className="font-display text-lg font-bold text-white tracking-tight truncate group-hover/row:translate-x-0.5 transition-transform">{d.domain_name}</div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: ac }}>{d.category || 'sovereign'} · AI {d.valuation_score}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-base font-bold text-white tabular-nums">{price(Number(d.price_usd || 0))}</span>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover/row:text-white group-hover/row:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
          <Link to="/marketplace" className="group inline-flex items-center gap-2 mt-5 text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition">
            View all assets <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── RIGHT · operating architecture matrix ──
const ArchitectureMatrix: React.FC = () => (
  <div className="group/panel relative h-full flex flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.014] p-8 sm:p-10 overflow-hidden transition-colors hover:border-white/20">
    <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #7C4DFF, transparent)' }} />
    <span className="absolute -right-28 -top-28 w-80 h-80 rounded-full blur-[100px] opacity-[0.1] group-hover/panel:opacity-20 transition-opacity duration-700" style={{ background: '#7C4DFF' }} />
    <HudCorners color="#7C4DFF" className="opacity-25 group-hover/panel:opacity-50 transition-opacity" />

    <div className="relative flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 mb-8">
        <span className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.26em] text-violet-300/70">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-node" /> Operating architecture
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">7 domains</span>
      </div>
      <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tighter leading-[0.95] mb-8">
        One operating layer.<br /><span className="text-gradient-cyan">Seven domains.</span>
      </div>

      {/* connected module spine */}
      <div className="relative flex-1">
        <div className="absolute left-[27px] top-5 bottom-5 w-px bg-white/10" />
        <div className="absolute left-[27px] top-5 bottom-5 w-px overflow-hidden">
          <div className="w-px h-8 animate-flow-y" style={{ background: 'linear-gradient(to bottom, transparent, #7C4DFF, transparent)' }} />
        </div>
        <div className="relative flex flex-col justify-between h-full gap-2.5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.label} to={`/ecosystem#${p.anchor}`} className="group/mod relative flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.01] px-3.5 py-3 hover:border-white/20 hover:bg-white/[0.03] transition-all">
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover/mod:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${p.accent}0f, transparent 60%)` }} />
                <span className="relative z-10 w-12 h-12 shrink-0 rounded-lg flex items-center justify-center transition-transform group-hover/mod:-translate-y-px" style={{ background: '#0a1024', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="absolute inset-0 rounded-lg blur-md opacity-0 group-hover/mod:opacity-50 transition-opacity" style={{ background: p.accent }} />
                  <Icon className="relative w-5 h-5" style={{ color: p.accent }} />
                </span>
                <div className="relative min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{p.label}</div>
                  <div className="text-[11px] text-white/40 leading-snug">{p.desc}</div>
                </div>
                <ArrowRight className="relative w-3.5 h-3.5 text-white/20 group-hover/mod:text-white/70 group-hover/mod:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      <Link to="/ecosystem" className="group inline-flex items-center gap-2 mt-7 text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition">
        Explore the ecosystem <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  </div>
);

const EcosystemPanels: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(3);
      setDomains((data || []) as Domain[]);
    })();
  }, []);

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-32 overflow-hidden">
      {/* subtle dark infrastructure grid */}
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(120,160,220,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,220,0.035) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse 75% 85% at 50% 50%, #000 25%, transparent 88%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 85% at 50% 50%, #000 25%, transparent 88%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 35%, rgba(0,160,255,0.045), transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/45">Sovereign operating universe</span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Acquire · Operate · Deploy</span>
        </div>
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-stretch">
          <AcquisitionTerminal domains={domains} />
          <ArchitectureMatrix />
        </div>
      </div>
    </section>
  );
};

export default EcosystemPanels;
