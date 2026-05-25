import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import DomainCard from '@/components/DomainCard';
import { ArrowRight, LayoutGrid } from 'lucide-react';

const MarketplacePreview: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [count, setCount] = useState(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false });
      const rows = (data || []) as Domain[];
      setCount(rows.length);
      setValue(rows.reduce((s, r) => s + Number(r.price_usd || 0), 0));
      const featured = rows.filter((r) => r.is_featured);
      setDomains((featured.length ? featured : rows).slice(0, 6));
    })();
  }, []);

  if (domains.length === 0) return null;

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Sovereign marketplace · live inventory</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98] mb-4">
              Acquire deployable institutions.
            </h2>
            <p className="text-lg text-white/55 max-w-xl leading-relaxed">
              Premium domains pre-engineered into sovereign systems — AI-scored, deployment-ready, available now.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums leading-none">{count.toLocaleString()}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1.5">Assets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tabular-nums leading-none">${(value / 1e6).toFixed(1)}M</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1.5">Indexed value</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {domains.map((d) => <DomainCard key={d.id} domain={d} />)}
        </div>

        <Link to="/marketplace" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 36px rgba(0,194,255,0.25)' }}>
          <LayoutGrid className="w-4 h-4" /> Enter the marketplace
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};

export default MarketplacePreview;
