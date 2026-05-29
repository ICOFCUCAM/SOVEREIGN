import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Users, Building2, ArrowRight } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import SovereignInfrastructureStack from '@/components/home/SovereignInfrastructureStack';
import InfrastructureFlow from '@/components/home/InfrastructureFlow';
import InfrastructureDependency from '@/components/home/InfrastructureDependency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// /infrastructure — the canonical architecture surface for institutional
// buyers. Customer-led framing (Government · Organizations · Companies)
// leads the page; the seven infrastructures are presented as substrates
// institutions deploy to run their critical functions.

const InfrastructurePage: React.FC = () => {
  useDocumentTitle('Sovereign Infrastructure', 'Seven sovereign infrastructures any institution can run their critical functions on — independently, securely and at any scale.');

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Customer-led hero — institutions on top */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center justify-center gap-10 mb-8">
              <span className="inline-flex flex-col items-center gap-2 text-white/70">
                <Landmark className="w-7 h-7 text-cyan-300/80" />
                <span className="text-[11px] font-mono uppercase tracking-[0.28em]">Government</span>
              </span>
              <span className="inline-flex flex-col items-center gap-2 text-white/70">
                <Users className="w-7 h-7 text-purple-300/80" />
                <span className="text-[11px] font-mono uppercase tracking-[0.28em]">Organizations</span>
              </span>
              <span className="inline-flex flex-col items-center gap-2 text-white/70">
                <Building2 className="w-7 h-7 text-emerald-300/80" />
                <span className="text-[11px] font-mono uppercase tracking-[0.28em]">Companies</span>
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96] mb-6">
              Run everything. <span className="text-gradient-cyan">Sovereign scale or enterprise scale.</span>
            </h1>

            <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Any institution can run all critical functions on sovereign infrastructures — independently, securely and at any scale. Seven composable layers, each operating as a standalone substrate.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="#stack" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/[0.02] text-white/80 font-semibold hover:bg-white/5 hover:text-white text-sm transition">
                Explore the stack <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white transition">
                Acquire an infrastructure →
              </Link>
            </div>
          </div>

          {/* The three architecture sections — full editorial */}
          <Reveal><SovereignInfrastructureStack /></Reveal>
          <Reveal><InfrastructureFlow /></Reveal>
          <Reveal><InfrastructureDependency /></Reveal>

          {/* Closing — institutional briefing path */}
          <div className="mt-24 max-w-3xl mx-auto text-center">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Begin</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-cinematic leading-[0.98] mb-5">
              Deploy a sovereign infrastructure.
            </h2>
            <p className="text-white/55 text-base leading-relaxed max-w-2xl mx-auto mb-7">
              Single-tenant institutional deployments scoped on briefing. Each infrastructure carries its own audit posture, sovereign jurisdiction and tenant isolation by default.
            </p>
            <a
              href="mailto:institutional@sovereign.so?subject=Sovereign%20infrastructure%20deployment%20briefing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}
            >
              Request a deployment briefing
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
};

export default InfrastructurePage;
