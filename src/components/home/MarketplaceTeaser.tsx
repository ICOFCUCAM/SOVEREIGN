import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);

const Card: React.FC<{ d: Domain }> = ({ d }) => {
  const accent = ACCENT[d.category || ''] || '#00C2FF';
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="group relative shrink-0 w-[240px] rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 hover:border-white/25 hover:bg-white/[0.04] transition-all overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: accent }}>{d.category || 'sovereign'}</span>
        <span className="text-[10px] font-mono tabular-nums text-white/45">AI {d.valuation_score}</span>
      </div>
      <div className="font-display text-lg font-bold text-white tracking-tight truncate">{d.domain_name}</div>
      <div className="text-sm text-white/55 tabular-nums mt-1">{price(Number(d.price_usd || 0))}</div>
    </Link>
  );
};

const MarketplaceTeaser: React.FC = () => {
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
    <section className="relative py-7 border-y border-white/10 bg-black/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-5">
        <span className="inline-flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/70">
          <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Featured sovereign assets</span>
          <span className="text-white/30">·</span>
          <span className="text-white/40 tabular-nums">{domains.length} live</span>
        </span>
        <Link to="/marketplace" className="text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition">Marketplace →</Link>
      </div>
      <div className="relative ticker-track">
        <div className="flex gap-4 px-4 animate-ticker w-max">
          {stream.map((d, i) => <Card key={`${d.id}-${i}`} d={d} />)}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20" style={{ background: 'linear-gradient(90deg, #050816, transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20" style={{ background: 'linear-gradient(270deg, #050816, transparent)' }} />
      </div>
    </section>
  );
};

export default MarketplaceTeaser;
