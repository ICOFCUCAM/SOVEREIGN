import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Reveal from '@/components/Reveal';
import { ArrowRight, Landmark, Vote, ShieldAlert, Banknote, Truck, Cpu, GraduationCap, Boxes } from 'lucide-react';

function emblemFor(category: string): React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number | string }> {
  const c = (category || '').toLowerCase();
  if (/elector|ballot|voting/.test(c)) return Vote;
  if (/integrit|oversight|anti|procure|forensic/.test(c)) return ShieldAlert;
  if (/govern|civic|govtech|operating infrastructure|government runtime/.test(c)) return Landmark;
  if (/pay|bank|financ|settle|fintech|treasury/.test(c)) return Banknote;
  if (/logistic|transport|mobility/.test(c)) return Truck;
  if (/educat|credential/.test(c)) return GraduationCap;
  if (/knowledge|intellig|\bai\b|learn/.test(c)) return Cpu;
  return Boxes;
}

const SectorPanel: React.FC<{ p: EcosystemProduct; flip: boolean }> = ({ p, flip }) => {
  const Emblem = emblemFor(p.category);
  const metrics = (p.metrics || []).slice(0, 3);
  const caps = (p.capabilities || []).slice(0, 4);
  return (
    <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      {/* cinematic emblem — a single elegant mark in an accent light-field */}
      <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
        <div className="relative mx-auto w-full max-w-[480px] aspect-square flex items-center justify-center">
          <span aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display font-bold tracking-tighter text-white/[0.035] whitespace-nowrap select-none" style={{ fontSize: 'clamp(3rem, 9vw, 6rem)' }}>{p.name}</span>
          <div className="absolute inset-[12%] rounded-full blur-[80px] opacity-40" style={{ background: `radial-gradient(circle, ${p.accent}, transparent 70%)` }} />
          <div className="absolute inset-[6%] rounded-full border border-white/[0.06]" />
          <div className="absolute inset-[22%] rounded-full border border-white/[0.04]" />
          <Emblem className="relative w-28 h-28 sm:w-36 sm:h-36" strokeWidth={0.9} style={{ color: p.accent }} />
          {/* drop a cinematic visual at /systems/<slug>.jpg to replace the emblem; hides if absent */}
          <img src={`/systems/${p.slug}.jpg`} alt="" aria-hidden loading="lazy"
            className="absolute inset-0 w-full h-full object-cover rounded-[2rem]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
      </div>

      {/* editorial statement */}
      <div className={flip ? 'lg:order-1' : ''}>
        <div className="text-[10px] font-mono uppercase tracking-[0.26em] mb-6" style={{ color: p.accent }}>{p.category}</div>
        <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98] mb-6">{p.name}</h3>
        <p className="text-xl text-white/55 max-w-md leading-relaxed mb-9">{p.tagline}</p>
        {caps.length > 0 && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-10 max-w-md">
            {caps.map((c) => (
              <div key={c} className="flex items-center gap-2.5 text-[15px] text-white/65">
                <span className="w-1 h-1 rounded-full shrink-0" style={{ background: p.accent }} /> {c}
              </div>
            ))}
          </div>
        )}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-x-12 gap-y-5 mb-10">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-3xl font-bold text-white tabular-nums leading-none mb-2">{m.value}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">{m.label}</div>
              </div>
            ))}
          </div>
        )}
        <Link to={`/systems/${p.slug}`} className="group inline-flex items-center gap-2 text-white font-semibold text-lg">
          Explore {p.name} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: p.accent }} />
        </Link>
      </div>
    </div>
  );
};

const FLAGSHIP = ['veritas-os', 'civicos', 'veritas-banking', 'elecpro', 'flyttgo', 'mobile-pay'];

const EcosystemSectors: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      const rows = (data || []) as EcosystemProduct[];
      const pick = FLAGSHIP.map((s) => rows.find((r) => r.slug === s)).filter(Boolean) as EcosystemProduct[];
      const chosen = pick.length >= 3 ? pick : (rows.filter((r) => r.is_featured).length ? rows.filter((r) => r.is_featured) : rows).slice(0, 6);
      setProducts(chosen.slice(0, 6));
    })();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="relative py-32 sm:py-48 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[12%] -left-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-a" style={{ background: 'rgba(0,194,255,0.05)' }} />
        <div className="absolute bottom-[10%] -right-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-b" style={{ background: 'rgba(124,77,255,0.05)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="max-w-2xl mb-28">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Featured institutions</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98]">
            Sovereign systems, ready to deploy.
          </h2>
        </div>

        <div className="space-y-40 sm:space-y-56">
          {products.map((p, i) => (
            <Reveal key={p.id} y={40}><SectorPanel p={p} flip={i % 2 === 1} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSectors;
