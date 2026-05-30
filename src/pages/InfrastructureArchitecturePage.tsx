import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import Reveal from '@/components/Reveal';
import InfrastructureFlow from '@/components/home/InfrastructureFlow';
import InfrastructureDependency from '@/components/home/InfrastructureDependency';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// /infrastructure/architecture — internal architecture surface. Reserved
// for technical evaluation, deployment planning and investor briefings.
// Public proposition stays at /infrastructure; the diagrams here describe
// how flagships compose when operators choose to integrate them, but they
// do not assert any subordination or required hierarchy.

const InfrastructureArchitecturePage: React.FC = () => {
  useDocumentTitle('Infrastructure Architecture', 'Reference architecture for institutional buyers evaluating multi-flagship Sovereign deployments.');

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <Link to="/infrastructure" className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.28em] text-white/40 hover:text-white/80 transition mb-6">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to featured infrastructures
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300/30 bg-amber-300/[0.06] text-amber-200/90 text-[10px] font-mono uppercase tracking-[0.24em] mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Technical · Reference · For evaluation
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96] mb-6">
              Reference architecture.
            </h1>

            <p className="text-white/60 text-base sm:text-lg leading-relaxed">
              How Sovereign flagships compose when an operator chooses to integrate them. Each infrastructure remains independently deployable; the diagrams below describe optional composition patterns for institutional buyers evaluating multi-system deployments.
            </p>

            <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.24em] text-white/35">
              Deploy individually. Operate together. Composition is an operator decision, not a precondition.
            </p>
          </div>

          <Reveal><InfrastructureFlow /></Reveal>
          <Reveal><InfrastructureDependency /></Reveal>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
};

export default InfrastructureArchitecturePage;
