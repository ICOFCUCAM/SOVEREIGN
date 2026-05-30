import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import MarketplaceTeaser from '@/components/home/MarketplaceTeaser';
import EcosystemPanels from '@/components/home/EcosystemPanels';
import EcosystemSectors from '@/components/home/EcosystemSectors';
import ChannelTeaser from '@/components/home/ChannelTeaser';
import TransformationFlow from '@/components/home/TransformationFlow';
import InstitutionalTrust from '@/components/home/InstitutionalTrust';
import ClosingCTA from '@/components/home/ClosingCTA';
import { DeploymentRegions } from '@/components/home/HomeSections';

// Canonical homepage composition. EcosystemSectors restored to its original
// design (cinematic emblem + framed system image on the right). The
// DeploymentRegions section sits after the ClosingCTA per the operator
// instruction — "Deploy regions" appears after "Deploy the operating layer
// for sovereign civilization".
const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#05071A] focus:font-semibold">Skip to content</a>
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main id="main" className="relative">
        {/* ACT I — civilization-scale vision (cinematic Earth hero) */}
        <CinematicHero />
        {/* live acquisition ticker — featured sovereign infrastructure under the hero */}
        <MarketplaceTeaser />
        {/* ACT II — the sovereign infrastructure universe */}
        <Reveal><EcosystemPanels /></Reveal>
        {/* featured institutions — cinematic emblem panels with system imagery */}
        <EcosystemSectors />
        {/* the sovereign channel — media ecosystem entry */}
        <Reveal><ChannelTeaser /></Reveal>
        {/* deployment story */}
        <Reveal><TransformationFlow /></Reveal>
        {/* institutional trust & governance */}
        <Reveal><InstitutionalTrust /></Reveal>
        {/* closing statement — "Deploy the operating layer for sovereign civilization" */}
        <ClosingCTA />
        {/* deployment reach — sovereign edge mesh regions */}
        <Reveal><DeploymentRegions /></Reveal>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
