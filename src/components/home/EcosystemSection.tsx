import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import { CheckCircle2, ArrowRight, ArrowUpRight } from 'lucide-react';

const NARRATIVE = ['Domain', 'Startup', 'Infrastructure', 'Digital civilization'];

const SystemPanel: React.FC<{ p: EcosystemProduct; featured?: boolean }> = ({ p, featured }) => {
  const caps = Array.isArray(p.capabilities) ? p.capabilities : [];
  const metrics = Array.isArray(p.metrics) ? p.metrics : [];
  const live = !!p.url;
  const Wrapper = live ? 'a' : 'div';
  const wrapperProps = live ? { href: p.url as string, target: '_blank', rel: 'noreferrer' } : {};
  return (
    <Wrapper {...wrapperProps}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 block ${featured ? 'lg:col-span-2 lg:row-span-2' : ''}`}
      style={{ background: '#070A18' }}>
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full blur-[110px] opacity-20 group-hover:opacity-35 transition-opacity" style={{ background: p.accent }} />
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: `linear-gradient(${p.accent}55 1px, transparent 1px), linear-gradient(90deg, ${p.accent}55 1px, transparent 1px)`,
        backgroundSize: '38px 38px',
        maskImage: 'radial-gradient(ellipse at top right, black, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at top right, black, transparent 70%)',
      }} />

      <div className={`relative ${featured ? 'p-8' : 'p-6'} flex flex-col h-full`}>
        <div className="flex items-start justify-between mb-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">{p.category}</div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border" style={{ background: `${p.accent}12`, borderColor: `${p.accent}33` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p.accent }} />
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: p.accent }}>Deployable</span>
          </div>
        </div>

        <h3 className={`font-bold tracking-tight text-white mb-2 ${featured ? 'text-4xl' : 'text-2xl'}`}>{p.name}</h3>
        <p className={`text-white/55 leading-relaxed mb-5 ${featured ? 'text-lg max-w-md' : 'text-sm'}`}>
          {featured ? p.description : p.tagline}
        </p>

        {featured && metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {metrics.slice(0, 3).map((m) => (
              <div key={m.label} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                <div className="text-base font-bold text-white tabular-nums" style={{ color: p.accent }}>{m.value}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-0.5 truncate">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className={`grid gap-x-4 gap-y-2 mb-6 ${featured ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {caps.slice(0, featured ? 6 : 4).map((c) => (
            <div key={c} className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: p.accent }} />
              <span className="truncate">{c}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-[11px] font-mono text-white/35">{live ? 'Preview build · ships in full on acquisition' : 'Deployable on acquisition'}</span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-white/70 group-hover:text-white transition">
            {live ? 'View preview' : 'Explore'}
            {live
              ? <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" style={{ color: p.accent }} />
              : <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" style={{ color: p.accent }} />}
          </span>
        </div>
      </div>
    </Wrapper>
  );
};

const EcosystemSection: React.FC = () => {
  const [products, setProducts] = useState<EcosystemProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
      setProducts((data || []) as EcosystemProduct[]);
    })();
  }, []);

  if (products.length === 0) return null;
  const featured = products.filter((p) => p.is_featured);
  const rest = products.filter((p) => !p.is_featured);

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-white/45 text-[11px] font-mono uppercase tracking-[0.25em] mb-6">
            Infrastructure already in motion
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter text-white mb-5">Not concepts. Operational systems.</h2>

          {/* Narrative stepper */}
          <div className="flex items-center justify-center flex-wrap gap-2 text-white/40">
            {NARRATIVE.map((n, i) => (
              <React.Fragment key={n}>
                <span className={`text-sm font-mono ${i === NARRATIVE.length - 1 ? 'text-gradient-cyan font-semibold' : ''}`}>{n}</span>
                {i < NARRATIVE.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-white/25" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4">
          {featured.map((p) => <SystemPanel key={p.id} p={p} featured />)}
          {rest.map((p) => <SystemPanel key={p.id} p={p} />)}
        </div>

        <p className="text-center text-white/40 text-sm mt-10 max-w-xl mx-auto">
          Each system is a deployable institution — preview the build now; acquire it and it ships in full on sovereign infrastructure.
        </p>
      </div>
    </section>
  );
};

export default EcosystemSection;
