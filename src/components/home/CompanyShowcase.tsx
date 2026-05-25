import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';

const monogram = (name: string) => name.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase();

const CompanyCard: React.FC<{ d: Domain; reverse?: boolean }> = ({ d, reverse }) => {
  const primary = d.brand_color || '#00D9FF';
  const accent = d.accent_color || '#7C3AED';
  return (
    <div className={`grid lg:grid-cols-2 gap-8 items-center ${reverse ? 'lg:[direction:rtl]' : ''}`}>
      <div className="lg:[direction:ltr]">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/40 mb-3">{d.category} · score {d.valuation_score}</div>
        <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">{d.domain_name}</h3>
        <p className="text-white/55 text-lg leading-relaxed mb-6 max-w-md">{d.tagline}</p>
        <Link to={`/studio/${encodeURIComponent(d.domain_name)}`}
          className="group inline-flex items-center gap-2 text-white font-semibold">
          See it become a company
          <ArrowUpRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Faux company surface */}
      <div className="lg:[direction:ltr] relative">
        <div className="absolute -inset-4 rounded-3xl blur-[70px] opacity-25" style={{ background: `radial-gradient(circle, ${primary}, transparent 70%)` }} />
        <div className="relative rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#070A18' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>{monogram(d.domain_name)}</div>
              <span className="text-white text-xs font-semibold">{d.domain_name}</span>
            </div>
            <div className="px-2 py-0.5 rounded text-[9px] font-mono text-white" style={{ background: primary }}>Live</div>
          </div>
          <div className="p-6 relative overflow-hidden">
            <div className="absolute -top-12 right-0 w-48 h-48 rounded-full blur-[80px] opacity-40" style={{ background: primary }} />
            <div className="relative">
              <div className="text-2xl font-bold text-white mb-1.5 max-w-[14rem] leading-tight">{d.tagline}</div>
              <div className="text-white/40 text-sm mb-5">{d.description?.slice(0, 70) || 'Sovereign-grade platform'}…</div>
              <div className="grid grid-cols-3 gap-2">
                {['Revenue', 'Active', 'Regions'].map((l, i) => (
                  <div key={l} className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/40">{l}</div>
                    <div className="text-sm font-bold text-white tabular-nums">{['$1.2M', '4.8k', '14'][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyShowcase: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(3);
      setDomains((data || []) as Domain[]);
    })();
  }, []);

  if (domains.length === 0) return null;

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter text-white mb-4">What they could become.</h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">Every domain in the registry is one decision away from being a live company.</p>
        </div>
        <div className="space-y-24 sm:space-y-32">
          {domains.map((d, i) => <CompanyCard key={d.id} d={d} reverse={i % 2 === 1} />)}
        </div>
      </div>
    </section>
  );
};

export default CompanyShowcase;
