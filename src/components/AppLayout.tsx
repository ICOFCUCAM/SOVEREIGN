import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import EcosystemPanels from '@/components/home/EcosystemPanels';
import EcosystemSectors from '@/components/home/EcosystemSectors';
import TransformationFlow from '@/components/home/TransformationFlow';
import InstitutionalTrust from '@/components/home/InstitutionalTrust';
import ClosingCTA from '@/components/home/ClosingCTA';

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#05071A] focus:font-semibold">Skip to content</a>
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main id="main" className="relative">
        {/* ACT 1 — civilization-scale vision (cinematic Earth hero) */}
        <CinematicHero />
        {/* ACT 2 — the sovereign infrastructure universe */}
        <Reveal><EcosystemPanels /></Reveal>
        {/* featured institutions */}
        <EcosystemSectors />
        {/* deployment story */}
        <Reveal><TransformationFlow /></Reveal>
        {/* institutional trust & governance */}
        <Reveal><InstitutionalTrust /></Reveal>
        {/* closing statement */}
        <ClosingCTA />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
