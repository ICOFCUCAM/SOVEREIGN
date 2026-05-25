import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import SystemTelemetry from '@/components/SystemTelemetry';
import { ArrowUpRight } from 'lucide-react';

function sectorFor(category: string): string {
  const c = (category || '').toLowerCase();
  if (/elector|ballot|voting/.test(c)) return 'Elections';
  if (/integrit|oversight|anti|procure|govern|civic|govtech/.test(c)) return 'Governance';
  if (/pay|bank|financ|settle|fintech/.test(c)) return 'Finance';
  if (/logistic|transport|mobility/.test(c)) return 'Mobility';
  if (/educat|credential/.test(c)) return 'Education';
  if (/knowledge|intellig|\bai\b|learn/.test(c)) return 'Intelligence';
  if (/commerce|marketplace/.test(c)) return 'Commerce';
  return 'Operations';
}
const SECTOR_ORDER = ['Governance', 'Finance', 'Mobility', 'Intelligence', 'Elections', 'Education', 'Commerce', 'Operations'];

const SystemCard: React.FC<{ p: EcosystemProduct }> = ({ p }) => (
  <Link to={`/systems/${p.slug}`} className="group block rounded-2xl border border-white/10 overflow-hidden hover:border-white/25 transition-all hover:-translate-y-0.5">
    <div className="aspect-[16/9]"><SystemTelemetry category={p.category} accent={p.accent || '#00D9FF'} className="h-full" /></div>
    <div className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono uppercase tracking-[0.18em] truncate" style={{ color: p.accent || '#00D9FF' }}>{p.category}</span>
        <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
      <div className="text-white font-semibold mt-1.5">{p.name}</div>
      <div className="text-sm text-white/50 line-clamp-1">{p.tagline}</div>
    </div>
  </Link>
);

const EcosystemAtlas: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      setProducts((data || []) as EcosystemProduct[]);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, EcosystemProduct[]>();
    products.forEach((p) => {
      const s = sectorFor(p.category);
      map.set(s, [...(map.get(s) || []), p]);
    });
    return SECTOR_ORDER.filter((s) => map.has(s)).map((s) => ({ sector: s, items: map.get(s)! }));
  }, [products]);

  const stats = [
    { value: products.length || '—', label: 'Deployable institutions' },
    { value: grouped.length || 8, label: 'Active sectors' },
    { value: '23', label: 'Operational regions' },
    { value: '99.99%', label: 'Uptime SLA' },
  ];

  if (products.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-28">
      <div className="max-w-6xl mx-auto">
        {/* live status strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] mb-20">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-6 bg-white/[0.01]">
              <div className="text-3xl font-bold text-white tabular-nums leading-none mb-2">{s.value}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* system index, grouped by sector */}
        <div className="space-y-20">
          {grouped.map(({ sector, items }) => (
            <div key={sector}>
              <div className="flex items-center gap-4 mb-7">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">{sector}</h2>
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/35">{items.length} system{items.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((p) => <SystemCard key={p.id} p={p} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemAtlas;
