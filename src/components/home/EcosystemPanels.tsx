import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { ArrowRight, ArrowUpRight, Scale, Banknote, Truck, Cpu, GraduationCap, ShoppingCart, Server } from 'lucide-react';
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

const PanelHead: React.FC<{ kicker: string; to: string; cta: string }> = ({ kicker, to, cta }) => (
  <div className="flex items-center justify-between gap-4 mb-5">
    <span className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.26em] text-cyan-300/70">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-node" /> {kicker}
    </span>
    <Link to={to} className="group inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition shrink-0">
      {cta} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  </div>
);

// ── Left: sovereign acquisition economy ──
const MarketplacePanel: React.FC<{ domains: Domain[] }> = ({ domains }) => {
  if (domains.length === 0) return null;
  const [flag, ...rest] = domains;
  const accent = ACCENT[flag.category || ''] || '#00C2FF';
  return (
    <div className="group/panel relative h-full flex flex-col rounded-2xl border border-white/10 bg-white/[0.015] p-6 sm:p-7 overflow-hidden transition-colors hover:border-white/20">
      <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -left-24 -top-24 w-72 h-72 rounded-full blur-[90px] opacity-[0.1] group-hover/panel:opacity-20 transition-opacity duration-700" style={{ background: accent }} />
      <HudCorners color={accent} className="opacity-25 group-hover/panel:opacity-50 transition-opacity" />

      <div className="relative flex flex-col h-full">
        <PanelHead kicker="Sovereign marketplace" to="/marketplace" cta="All assets" />

        {/* flagship */}
        <Link to={`/d/${encodeURIComponent(flag.domain_name)}`} className="group block">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[9px] font-mono uppercase tracking-[0.24em]" style={{ color: accent }}>Flagship · {flag.category || 'sovereign'}</span>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/45">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusOf(flag) === 'Available' ? '#10B981' : '#FFB547' }} /> {statusOf(flag)}
            </span>
          </div>
          <div className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tighter leading-[0.95] mb-2.5 group-hover:translate-x-0.5 transition-transform">{flag.domain_name}</div>
          <p className="text-white/50 leading-relaxed text-sm max-w-md">{flag.tagline || 'A deployable sovereign institution, engineered for planetary scale.'}</p>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/8">
            <div><div className="text-2xl font-bold tabular-nums leading-none" style={{ color: accent }}>{flag.valuation_score}<span className="text-sm text-white/40">/100</span></div><div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">AI valuation</div></div>
            <div><div className="text-2xl font-bold text-white tabular-nums leading-none">{tamOf(flag)}</div><div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">Market</div></div>
            <div><div className="text-2xl font-bold text-white tabular-nums leading-none">{price(Number(flag.price_usd || 0))}</div><div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">Asking</div></div>
          </div>
          <span className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-white">Enter acquisition <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" style={{ color: accent }} /></span>
        </Link>

        {/* registry rows fill remaining height */}
        <div className="mt-auto pt-5">
          {rest.slice(0, 3).map((d) => {
            const ac = ACCENT[d.category || ''] || '#00C2FF';
            return (
              <Link key={d.id} to={`/d/${encodeURIComponent(d.domain_name)}`}
                className="group/row relative flex items-center justify-between gap-4 py-3 border-t border-white/8 hover:border-white/20 transition-colors">
                <div className="min-w-0">
                  <div className="font-display text-base font-bold text-white tracking-tight truncate group-hover/row:translate-x-0.5 transition-transform">{d.domain_name}</div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: ac }}>{d.category || 'sovereign'}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-white tabular-nums">{price(Number(d.price_usd || 0))}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover/row:text-white group-hover/row:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Right: the operating layer ──
const EcosystemPanel: React.FC = () => (
  <div className="group/panel relative h-full flex flex-col rounded-2xl border border-white/10 bg-white/[0.015] p-6 sm:p-7 overflow-hidden transition-colors hover:border-white/20">
    <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #7C4DFF, transparent)' }} />
    <span className="absolute -right-24 -top-24 w-72 h-72 rounded-full blur-[90px] opacity-[0.1] group-hover/panel:opacity-20 transition-opacity duration-700" style={{ background: '#7C4DFF' }} />
    <HudCorners color="#7C4DFF" className="opacity-25 group-hover/panel:opacity-50 transition-opacity" />

    <div className="relative flex flex-col h-full">
      <PanelHead kicker="The sovereign ecosystem" to="/ecosystem" cta="Explore" />
      <div className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tighter leading-[0.98] mb-6">
        One operating layer.<br />Seven domains.
      </div>

      {/* domain spine — connector with a travelling signal pulse */}
      <div className="relative flex-1">
        <div className="absolute left-[23px] top-4 bottom-4 w-px bg-white/10" />
        <div className="absolute left-[23px] top-4 bottom-4 w-px overflow-hidden">
          <div className="w-px h-6 animate-flow-y" style={{ background: 'linear-gradient(to bottom, transparent, #7C4DFF, transparent)' }} />
        </div>
        <div className="relative flex flex-col justify-between h-full gap-1">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.label} to={`/ecosystem#${p.anchor}`} className="group/dom relative flex items-center gap-4 py-2 rounded-xl hover:bg-white/[0.025] transition-colors">
                <span className="relative z-10 w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover/dom:-translate-y-px"
                  style={{ background: '#0a1024', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="absolute inset-0 rounded-xl blur-md opacity-0 group-hover/dom:opacity-50 transition-opacity" style={{ background: p.accent }} />
                  <span className="absolute -inset-px rounded-xl border opacity-25" style={{ borderColor: `${p.accent}66` }} />
                  <Icon className="relative w-5 h-5" style={{ color: p.accent }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{p.label}</div>
                  <div className="text-[11px] text-white/40 leading-snug">{p.desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover/dom:text-white/70 group-hover/dom:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const EcosystemPanels: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(4);
      setDomains((data || []) as Domain[]);
    })();
  }, []);

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-24 overflow-hidden">
      {/* subtle dark infrastructure grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.5]" style={{ backgroundImage: 'linear-gradient(rgba(120,160,220,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,220,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 85%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 85%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,160,255,0.05), transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/45">Sovereign operating universe</span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
        </div>
        <div className="grid lg:grid-cols-2 gap-5 items-stretch">
          <MarketplacePanel domains={domains} />
          <EcosystemPanel />
        </div>
      </div>
    </section>
  );
};

export default EcosystemPanels;
