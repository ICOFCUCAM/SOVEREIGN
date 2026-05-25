import React, { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import HeroEnvironment from '@/components/home/HeroEnvironment';

const Globe = lazy(() => import('@/components/home/Globe'));

// When a rendered environment plate is supplied, the live globe is layered
// over it as part of the interface; without a plate the SVG world already
// carries its own globe, so this overlay stays off to avoid doubling up.
const HAS_PLATE = !!((import.meta.env.VITE_HERO_PLATE as string | undefined)?.trim());

const CinematicHero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const onMove = (ev: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section ref={sectionRef} onMouseMove={onMove} className="relative h-[88vh] min-h-[640px] overflow-hidden" style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* ── THE WORLD ── */}
      <HeroEnvironment />
      {HAS_PLATE && (
        <div className="absolute z-[15] top-[10%] right-[-6%] sm:right-[-2%] lg:right-[3%] w-[82vw] sm:w-[58vw] lg:w-[44vw] max-w-[600px] aspect-square"
          style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -10px))' }}>
          <Suspense fallback={<div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.12), transparent 66%)' }} />}>
            <Globe className="w-full h-full" />
          </Suspense>
        </div>
      )}

      {/* ── THE MESSAGE ── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.3em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign OS · Live
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] mb-6">
            <span className="block text-white">The operating layer for</span>
            <span className="block text-gradient-cyan">digital civilization.</span>
          </h1>
          <p className="text-lg text-white/55 max-w-md mb-9 leading-relaxed">
            Sovereign institutions, operational ecosystems and AI-native infrastructure — deployable at planetary scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-9">
            <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.28)' }}>
              Enter the ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur text-white font-semibold hover:bg-white/5 transition-all">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Explore marketplace
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['#00C2FF', '#7C4DFF', '#10B981', '#F59E0B'].map((c) => (
                <div key={c} className="w-7 h-7 rounded-full border-2 border-[#050816]" style={{ background: `linear-gradient(135deg, ${c}, #050816)` }} />
              ))}
            </div>
            <span className="text-xs text-white/45">Trusted by governments, enterprises &amp; innovators</span>
          </div>
        </div>
      </div>

      {/* fade into the marketplace rail below */}
      <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #050816)' }} />
    </section>
  );
};

export default CinematicHero;
