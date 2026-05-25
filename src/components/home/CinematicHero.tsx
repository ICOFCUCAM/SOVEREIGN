import React, { lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Boxes, Globe2, Rocket, ShieldCheck } from 'lucide-react';
import HeroEnvironment from '@/components/home/HeroEnvironment';

const Globe = lazy(() => import('@/components/home/Globe'));
const HAS_PLATE = !!((import.meta.env.VITE_HERO_PLATE as string | undefined)?.trim());

const PILLS = [
  { icon: Boxes, value: '47', label: 'Edge Regions' },
  { icon: Globe2, value: '23', label: 'Global Regions' },
  { icon: Rocket, value: '87s', label: 'Avg Deployment' },
  { icon: ShieldCheck, value: '99.99%', label: 'System Uptime' },
];
const TRUST = ['Gov of Estonia', 'African Union', 'ADB', 'World Bank', 'ITU'];

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
    <section ref={sectionRef} onMouseMove={onMove} className="relative h-[92vh] min-h-[680px] overflow-hidden" style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      <HeroEnvironment />
      {HAS_PLATE && (
        <div className="absolute z-[15] top-[8%] right-[-6%] sm:right-[-2%] lg:right-[2%] w-[82vw] sm:w-[58vw] lg:w-[46vw] max-w-[640px] aspect-square"
          style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -10px))' }}>
          <Suspense fallback={<div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.12), transparent 66%)' }} />}>
            <Globe className="w-full h-full" />
          </Suspense>
        </div>
      )}

      {/* floating metric pills — clean vertical stack at the world's edge */}
      <div className="hidden lg:flex absolute z-20 top-[16%] right-[4%] xl:right-[7%] flex-col gap-2.5" style={{ transform: 'translate(calc(var(--px) * 10px), calc(var(--py) * 10px))' }}>
        {PILLS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.label} className="flex items-center gap-3 glass-strong rounded-xl px-4 py-2.5 border border-white/10 shadow-2xl min-w-[180px]">
              <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-cyan-300" /></span>
              <div className="leading-none">
                <div className="text-lg font-bold text-white tabular-nums">{p.value}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1">{p.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* live-activity pill near the world */}
      <div className="hidden md:flex absolute z-20 bottom-[14%] left-1/2 lg:left-[54%] -translate-x-1/2 items-center gap-3 glass-strong rounded-full pl-3 pr-4 py-2 border border-white/10">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live activity</span>
        <span className="text-xs text-white/70 font-mono"><span className="text-white">veritas.financial</span> deployed in eu-west</span>
        <span className="text-[10px] text-white/35 font-mono">12s ago</span>
      </div>

      {/* message */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-7">The operating layer for digital civilization</div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.96] mb-7">
            <span className="block text-white">Infrastructure</span>
            <span className="block text-white">for a sovereign</span>
            <span className="block text-gradient-cyan">future.</span>
          </h1>
          <p className="text-lg text-white/55 max-w-sm mb-9 leading-relaxed">
            Deploy institutions. Run economies. Operate sovereign systems at planetary scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.28)' }}>
              Enter the Ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur text-white font-semibold hover:bg-white/5 transition-all">
              Explore Marketplace
            </Link>
          </div>
          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35 mb-3.5">Trusted by governments, enterprises &amp; innovators</div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {TRUST.map((t) => (
              <span key={t} className="text-xs font-semibold text-white/45 tracking-tight">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #050816)' }} />
    </section>
  );
};

export default CinematicHero;
