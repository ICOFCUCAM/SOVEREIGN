import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import MarketplaceTeaser from '@/components/home/MarketplaceTeaser';
import EcosystemPillars from '@/components/home/EcosystemPillars';
import EcosystemSectors from '@/components/home/EcosystemSectors';
import MarketplaceRail from '@/components/home/MarketplaceRail';
import TransformationFlow from '@/components/home/TransformationFlow';
import GlobalInfrastructure from '@/components/home/GlobalInfrastructure';
import ClosingCTA from '@/components/home/ClosingCTA';

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#05071A] focus:font-semibold">Skip to content</a>
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main id="main" className="relative">
        {/* 1 — cinematic hero */}
        <CinematicHero />
        {/* 1b — marketplace assets immediately after the hero */}
        <MarketplaceTeaser />
        {/* 2 — the ecosystem */}
        <Reveal><EcosystemPillars /></Reveal>
        {/* 3 — featured systems */}
        <EcosystemSectors />
        {/* 4 — marketplace */}
        <Reveal><MarketplaceRail /></Reveal>
        {/* 5 — deployment story */}
        <Reveal><TransformationFlow /></Reveal>
        {/* 6 — global infrastructure */}
        <Reveal><GlobalInfrastructure /></Reveal>
        {/* 7 — final CTA */}
        <ClosingCTA />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
