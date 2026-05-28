import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import MarketplaceTeaser from '@/components/home/MarketplaceTeaser';
import {
  DeploymentTypes,
  FeaturedInfrastructure,
  OperationalInfrastructure,
  DeploymentRegions,
  InstitutionalIntelligence,
} from '@/components/home/HomeSections';
import ClosingCTA from '@/components/home/ClosingCTA';

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#05071A] focus:font-semibold">Skip to content</a>
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main id="main" className="relative">
        {/* 1 — Hero */}
        <CinematicHero />
        {/* live sovereign assets ticker — preserved as ambient discoverability under the hero */}
        <MarketplaceTeaser />
        {/* 2 — What would you like to deploy? */}
        <Reveal><DeploymentTypes /></Reveal>
        {/* 3 — Featured infrastructure assets */}
        <Reveal><FeaturedInfrastructure /></Reveal>
        {/* 4 — Operational infrastructure (Domains · Network · Identity · Security · Deployment) */}
        <Reveal><OperationalInfrastructure /></Reveal>
        {/* 5 — Deployment regions */}
        <Reveal><DeploymentRegions /></Reveal>
        {/* 6 — Institutional intelligence */}
        <Reveal><InstitutionalIntelligence /></Reveal>
        {/* closing statement */}
        <ClosingCTA />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
