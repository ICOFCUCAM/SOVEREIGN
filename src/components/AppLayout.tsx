import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import MarketplaceTeaser from '@/components/home/MarketplaceTeaser';
import ChannelTeaser from '@/components/home/ChannelTeaser';
import TransformationFlow from '@/components/home/TransformationFlow';
import InstitutionalTrust from '@/components/home/InstitutionalTrust';
import {
  DeploymentTypes,
  FeaturedInfrastructure,
  OperationalInfrastructure,
  DeploymentRegions,
  InstitutionalIntelligence,
} from '@/components/home/HomeSections';
import ClosingCTA from '@/components/home/ClosingCTA';

// Integrated capability flow — five capability grids interleaved with three
// cinematic pacing pieces (TransformationFlow · ChannelTeaser · InstitutionalTrust)
// so the home reads as narrative rather than a directory.
const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#05071A] focus:font-semibold">Skip to content</a>
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main id="main" className="relative">
        {/* 1 — Cinematic Hero */}
        <CinematicHero />
        {/* live sovereign assets ticker */}
        <MarketplaceTeaser />
        {/* 2 — What would you like to deploy? */}
        <Reveal><DeploymentTypes /></Reveal>
        {/* 3 — Featured infrastructure assets */}
        <Reveal><FeaturedInfrastructure /></Reveal>
        {/* ⟡ pacing — deployment story arc */}
        <Reveal><TransformationFlow /></Reveal>
        {/* 4 — Operational infrastructure (Domains · Network · Identity · Security · Deployment) */}
        <Reveal><OperationalInfrastructure /></Reveal>
        {/* 5 — Deployment regions */}
        <Reveal><DeploymentRegions /></Reveal>
        {/* ⟡ pacing — media channel preview */}
        <Reveal><ChannelTeaser /></Reveal>
        {/* 6 — Institutional intelligence */}
        <Reveal><InstitutionalIntelligence /></Reveal>
        {/* ⟡ pacing — institutional trust & governance */}
        <Reveal><InstitutionalTrust /></Reveal>
        {/* closing statement */}
        <ClosingCTA />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
