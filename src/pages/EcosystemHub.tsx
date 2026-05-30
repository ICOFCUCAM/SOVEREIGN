import React, { useRef } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import HeroEnvironment from '@/components/home/HeroEnvironment';
import PageSubNav from '@/components/PageSubNav';
import EcosystemMap from '@/components/home/EcosystemMap';
import EcosystemAtlas from '@/components/ecosystem/EcosystemAtlas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const EcosystemHub: React.FC = () => {
  useDocumentTitle('Infrastructures', 'Deployable infrastructures available through Sovereign — governance, finance, mobility and intelligence systems your institution can launch. Examples, not a closed list.');
  const bannerRef = useRef<HTMLDivElement>(null);
  const onMove = (ev: React.MouseEvent) => {
    const el = bannerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <PageSubNav label="Ecosystem" items={[{ id: 'network', label: 'Network' }, { id: 'governance', label: 'Governance' }, { id: 'finance', label: 'Finance' }, { id: 'mobility', label: 'Mobility' }, { id: 'intelligence', label: 'Intelligence' }, { id: 'elections', label: 'Elections' }, { id: 'education', label: 'Education' }, { id: 'commerce', label: 'Commerce' }, { id: 'operations', label: 'Operations' }]} />

      {/* header banner — a compact version of the old homepage: live globe + city skyline */}
      <section ref={bannerRef} onMouseMove={onMove} className="relative h-[46vh] min-h-[360px] overflow-hidden"
        style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
        <HeroEnvironment />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-md lg:max-w-[46%]">
            <div className="inline-flex items-center gap-2.5 kicker text-cyan-300/70 mb-6" style={{ letterSpacing: '0.3em' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Deployable infrastructures
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96] text-balance mb-5">
              Infrastructure for institutions.
            </h1>
            <p className="text-white/55 max-w-md text-base sm:text-lg leading-relaxed">
              Examples of what your institution can deploy through Sovereign — governance, finance, intelligence, logistics and commerce. Representative, not exhaustive; the catalog is open and always growing.
            </p>
          </div>
        </div>
      </section>

      <Reveal><EcosystemMap /></Reveal>
      <Reveal><EcosystemAtlas /></Reveal>
      <PlatformFooter />
    </div>
  );
};

export default EcosystemHub;
