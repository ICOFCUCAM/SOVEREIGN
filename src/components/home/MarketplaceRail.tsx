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
  const status = d.is_premium ? 'Deployable' : 'Listed';
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="relative shrink-0 w-[270px] rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden group hover:border-white/25 transition-all">
      <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: accent }} />
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded" style={{ background: `${accent}1f`, color: accent }}>{d.category || 'sovereign'}</span>
          <span className="inline-flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-emerald-300/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> {status}
          </span>
        </div>
        <div className="text-xl font-bold text-white tracking-tight mb-5 truncate">{d.domain_name}</div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 mb-1">AI score</div>
            <div className="text-sm font-mono font-semibold tabular-nums" style={{ color: accent }}>{d.valuation_score}/100</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 mb-1">Valuation</div>
            <div className="text-sm font-mono font-semibold text-white tabular-nums">{price(Number(d.price_usd || 0))}</div>
          </div>
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
    <section className="relative py-6 border-y border-white/10 bg-black/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-5">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live marketplace · sovereign assets
        </div>
        <Link to="/marketplace" className="text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition">View all →</Link>
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

export default MarketplaceRail;
