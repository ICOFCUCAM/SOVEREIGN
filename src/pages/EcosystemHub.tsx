import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import EcosystemSection from '@/components/home/EcosystemSection';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const EcosystemHub: React.FC = () => {
  useDocumentTitle('Ecosystem');
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="pt-32 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-white/45 text-[11px] font-mono uppercase tracking-[0.28em] mb-6">
            The infrastructure atlas
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tighter mb-4">The sovereign ecosystem.</h1>
          <p className="text-white/55 max-w-2xl mx-auto text-lg">
            A network of deployable institutions — governance, finance, intelligence, logistics, and commerce — interconnected into one civilization-scale operating layer.
          </p>
        </div>
      </main>
      <Reveal><EcosystemSection /></Reveal>
      <PlatformFooter />
    </div>
  );
};

export default EcosystemHub;
