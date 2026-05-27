import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { ArrowRight, ArrowUpRight, FileText, Scale, Banknote, Truck, Cpu, GraduationCap, ShoppingCart, Server } from 'lucide-react';
import HudCorners from '@/components/HudCorners';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);
const tamOf = (d: Domain) => `$${(0.8 + Math.max(0, d.valuation_score - 80) * 0.35).toFixed(1)}B`;
const statusOf = (d: Domain) => ((d.inquiry_count || 0) > 0 ? 'In negotiation' : 'Available');
const regionsOf = (d: Domain) => 4 + ((d.domain_name.length * 3 + d.valuation_score) % 16);

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

// ── LEFT · sovereign acquisition terminal (the dominant centerpiece) ──
const AcquisitionTerminal: React.FC<{ domains: Domain[] }> = ({ domains }) => {
  if (domains.length === 0) return null;
  const [flag, ...rest] = domains;
  const accent = ACCENT[flag.category || ''] || '#00C2FF';
  const metrics: Array<[string, React.ReactNode, string?]> = [
    ['AI valuation', <>{flag.valuation_score}<span className="text-lg text-white/35">/100</span></>, accent],
    ['Projected market', tamOf(flag)],
    ['Asking', price(Number(flag.price_usd || 0))],
  ];
  return (
    <div className="group/panel relative h-full flex flex-col rounded-[1.6rem] border border-white/12 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-7 sm:p-12 lg:p-14 overflow-hidden transition-colors hover:border-white/22">
      <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -left-32 -top-32 w-[28rem] h-[28rem] rounded-full blur-[110px] opacity-[0.14] group-hover/panel:opacity-25 transition-opacity duration-700" style={{ background: accent }} />
      <HudCorners color={accent} className="opacity-30 group-hover/panel:opacity-60 transition-opacity" />

      <div className="relative flex flex-col h-full">
        {/* command header */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <span className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-300/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live acquisition
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">AI-brokered</span>
        </div>

        {/* flagship classification */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] font-mono uppercase tracking-[0.26em]" style={{ color: accent }}>Flagship · {flag.category || 'sovereign'}</span>
          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/45">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusOf(flag) === 'Available' ? '#10B981' : '#FFB547' }} /> {statusOf(flag)}
          </span>
        </div>

        {/* dominant wordmark */}
        <Link to={`/d/${encodeURIComponent(flag.domain_name)}`} className="group/name block">
          <h2 className="font-display text-[2rem] sm:text-6xl lg:text-7xl xl:text-[5.25rem] font-bold text-white tracking-cinematic leading-[0.9] mb-5 break-words group-hover/name:translate-x-0.5 transition-transform" style={{ textShadow: `0 0 80px ${accent}22` }}>{flag.domain_name}</h2>
        </Link>
        <p className="text-white/55 leading-relaxed text-lg max-w-md mb-2">{flag.tagline || 'A deployable sovereign institution, engineered for planetary scale.'}</p>

        {/* acquisition telemetry — open, editorial, hairline-separated */}
        <div className="grid grid-cols-3 mt-10 pt-8 border-t border-white/10">
          {metrics.map(([label, value, color], i) => (
            <div key={label as string} className={i === 0 ? 'pr-5' : 'px-5 border-l border-white/8 last:pr-0'}>
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35 mb-2.5">{label}</div>
              <div className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tabular-nums leading-none tracking-tight" style={{ color: (color as string) || '#fff' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* institutional CTA system */}
        <div className="flex flex-wrap items-center gap-3 mt-9">
          <Link to={`/d/${encodeURIComponent(flag.domain_name)}`} className="group/cta inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)`, boxShadow: `0 14px 40px -12px ${accent}66` }}>
            Enter acquisition <ArrowUpRight className="w-4 h-4 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform" />
          </Link>
          <Link to={`/d/${encodeURIComponent(flag.domain_name)}`} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 bg-white/[0.02] text-white/80 text-sm font-semibold ease-cinematic transition-all duration-500 hover:bg-white/5 hover:text-white hover:border-white/25 hover:-translate-y-0.5">
            <FileText className="w-4 h-4 text-cyan-300/70" /> Request sovereign review
          </Link>
        </div>

        {/* secondary strategic acquisitions — present but subordinate */}
        <div className="mt-auto pt-10">
          <div className="text-[9px] font-mono uppercase tracking-[0.26em] text-white/30 mb-2">Secondary acquisitions</div>
          {rest.slice(0, 2).map((d) => {
            const ac = ACCENT[d.category || ''] || '#00C2FF';
            return (
              <Link key={d.id} to={`/d/${encodeURIComponent(d.domain_name)}`} className="group/row relative flex items-center justify-between gap-4 py-4 border-t border-white/8 hover:border-white/20 transition-colors">
                <div className="min-w-0">
                  <div className="font-display text-xl font-bold text-white tracking-tight truncate group-hover/row:translate-x-0.5 transition-transform">{d.domain_name}</div>
                  <div className="flex items-center gap-2.5 mt-1.5 text-[9px] font-mono uppercase tracking-[0.16em]">
                    <span style={{ color: ac }}>{d.category || 'sovereign'}</span>
                    <span className="text-white/25">·</span>
                    <span className="text-white/40">AI {d.valuation_score}</span>
                    <span className="text-white/25">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300/60"><span className="w-1 h-1 rounded-full bg-emerald-400" /> {regionsOf(d)} regions</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-lg font-bold text-white tabular-nums leading-none">{price(Number(d.price_usd || 0))}</div>
                    <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/35 mt-1">acquisition</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/25 group-hover/row:text-white group-hover/row:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
          <Link to="/marketplace" className="group inline-flex items-center gap-2 mt-6 text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition">
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
  const [domains, setDomains] = useState<Domain[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(3);
      setDomains((data || []) as Domain[]);
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
          <AcquisitionTerminal domains={domains} />
          <ArchitectureMatrix />
        </div>
      </div>
    </section>
  );
};

export default EcosystemPanels;
