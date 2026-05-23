import React from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import HeroSection from '@/components/HeroSection';
import FeaturedDomains from '@/components/FeaturedDomains';
import FeatureGrid from '@/components/FeatureGrid';
import ArchitectureSection from '@/components/ArchitectureSection';
import DeploymentShowcase from '@/components/DeploymentShowcase';
import TrustSection from '@/components/TrustSection';

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground />
      <PlatformNav />
      <main className="relative">
        <HeroSection />
        <FeaturedDomains />
        <FeatureGrid />
        <ArchitectureSection />
        <DeploymentShowcase />
        <TrustSection />
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
