import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import EcosystemPillars from '@/components/home/EcosystemPillars';
import EcosystemSectors from '@/components/home/EcosystemSectors';
import MarketplaceRail from '@/components/home/MarketplaceRail';
import TransformationFlow from '@/components/home/TransformationFlow';
import GlobalInfrastructure from '@/components/home/GlobalInfrastructure';
import ClosingCTA from '@/components/home/ClosingCTA';

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative">
        {/* 1 — cinematic hero */}
        <CinematicHero />
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
