import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Sparkles, Wand2, BarChart3, ArrowRight, Boxes, Rocket } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import CinematicHero from '@/components/home/CinematicHero';
import TransformationFlow from '@/components/home/TransformationFlow';
import EcosystemSectors from '@/components/home/EcosystemSectors';

const VisionStatement: React.FC = () => (
  <section className="py-32 sm:py-44 px-4">
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tighter leading-tight text-white/90">
        We are building the operating layer for{' '}
        <span className="text-gradient-cyan">deployable digital institutions.</span>
      </h2>
    </div>
  </section>
);

const EntryGrid: React.FC = () => {
  const entries = [
    { to: '/ecosystem', label: 'Ecosystem', desc: 'Explore the infrastructure atlas.', icon: Boxes },
    { to: '/marketplace', label: 'Marketplace', desc: 'Browse the sovereign inventory.', icon: LayoutGrid },
    { to: '/valuation', label: 'AI Valuation', desc: 'Score any domain in seconds.', icon: Sparkles },
    { to: '/studio', label: 'Branding Studio', desc: 'Turn a domain into a brand.', icon: Wand2 },
    { to: '/deploy', label: 'Deployment Engine', desc: 'From acquisition to live.', icon: Rocket },
    { to: '/admin', label: 'Command Center', desc: 'Operate the platform.', icon: BarChart3 },
  ];
  return (
    <section className="pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((e) => {
            const Icon = e.icon;
            return (
              <Link key={e.to} to={e.to}
                className="group rounded-2xl border border-white/10 p-6 hover:bg-white/[0.03] hover:border-white/20 transition-all">
                <Icon className="w-5 h-5 text-cyan-400 mb-4" />
                <div className="text-white font-semibold mb-1 flex items-center gap-1.5">
                  {e.label}
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:translate-x-1 group-hover:text-white/60 transition-all" />
                </div>
                <div className="text-white/45 text-sm leading-relaxed">{e.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const AppLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative">
        <CinematicHero />
        <EcosystemSectors />
        <Reveal><TransformationFlow /></Reveal>
        <Reveal><VisionStatement /></Reveal>
        <Reveal><EntryGrid /></Reveal>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default AppLayout;
