import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import MarketplaceTeaser from '@/components/home/MarketplaceTeaser';
import SovereignInfrastructureStack from '@/components/home/SovereignInfrastructureStack';
import InfrastructureFlow from '@/components/home/InfrastructureFlow';
import InfrastructureDependency from '@/components/home/InfrastructureDependency';
import EcosystemPanels from '@/components/home/EcosystemPanels';
import EcosystemSectors from '@/components/home/EcosystemSectors';
import ChannelTeaser from '@/components/home/ChannelTeaser';
import TransformationFlow from '@/components/home/TransformationFlow';
import InstitutionalTrust from '@/components/home/InstitutionalTrust';
import ClosingCTA from '@/components/home/ClosingCTA';

// Composition:
//   ACT I  · Civilization-scale vision   Hero · MarketplaceTeaser
//   ACT II · Sovereign Infrastructure    Stack · Flow · Dependency
//   ACT III · Institutional universe     EcosystemPanels · Sectors · Channel · Transformation · Trust
//   ACT IV · Close                       ClosingCTA
const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#05071A] focus:font-semibold">Skip to content</a>
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main id="main" className="relative">
        {/* ACT I — civilization-scale vision */}
        <CinematicHero />
        <MarketplaceTeaser />

        {/* ACT II — Sovereign Infrastructure Stack */}
        <Reveal><SovereignInfrastructureStack /></Reveal>
        <Reveal><InfrastructureFlow /></Reveal>
        <Reveal><InfrastructureDependency /></Reveal>

        {/* ACT III — institutional universe */}
        <Reveal><EcosystemPanels /></Reveal>
        <EcosystemSectors />
        <Reveal><ChannelTeaser /></Reveal>
        <Reveal><TransformationFlow /></Reveal>
        <Reveal><InstitutionalTrust /></Reveal>

        {/* ACT IV — close */}
        <ClosingCTA />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
