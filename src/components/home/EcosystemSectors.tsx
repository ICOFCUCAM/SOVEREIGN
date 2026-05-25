import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Reveal from '@/components/Reveal';
import { ArrowRight } from 'lucide-react';
import { VIZ, motifFor } from '@/components/SystemTelemetry';

const SectorPanel: React.FC<{ p: EcosystemProduct; flip: boolean }> = ({ p, flip }) => {
  const motif = motifFor(p.category);
  const Viz = VIZ[motif];
  const caps = (p.capabilities || []).slice(0, 4);
  const metrics = (p.metrics || []).slice(0, 3);
  return (
    <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      {/* chromeless visual — the institution's own visual language, floating in atmosphere */}
      <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
        <div className="absolute inset-0 blur-[90px] opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 45%, ${p.accent}, transparent 70%)` }} />
        <div className="relative mx-auto w-full max-w-[480px] aspect-square"><Viz accent={p.accent} /></div>
      </div>
      <div className={flip ? 'lg:order-1' : ''}>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="inline-block text-[10px] font-mono uppercase tracking-[0.24em]" style={{ color: p.accent }}>{p.category}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Operational
          </span>
        </div>
        <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.02] mb-4">{p.name}</h3>
        <p className="text-lg text-white/55 max-w-md leading-relaxed mb-7">{p.tagline}</p>
        {caps.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2.5 mb-8 max-w-md">
            {caps.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm text-white/65">
                <span className="w-1 h-1 rounded-full shrink-0" style={{ background: p.accent }} /> {c}
              </div>
            ))}
          </div>
        )}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-x-10 gap-y-4 mb-9">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-2xl font-bold text-white tabular-nums leading-none mb-1.5">{m.value}</div>
                <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">{m.label}</div>
              </div>
            ))}
          </div>
        )}
        <Link to={`/systems/${p.slug}`} className="group inline-flex items-center gap-2 text-white font-semibold">
          Preview infrastructure <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: p.accent }} />
        </Link>
      </div>
    </div>
  );
};

// The four flagship institutions, in showcase order.
const FLAGSHIP = ['veritas-os', 'veritas-banking', 'elecpro', 'flyttgo'];

const EcosystemSectors: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      const rows = (data || []) as EcosystemProduct[];
      const pick = FLAGSHIP.map((s) => rows.find((r) => r.slug === s)).filter(Boolean) as EcosystemProduct[];
      const chosen = pick.length >= 3 ? pick : (rows.filter((r) => r.is_featured).length ? rows.filter((r) => r.is_featured) : rows).slice(0, 4);
      setProducts(chosen.slice(0, 4));
    })();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="relative py-28 sm:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* environmental continuity — section emerges from the living ecosystem */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[12%] -left-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-a" style={{ background: 'rgba(0,194,255,0.05)' }} />
        <div className="absolute bottom-[10%] -right-32 w-[520px] h-[520px] rounded-full blur-[150px] animate-haze-b" style={{ background: 'rgba(124,77,255,0.05)' }} />
        <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,194,255,0.1) 12%, rgba(0,194,255,0.1) 88%, transparent)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="max-w-2xl mb-24">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Featured institutions</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98] mb-5">
            Sovereign systems, ready to deploy.
          </h2>
          <p className="text-lg text-white/55 leading-relaxed">
            Four flagship institutions — operational today, available for acquisition and sovereign deployment.
          </p>
        </div>

        <div className="space-y-32 sm:space-y-44">
          {products.map((p, i) => (
            <Reveal key={p.id} y={40}><SectorPanel p={p} flip={i % 2 === 1} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSectors;
