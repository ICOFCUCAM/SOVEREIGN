import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import DomainCard from './DomainCard';

const FeaturedDomains: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }).limit(6);
      setDomains((data || []) as Domain[]);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full glass mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-300">Trending Inventory</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white">Premium digital assets</h2>
            <p className="text-white/50 mt-2 max-w-xl">Hand-curated sovereign-grade domains, each scored by the AI intelligence engine and ready for instant deployment.</p>
          </div>
          <Link to="/marketplace" className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg glass hover:glass-strong text-sm text-white font-medium transition">
            View All Inventory
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {domains.map(d => <DomainCard key={d.id} domain={d} />)}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedDomains;
