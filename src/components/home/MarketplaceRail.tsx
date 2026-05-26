import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import HudCorners from '@/components/HudCorners';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`);

const Card: React.FC<{ d: Domain }> = ({ d }) => {
  const accent = ACCENT[d.category || ''] || '#00C2FF';
  const tam = `$${(0.8 + Math.max(0, d.valuation_score - 80) * 0.35).toFixed(1)}B`;
  const status = (d.inquiry_count || 0) > 0 ? 'In negotiation' : 'Available';
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="group relative block rounded-2xl border border-white/10 bg-white/[0.015] overflow-hidden hover:border-white/25 transition-all">
      <span className="absolute -left-20 top-1/2 -translate-y-1/2 w-60 h-60 rounded-full blur-[90px] opacity-10 group-hover:opacity-25 transition-opacity" style={{ background: accent }} />
      <HudCorners color={accent} className="opacity-25 group-hover:opacity-60 transition-opacity" />
      <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 p-8 sm:p-10 items-center">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: accent }}>{d.category || 'sovereign'}</span>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/45">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === 'Available' ? '#10B981' : '#FFB547' }} /> {status}
            </span>
          </div>
          <div className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">{d.domain_name}</div>
          <p className="text-white/50 leading-relaxed max-w-md">{d.tagline || 'Deployable sovereign institution'}</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-1 md:gap-5 gap-4 md:border-l md:border-white/10 md:pl-8">
          <div>
            <div className="text-2xl font-bold tabular-nums leading-none" style={{ color: accent }}>{d.valuation_score}<span className="text-sm text-white/40">/100</span></div>
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">AI valuation</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums leading-none">{tam}</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">Projected market</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums leading-none">{price(Number(d.price_usd || 0))}</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">Asking price</div>
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
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(4);
      setDomains((data || []) as Domain[]);
    })();
  }, []);
  if (domains.length === 0) return null;

  return (
    <section className="py-32 sm:py-44 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
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

        <div className="space-y-5">
          {domains.map((d) => <Card key={d.id} d={d} />)}
        </div>
      </div>
    </section>
  );
};

export default MarketplaceRail;
