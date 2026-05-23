import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import DomainCard from '@/components/DomainCard';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const CATEGORIES = ['all', 'fintech', 'ai', 'infra', 'govtech', 'saas', 'logistics'];

const MarketplacePage: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<'score' | 'price_low' | 'price_high'>('score');
  const [tier, setTier] = useState<'all' | 'premium'>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').order('valuation_score', { ascending: false });
      setDomains((data || []) as Domain[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = domains.filter(d =>
      (cat === 'all' || d.category === cat) &&
      (tier === 'all' || d.is_premium) &&
      (q === '' || d.domain_name.toLowerCase().includes(q.toLowerCase()) || (d.tagline || '').toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === 'price_low') list.sort((a,b) => a.price_usd - b.price_usd);
    if (sort === 'price_high') list.sort((a,b) => b.price_usd - a.price_usd);
    if (sort === 'score') list.sort((a,b) => b.valuation_score - a.valuation_score);
    return list;
  }, [domains, q, cat, sort, tier]);

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <PlatformNav />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="inline-block px-3 py-1 rounded-full glass mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">Sovereign Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
              The premium digital asset <span className="text-gradient-cyan">inventory.</span>
            </h1>
            <p className="text-white/50 max-w-2xl">
              {domains.length} curated domains · AI-scored · sovereign-grade · deployment-ready
            </p>
          </div>

          {/* Filter bar */}
          <div className="glass-strong rounded-2xl p-4 mb-8 sticky top-20 z-20">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search domains, tags, narratives..."
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCat(c)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition whitespace-nowrap ${
                      cat === c ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}>{c}</button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setTier(tier === 'all' ? 'premium' : 'all')}
                  className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 ${
                    tier === 'premium' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}>
                  <SlidersHorizontal className="w-3 h-3" />
                  Premium
                </button>
                <select value={sort} onChange={e => setSort(e.target.value as any)}
                  className="px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-white/5 text-white/80 border border-white/10 focus:border-cyan-400/50 focus:outline-none">
                  <option value="score">Sort: Score</option>
                  <option value="price_high">Sort: Price ↓</option>
                  <option value="price_low">Sort: Price ↑</option>
                </select>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-white/40 font-mono">{filtered.length} of {domains.length} assets · filtered</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE INVENTORY</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({length:6}).map((_,i)=>(<div key={i} className="glass rounded-2xl h-64 animate-pulse" />))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <div className="text-white font-semibold">No assets match those filters</div>
              <div className="text-white/40 text-sm mt-1">Adjust filters or run an AI valuation on a custom domain.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(d => <DomainCard key={d.id} domain={d} />)}
            </div>
          )}
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
};

export default MarketplacePage;
