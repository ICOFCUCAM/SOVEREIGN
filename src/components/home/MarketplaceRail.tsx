import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import HudCorners from '@/components/HudCorners';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);
const tamOf = (d: Domain) => `$${(0.8 + Math.max(0, d.valuation_score - 80) * 0.35).toFixed(1)}B`;
const statusOf = (d: Domain) => ((d.inquiry_count || 0) > 0 ? 'In negotiation' : 'Available');

// Flagship asset — cinematic, editorial, the single dominant acquisition.
const Flagship: React.FC<{ d: Domain }> = ({ d }) => {
  const accent = ACCENT[d.category || ''] || '#00C2FF';
  const status = statusOf(d);
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="group relative block rounded-3xl border border-white/10 bg-white/[0.012] overflow-hidden hover:border-white/25 transition-all">
      <span className="absolute -left-24 -top-24 w-80 h-80 rounded-full blur-[110px] opacity-[0.14] group-hover:opacity-30 transition-opacity duration-700" style={{ background: accent }} />
      <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <HudCorners color={accent} className="opacity-30 group-hover:opacity-70 transition-opacity" />
      <div className="relative p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-7">
          <span className="text-[10px] font-mono uppercase tracking-[0.28em]" style={{ color: accent }}>Flagship · {d.category || 'sovereign'}</span>
          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/45">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === 'Available' ? '#10B981' : '#FFB547' }} /> {status}
          </span>
        </div>
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-end">
          <div>
            <div className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-[0.92] mb-5">{d.domain_name}</div>
            <p className="text-white/55 text-lg leading-relaxed max-w-lg">{d.tagline || 'A deployable sovereign institution — engineered for planetary scale.'}</p>
            <span className="inline-flex items-center gap-2 mt-7 text-white font-semibold">
              Enter acquisition <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" style={{ color: accent }} />
            </span>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-6 lg:gap-7 lg:border-l lg:border-white/10 lg:pl-12">
            <Metric label="AI valuation" value={<>{d.valuation_score}<span className="text-base text-white/40">/100</span></>} color={accent} />
            <Metric label="Projected market" value={tamOf(d)} />
            <Metric label="Asking price" value={price(Number(d.price_usd || 0))} />
          </div>
        </div>
      </div>
    </Link>
  );
};

const Metric: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <div>
    <div className="text-3xl lg:text-4xl font-bold tabular-nums leading-none" style={color ? { color } : { color: '#fff' }}>{value}</div>
    <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 mt-2">{label}</div>
  </div>
);

// Registry rows — editorial ledger, hairline-separated, no boxes.
const Row: React.FC<{ d: Domain; i: number }> = ({ d, i }) => {
  const accent = ACCENT[d.category || ''] || '#00C2FF';
  const status = statusOf(d);
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="group relative grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1.4fr_1fr_auto_auto] items-center gap-x-5 sm:gap-x-8 gap-y-2 px-2 sm:px-4 py-6 border-t border-white/8 hover:border-white/20 transition-colors">
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, ${accent}0c, transparent 40%)` }} />
      <span className="relative text-[11px] font-mono text-white/30 tabular-nums">{String(i + 2).padStart(2, '0')}</span>
      <div className="relative min-w-0">
        <div className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight truncate group-hover:translate-x-0.5 transition-transform">{d.domain_name}</div>
        <div className="flex items-center gap-2.5 mt-1">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: accent }}>{d.category || 'sovereign'}</span>
          <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-white/40">
            <span className="w-1 h-1 rounded-full" style={{ background: status === 'Available' ? '#10B981' : '#FFB547' }} /> {status}
          </span>
        </div>
      </div>
      {/* valuation bar */}
      <div className="relative hidden sm:block">
        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.16em] text-white/35 mb-1.5">
          <span>valuation</span><span className="text-white/60 tabular-nums">{d.valuation_score}</span>
        </div>
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <span className="block h-full rounded-full" style={{ width: `${d.valuation_score}%`, background: `linear-gradient(90deg, ${accent}99, ${accent})` }} />
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/30 mt-1.5">market {tamOf(d)}</div>
      </div>
      <div className="relative text-right">
        <div className="text-lg sm:text-xl font-bold text-white tabular-nums leading-none">{price(Number(d.price_usd || 0))}</div>
        <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/35 mt-1.5">asking</div>
      </div>
      <ArrowRight className="relative w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  );
};

const MarketplaceRail: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(5);
      setDomains((data || []) as Domain[]);
    })();
  }, []);
  if (domains.length === 0) return null;

  const [flagship, ...rest] = domains;

  return (
    <section className="py-32 sm:py-44 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">Sovereign marketplace</span>
            <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/30 to-transparent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Asset registry</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.96] max-w-2xl">
              Acquire institutions, not domains.
            </h2>
            <Link to="/marketplace" className="group inline-flex items-center gap-2 text-white/70 hover:text-white font-medium transition shrink-0">
              View all assets <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <Flagship d={flagship} />

        {rest.length > 0 && (
          <div className="mt-4">
            {rest.map((d, i) => <Row key={d.id} d={d} i={i} />)}
            <div className="border-t border-white/8" />
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketplaceRail;
