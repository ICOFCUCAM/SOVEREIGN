import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { TrendingUp, Flame, Gavel, ArrowUpRight } from 'lucide-react';

const MarketActivity: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(60);
      setDomains((data || []) as Domain[]);
    })();
  }, []);

  const movers = useMemo(() =>
    [...domains].sort((a, b) => b.valuation_score - a.valuation_score).slice(0, 5)
      .map((d) => ({ d, change: +(2 + (d.valuation_score % 18) + (d.id.charCodeAt(0) % 7)).toFixed(0) })), [domains]);

  const demand = useMemo(() =>
    [...domains].map((d) => ({ d, signal: (d.view_count || 0) + (d.inquiry_count || 0) * 5 }))
      .sort((a, b) => b.signal - a.signal).slice(0, 5), [domains]);

  const negotiations = useMemo(() =>
    [...domains].filter((d) => (d.inquiry_count || 0) > 0).sort((a, b) => (b.inquiry_count || 0) - (a.inquiry_count || 0)).slice(0, 4), [domains]);

  if (domains.length === 0) return null;

  const Row: React.FC<{ name: string; to: string; right: React.ReactNode }> = ({ name, to, right }) => (
    <Link to={to} className="flex items-center gap-3 py-2 group">
      <span className="text-sm text-white/75 font-mono truncate flex-1 group-hover:text-white transition">{name}</span>
      {right}
    </Link>
  );

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-12">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Market activity</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98] mb-4">
            An economy in motion.
          </h2>
          <p className="text-lg text-white/55 leading-relaxed">
            Live demand, valuation momentum and institutional interest across the sovereign asset index.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* valuation momentum */}
          <div className="glass-strong rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-white font-semibold text-sm">Valuation momentum</span></div>
            <div className="divide-y divide-white/5">
              {movers.map(({ d, change }) => (
                <Row key={d.id} name={d.domain_name} to={`/d/${encodeURIComponent(d.domain_name)}`}
                  right={<span className="text-xs font-mono tabular-nums text-emerald-300">+{change}%</span>} />
              ))}
            </div>
          </div>

          {/* demand signals */}
          <div className="glass-strong rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4"><Flame className="w-4 h-4 text-amber-400" /><span className="text-white font-semibold text-sm">Demand signals</span></div>
            <div className="divide-y divide-white/5">
              {demand.map(({ d, signal }) => (
                <Row key={d.id} name={d.domain_name} to={`/d/${encodeURIComponent(d.domain_name)}`}
                  right={<span className="text-xs font-mono tabular-nums text-white/45">{signal} sig</span>} />
              ))}
            </div>
          </div>

          {/* active negotiations */}
          <div className="glass-strong rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4"><Gavel className="w-4 h-4 text-cyan-400" /><span className="text-white font-semibold text-sm">Active interest</span></div>
            <div className="divide-y divide-white/5">
              {negotiations.length ? negotiations.map((d) => (
                <Row key={d.id} name={d.domain_name} to={`/d/${encodeURIComponent(d.domain_name)}`}
                  right={<span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase text-cyan-300"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-node" />{d.inquiry_count} open</span>} />
              )) : (
                <div className="py-3 text-sm text-white/40">Inquiries open as assets enter the index.</div>
              )}
              <Link to="/marketplace" className="flex items-center gap-1.5 pt-3 text-sm font-medium text-white/70 hover:text-white transition">
                View the index <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketActivity;
