import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);

const Card: React.FC<{ d: Domain }> = ({ d }) => {
  const accent = ACCENT[d.category || ''] || '#00C2FF';
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="relative shrink-0 w-[300px] rounded-2xl border border-white/10 bg-white/[0.015] p-7 group hover:border-white/25 hover:bg-white/[0.03] transition-all overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] mb-6" style={{ color: accent }}>{d.category || 'sovereign'}</div>
      <div className="font-display text-2xl font-bold text-white tracking-tight truncate mb-1">{d.domain_name}</div>
      <div className="text-sm text-white/45 mb-10 truncate">{d.tagline || 'Deployable sovereign institution'}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-white tabular-nums leading-none">{price(Number(d.price_usd || 0))}</div>
          <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35 mt-2">Asking price</div>
        </div>
        <div className="text-right">
          <div className="text-base font-mono tabular-nums" style={{ color: accent }}>{d.valuation_score}</div>
          <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35 mt-1">AI score</div>
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
    <section className="py-32 sm:py-44 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Sovereign marketplace</div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.96] max-w-2xl">
            Acquire institutions, not domains.
          </h2>
          <Link to="/marketplace" className="group inline-flex items-center gap-2 text-white/70 hover:text-white font-medium transition shrink-0">
            View all assets <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="relative ticker-track">
        <div className="flex gap-5 px-5 animate-ticker w-max">
          {stream.map((d, i) => <Card key={`${d.id}-${i}`} d={d} />)}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28" style={{ background: 'linear-gradient(90deg, #050816, transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28" style={{ background: 'linear-gradient(270deg, #050816, transparent)' }} />
      </div>
    </section>
  );
};

export default MarketplaceRail;
