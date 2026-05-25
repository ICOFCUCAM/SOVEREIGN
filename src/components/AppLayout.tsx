import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import EcosystemSectors from '@/components/home/EcosystemSectors';
import GlobalInfrastructure from '@/components/home/GlobalInfrastructure';
import EcosystemMap from '@/components/home/EcosystemMap';
import MarketplaceRail from '@/components/home/MarketplaceRail';
import ClosingCTA from '@/components/home/ClosingCTA';

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative">
        {/* Act I — the world */}
        <CinematicHero />
        {/* Act II — the interconnected ecosystem */}
        <Reveal><EcosystemMap /></Reveal>
        {/* Act III — featured deployable systems */}
        <EcosystemSectors />
        {/* Act IV — the sovereign marketplace */}
        <MarketplaceRail />
        {/* Act V — planetary infrastructure */}
        <Reveal><GlobalInfrastructure /></Reveal>
        {/* Act VI — enter */}
        <ClosingCTA />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
