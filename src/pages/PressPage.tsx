import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Download, ExternalLink } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const PressPage: React.FC = () => {
  useDocumentTitle('Press', 'Press resources, brand assets, and contact for journalists and analysts covering SOVEREIGN.');
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Press</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96] mb-5">
              For <span className="text-gradient-cyan">journalists.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              Resources for press, analysts, and editorial partners covering the SOVEREIGN platform.
            </p>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.015] p-7">
            <h2 className="font-display text-2xl font-bold">About SOVEREIGN</h2>
            <p className="mt-4 text-white/65 leading-relaxed">
              SOVEREIGN is the operating layer for digital civilization — sovereign domain intelligence, AI-native deployment infrastructure, and deployable digital institutions, engineered for institutions, brands and governments operating at planetary scale.
            </p>
            <p className="mt-3 text-white/55 leading-relaxed">
              The platform brings together a registrar, an authoritative DNS mesh, the Emergency AI cinematic intelligence layer, an institutional marketplace, and a sovereign-grade deployment console under one console.
            </p>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.015] p-7">
            <h2 className="font-display text-2xl font-bold">Quick facts</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-[200px_1fr] text-sm">
              <dt className="text-[10px] uppercase tracking-[0.22em] text-white/40">Founded</dt><dd className="text-white">2025</dd>
              <dt className="text-[10px] uppercase tracking-[0.22em] text-white/40">Headquartered</dt><dd className="text-white">Sovereign infrastructure — distributed</dd>
              <dt className="text-[10px] uppercase tracking-[0.22em] text-white/40">Deployment regions</dt><dd className="text-white">23 operational zones</dd>
              <dt className="text-[10px] uppercase tracking-[0.22em] text-white/40">Tagline</dt><dd className="text-white italic">The operating layer for digital civilization</dd>
            </dl>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.015] p-7">
            <h2 className="font-display text-2xl font-bold">Brand assets</h2>
            <p className="mt-3 text-sm text-white/55">Logo lockups and brand colours. Editorial use only — derivatives require approval.</p>
            <div className="mt-5 flex flex-wrap gap-3 text-[13px]">
              <a href="/sovereign-logo.png" download className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white">
                <Download className="w-3.5 h-3.5" /> Wordmark (PNG)
              </a>
              <a href="/favicon.png" download className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white">
                <Download className="w-3.5 h-3.5" /> Mark (PNG)
              </a>
              <Link to="/changelog" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white">
                <ExternalLink className="w-3.5 h-3.5" /> Recent releases
              </Link>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.015] p-7">
            <h2 className="font-display text-2xl font-bold">Editorial contact</h2>
            <a className="mt-3 inline-flex items-center gap-2 text-cyan-300 hover:text-white" href="mailto:press@sovereigndo.com">
              <Mail className="w-4 h-4" /> press@sovereigndo.com
            </a>
            <p className="mt-3 text-xs text-white/40">Response within one business day. Embargoes honoured.</p>
          </section>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default PressPage;
