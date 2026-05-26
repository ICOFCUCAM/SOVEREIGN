import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroEnvironment from '@/components/home/HeroEnvironment';

// ACT 2 — deployment infrastructure. The previous homepage's floating-globe
// composition, brought here as the operational-proof section.
const GlobalInfrastructure: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const onMove = (ev: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section ref={sectionRef} onMouseMove={onMove} className="relative h-[86vh] min-h-[640px] overflow-hidden"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      <HeroEnvironment />

      {/* ── editorial column ── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md lg:max-w-[42%]">
          <div className="inline-flex items-center gap-2.5 text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Deployment infrastructure
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.02] mb-7">
            <span className="block text-white">A planetary edge mesh,</span>
            <span className="block text-white">deployable <span className="text-gradient-cyan">in seconds.</span></span>
          </h2>
          <p className="text-base text-white/55 max-w-sm mb-9 leading-relaxed">
            Sovereign routing across protected regions — institutions synchronize through a live intelligence fabric of orbital relays, edge nodes and signal corridors.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-9">
            <Link to="/deploy" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.26)' }}>
              Open the deployment engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono text-white/45">
            <span className="inline-flex items-center gap-1.5 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live network</span>
            <span>47 <span className="text-white/30">edge nodes</span></span>
            <span>23 <span className="text-white/30">regions</span></span>
            <span>99.99% <span className="text-white/30">uptime</span></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalInfrastructure;
