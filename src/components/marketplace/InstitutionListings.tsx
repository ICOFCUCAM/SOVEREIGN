import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import { ArrowUpRight, Boxes } from 'lucide-react';

const deploymentValue = (p: EcosystemProduct): string => {
  const m = (p.metrics || []).find((x) => /deployment|value|price|contract/i.test(x.label));
  return m?.value || 'On request';
};

const InstitutionListings: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      setProducts((data || []) as EcosystemProduct[]);
    })();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="mt-14">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-cyan-300/70 mb-2">Deployable institutions</div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Sovereign systems for acquisition &amp; deployment.</h2>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-white/35 shrink-0">{products.length} systems</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const accent = p.accent || '#00D9FF';
          return (
            <Link key={p.id} to={`/systems/${p.slug}`}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.015] p-5 hover:border-white/25 hover:bg-white/[0.03] transition-all overflow-hidden">
              <span className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity" style={{ background: accent }} />
              <div className="relative">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.18em] truncate" style={{ color: accent }}>
                    <Boxes className="w-3 h-3 shrink-0" /> {p.category}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <div className="text-lg font-bold text-white tracking-tight">{p.name}</div>
                <div className="text-sm text-white/45 line-clamp-1 mb-5">{p.tagline}</div>
                <div className="flex items-end justify-between pt-3 border-t border-white/5">
                  <div>
                    <div className="text-lg font-bold text-white tabular-nums leading-none">{deploymentValue(p)}</div>
                    <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1.5">Deployment value</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Deployable
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default InstitutionListings;
