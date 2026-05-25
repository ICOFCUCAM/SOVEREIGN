import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Reveal from '@/components/Reveal';
import { ArrowRight } from 'lucide-react';
import { Frame, VIZ, TAG, READOUT, motifFor } from '@/components/SystemTelemetry';

const SectorPanel: React.FC<{ p: EcosystemProduct; flip: boolean }> = ({ p, flip }) => {
  const motif = motifFor(p.category);
  const Viz = VIZ[motif];
  const caps = (p.capabilities || []).slice(0, 4);
  const metrics = (p.metrics || []).slice(0, 3);
  return (
    <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
      <div className={`relative ${flip ? 'lg:order-2' : ''}`}>
        {/* accent glow bleed — panel emerges from the ecosystem atmosphere */}
        <div className="absolute -inset-8 rounded-[2rem] blur-[60px] opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle, ${p.accent}, transparent 70%)` }} />
        <div className="relative" style={{ aspectRatio: '16 / 11' }}><Frame accent={p.accent} tag={TAG[motif]} readout={READOUT[motif]}><Viz accent={p.accent} /></Frame></div>
      </div>
      <div className={flip ? 'lg:order-1' : ''}>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="inline-block text-[10px] font-mono uppercase tracking-[0.24em] px-2.5 py-1 rounded" style={{ background: `${p.accent}1f`, color: p.accent }}>{p.category}</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Operational · acquisition-ready
          </span>
        </div>
        <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.02] mb-4">{p.name}</h3>
        <p className="text-base text-white/55 max-w-md leading-relaxed mb-6">{p.tagline}</p>
        {caps.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-7 max-w-md">
            {caps.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm text-white/70">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.accent }} /> {c}
              </div>
            ))}
          </div>
        )}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-x-px gap-y-px mb-7 rounded-lg overflow-hidden border border-white/10 max-w-md bg-white/[0.02]">
            {metrics.map((m) => (
              <div key={m.label} className="flex-1 min-w-[110px] px-4 py-3 border-r border-white/5 last:border-r-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1 h-1 rounded-full" style={{ background: p.accent }} />
                  <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40">{m.label}</span>
                </div>
                <div className="text-lg font-mono font-semibold text-white tabular-nums leading-none">{m.value}</div>
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
