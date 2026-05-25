import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { Landmark, Scale, Truck, Vote, Cpu, ShoppingCart, ArrowRight } from 'lucide-react';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  govtech: Scale, fintech: Landmark, ai: Cpu, logistics: Truck, infra: ShoppingCart, saas: Vote,
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);

const Gauge: React.FC<{ score: number; accent: string }> = ({ score, accent }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="relative w-[70px] h-[70px]">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white tabular-nums">{score}</span>
      </div>
    </div>
  );
};

const Card: React.FC<{ d: Domain }> = ({ d }) => {
  const accent = ACCENT[d.category || ''] || '#00C2FF';
  const Icon = ICON[d.category || ''] || Landmark;
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="relative shrink-0 w-[210px] rounded-2xl border border-white/10 bg-white/[0.015] p-5 text-center group hover:border-white/25 hover:bg-white/[0.03] transition-all">
      <span className="absolute -top-14 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity" style={{ background: accent }} />
      <div className="relative flex flex-col items-center">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${accent}1f`, border: `1px solid ${accent}33` }}><Icon className="w-4 h-4" style={{ color: accent }} /></span>
        <div className="text-base font-bold text-white tracking-tight truncate max-w-full">{d.domain_name}</div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-4">{d.category || 'sovereign'}</div>
        <Gauge score={d.valuation_score} accent={accent} />
        <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1.5 mb-4">AI Score</div>
        <div className="w-full pt-3 border-t border-white/5">
          <div className="text-lg font-bold text-white tabular-nums">{price(Number(d.price_usd || 0))}</div>
          <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1">Asking Price</div>
        </div>
      </div>
    </Link>
  );
};

const MarketplaceRail: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(12);
      setDomains((data || []) as Domain[]);
    })();
  }, []);
  if (domains.length === 0) return null;
  const stream = [...domains, ...domains];

  return (
    <section className="py-24 sm:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-4">Sovereign marketplace</div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.96]">Acquire. Deploy. Govern.</h2>
          <Link to="/marketplace" className="group inline-flex items-center gap-2 text-white/70 hover:text-white font-medium transition shrink-0">
            View all assets <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="relative ticker-track">
        <div className="flex gap-4 px-4 animate-ticker w-max">
          {stream.map((d, i) => <Card key={`${d.id}-${i}`} d={d} />)}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24" style={{ background: 'linear-gradient(90deg, #050816, transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24" style={{ background: 'linear-gradient(270deg, #050816, transparent)' }} />
      </div>
    </section>
  );
};

export default MarketplaceRail;
