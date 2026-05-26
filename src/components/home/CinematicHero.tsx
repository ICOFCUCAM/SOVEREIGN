import React, { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroEnvironment from '@/components/home/HeroEnvironment';

const Globe = lazy(() => import('@/components/home/Globe'));
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
    <section ref={sectionRef} onMouseMove={onMove} className="relative h-[90vh] min-h-[660px] overflow-hidden" style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      <HeroEnvironment />
      {HAS_PLATE && (
        <div className="absolute z-[15] top-[8%] right-[-6%] sm:right-[-2%] lg:right-[2%] w-[82vw] sm:w-[58vw] lg:w-[46vw] max-w-[640px] aspect-square"
          style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -10px))' }}>
          <Suspense fallback={<div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.12), transparent 66%)' }} />}>
            <Globe className="w-full h-full" />
          </Suspense>
        </div>
      )}

      {/* ── LEFT 40% · refined content column ── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md lg:max-w-[42%]">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-7">The operating layer for digital civilization</div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] mb-7">
            <span className="block text-white">Build sovereign digital</span>
            <span className="block text-white">systems <span className="text-gradient-cyan">at planetary scale.</span></span>
          </h1>
          <p className="text-base text-white/55 max-w-sm mb-9 leading-relaxed">
            Deploy AI-native institutions, sovereign infrastructure and operational ecosystems across governance, finance, mobility and intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-9">
            <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.26)' }}>
              Launch Ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur text-white font-semibold hover:bg-white/5 transition-all">
              Explore Marketplace
            </Link>
          </div>
          {/* minimal trust indicators */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono text-white/45">
            <span className="inline-flex items-center gap-1.5 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live network</span>
            <span>47 <span className="text-white/30">edge nodes</span></span>
            <span>99.99% <span className="text-white/30">uptime</span></span>
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30">Enter</span>
        <span className="w-px h-8 bg-gradient-to-b from-cyan-400/50 to-transparent" />
      </div>

      {/* fade into the next act */}
      <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #050816)' }} />
    </section>
  );
};

export default CinematicHero;
