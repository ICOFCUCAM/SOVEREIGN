import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import EcosystemSectors from '@/components/home/EcosystemSectors';
import GlobalInfrastructure from '@/components/home/GlobalInfrastructure';
import MarketActivity from '@/components/home/MarketActivity';
import EcosystemMap from '@/components/home/EcosystemMap';
import MarketplaceRail from '@/components/home/MarketplaceRail';
import LiveActivityStrip from '@/components/home/LiveActivityStrip';
import GlobalStatBar from '@/components/home/GlobalStatBar';
import ClosingCTA from '@/components/home/ClosingCTA';

// Atmospheric transition between sections — a fading hairline + soft glow
// that gives the page cinematic breathing room and continuity.
const SectionFade: React.FC = () => (
  <div className="relative h-px max-w-6xl mx-auto my-4" aria-hidden>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.18), transparent)' }} />
    <div className="absolute left-1/2 -translate-x-1/2 -top-12 w-[420px] h-24 rounded-full blur-[60px]" style={{ background: 'rgba(0,150,255,0.06)' }} />
  </div>
);

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative">
        <CinematicHero />
        <LiveActivityStrip />
        <MarketplaceRail />
        <SectionFade />
        <Reveal><EcosystemMap /></Reveal>
        <SectionFade />
        <EcosystemSectors />
        <SectionFade />
        <Reveal><GlobalInfrastructure /></Reveal>
        <SectionFade />
        <Reveal><MarketActivity /></Reveal>
        <ClosingCTA />
        <GlobalStatBar />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
