import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Cpu, Shield, History, Sparkles, GitBranch } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface DocCard {
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  title: string;
  desc: string;
  to: string;
  external?: boolean;
}

const CARDS: DocCard[] = [
  {
    icon: Cpu,
    section: 'API',
    title: 'Developer Portal',
    desc: 'Public edge-function surface — domain search, AI naming, DNS mutations, video render, multi-channel publish, subscriptions.',
    to: '/developer',
  },
  {
    icon: Sparkles,
    section: 'Emergency AI',
    title: 'Cinematic intelligence',
    desc: 'Production pipelines, multi-channel distribution, subscription billing — the Emergency AI platform docs.',
    to: '/emergency-ai',
  },
  {
    icon: Shield,
    section: 'Trust',
    title: 'Security',
    desc: 'Tenant isolation, encryption, audit logs, webhook integrity, and institutional deployment options.',
    to: '/security',
  },
  {
    icon: History,
    section: 'Releases',
    title: 'Changelog',
    desc: 'What shipped on the platform — features, fixes, and security updates.',
    to: '/changelog',
  },
  {
    icon: GitBranch,
    section: 'Operate',
    title: 'Pricing & plans',
    desc: 'Three sovereign tiers from starter deployments to single-tenant nation-scale isolation.',
    to: '/pricing',
  },
  {
    icon: BookOpen,
    section: 'Network',
    title: 'Ecosystem atlas',
    desc: 'The deployable institutions catalogue — governance, finance, mobility, intelligence, elections.',
    to: '/ecosystem',
  },
];

const DocsHubPage: React.FC = () => {
  useDocumentTitle('Docs', 'The SOVEREIGN documentation hub — developer API, security, changelog, and the institutional ecosystem atlas.');
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Documentation</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96] mb-5">
              Build with <span className="text-gradient-cyan">SOVEREIGN.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              Reference, runbooks, and architecture for the operating layer. Start where you need to.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CARDS.map((c) => {
              const Inner = (
                <div className="group relative h-full rounded-2xl border border-white/10 bg-white/[0.015] p-6 ease-cinematic transition-all duration-500 hover:-translate-y-1 hover:border-white/25 overflow-hidden">
                  <span className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[60px] opacity-[0.12] group-hover:opacity-[0.25] transition-opacity" style={{ background: '#00D9FF' }} />
                  <div className="relative">
                    <c.icon className="w-5 h-5 text-cyan-300" />
                    <div className="kicker text-cyan-300/60 mt-4 text-[9px]" style={{ letterSpacing: '0.28em' }}>{c.section}</div>
                    <h2 className="mt-2 font-display text-xl font-bold tracking-tight">{c.title}</h2>
                    <p className="mt-2 text-sm text-white/55 leading-relaxed">{c.desc}</p>
                    <div className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-cyan-300/80 group-hover:text-white transition">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
              return c.external
                ? <a key={c.title} href={c.to} target="_blank" rel="noreferrer">{Inner}</a>
                : <Link key={c.title} to={c.to}>{Inner}</Link>;
            })}
          </div>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default DocsHubPage;
