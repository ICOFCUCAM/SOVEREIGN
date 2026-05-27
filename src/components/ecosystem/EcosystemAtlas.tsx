import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import { ArrowUpRight, Landmark, Vote, ShieldAlert, Banknote, Truck, Cpu, GraduationCap, ShoppingCart, Activity, Boxes } from 'lucide-react';

function sectorFor(category: string): string {
  const c = (category || '').toLowerCase();
  if (/elector|ballot|voting/.test(c)) return 'Elections';
  if (/integrit|oversight|anti|procure|govern|civic|govtech|operating infrastructure|government runtime/.test(c)) return 'Governance';
  if (/pay|bank|financ|settle|fintech/.test(c)) return 'Finance';
  if (/logistic|transport|mobility/.test(c)) return 'Mobility';
  if (/educat|credential|academic/.test(c)) return 'Education';
  if (/knowledge|intellig|\bai\b|learn/.test(c)) return 'Intelligence';
  if (/commerce|marketplace/.test(c)) return 'Commerce';
  return 'Operations';
}
const SECTOR_ORDER = ['Governance', 'Finance', 'Mobility', 'Intelligence', 'Elections', 'Education', 'Commerce', 'Operations'];

function emblemFor(category: string): React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number | string }> {
  const c = (category || '').toLowerCase();
  if (/elector|ballot|voting/.test(c)) return Vote;
  if (/integrit|oversight|anti|procure|forensic/.test(c)) return ShieldAlert;
  if (/govern|civic|govtech|operating infrastructure|government/.test(c)) return Landmark;
  if (/pay|bank|financ|settle|fintech|treasury/.test(c)) return Banknote;
  if (/logistic|transport|mobility/.test(c)) return Truck;
  if (/educat|credential|academic/.test(c)) return GraduationCap;
  if (/knowledge|intellig|\bai\b|learn/.test(c)) return Cpu;
  if (/commerce|marketplace/.test(c)) return ShoppingCart;
  if (/operations|command/.test(c)) return Activity;
  return Boxes;
}
const deployValue = (p: EcosystemProduct): string | null => {
  const t = p.tiers || [];
  if (t.length) return `From ${t[0].price}`;
  const m = (p.metrics || []).find((x) => /deployment|value|contract|price/i.test(x.label));
  return m?.value || null;
};

const SystemCard: React.FC<{ p: EcosystemProduct }> = ({ p }) => {
  const accent = p.accent || '#00D9FF';
  const Emblem = emblemFor(p.category);
  const val = deployValue(p);
  return (
    <Link to={`/systems/${p.slug}`} className="group relative block rounded-2xl border border-white/10 bg-white/[0.015] p-6 overflow-hidden ease-cinematic transition-all duration-500 hover:border-white/25 hover:bg-white/[0.03] hover:-translate-y-1.5 hover:shadow-[0_40px_90px_-46px_rgba(0,0,0,0.9)]">
      <span className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity" style={{ background: accent }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}>
            <Emblem className="w-5 h-5" strokeWidth={1.2} style={{ color: accent }} />
          </span>
          <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.18em] truncate" style={{ color: accent }}>{p.category}</div>
        <div className="text-white font-semibold text-lg mt-1">{p.name}</div>
        <div className="text-sm text-white/50 line-clamp-2 min-h-[2.5rem] mt-1">{p.tagline}</div>
        {val && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <span className="text-sm font-semibold text-white tabular-nums">{val}</span>
            <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 ml-2">Deployment value</span>
          </div>
        )}
      </div>
    </Link>
  );
};

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20 pb-10 border-b border-white/10">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white tabular-nums leading-none mb-2">{s.value}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* system index, grouped by sector */}
        <div className="space-y-20">
          {grouped.map(({ sector, items }, i) => (
            <div key={sector} id={sector.toLowerCase()} className="scroll-mt-28">
              <div className="flex items-center gap-4 mb-7">
                <span className="font-mono text-sm text-cyan-300/50 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-cinematic text-white">{sector}</h2>
                <div className="flex-1 hairline" />
                <span className="kicker text-white/35" style={{ fontSize: '10px' }}>{items.length} system{items.length > 1 ? 's' : ''}</span>
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
