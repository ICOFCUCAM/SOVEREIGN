import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Platform-wide pricing — for the SOVEREIGN deployment stack itself. Emergency
// AI plans are separate and live at /emergency-ai → /pricing on that surface.
interface Tier {
  id: string;
  name: string;
  tagline: string;
  monthly: string;        // displayable price (string so "Custom" works)
  highlight?: string;
  features: string[];
  cta: { label: string; to: string };
}

const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Sovereign Starter',
    tagline: 'For institutions deploying their first sovereign system.',
    monthly: '$490',
    features: [
      'One sovereign deployment (testnet or production)',
      'AI domain valuation + naming advisor',
      'Authoritative DNS on the sovereign mesh',
      'Public marketplace listing',
      '24h support response',
    ],
    cta: { label: 'Start a deployment', to: '/deploy' },
  },
  {
    id: 'operator',
    name: 'Sovereign Operator',
    tagline: 'For agencies and ministries running active production stacks.',
    monthly: '$2,900',
    highlight: 'Most institutions start here',
    features: [
      'Up to 25 production deployments',
      'Multi-region edge mesh + DNSSEC',
      'Dedicated registrar handle',
      'Briefings & valuation suite',
      'Channel + media studio access',
      '1h support · named success lead',
    ],
    cta: { label: 'Talk to operations', to: '/admin' },
  },
  {
    id: 'sovereign',
    name: 'Sovereign Nation',
    tagline: 'Civilisation-scale isolation for nations and institutions.',
    monthly: 'Custom',
    features: [
      'Unlimited deployments and seats',
      'Single-tenant cloud + bring-your-own keys',
      'Dedicated registrar infrastructure',
      'Custom narrative & briefing layer',
      'On-prem agents available',
      '24/7 sovereign continuity support',
    ],
    cta: { label: 'Request a briefing', to: '/admin' },
  },
];

const PricingPage: React.FC = () => {
  useDocumentTitle('Pricing', 'Sovereign infrastructure pricing — three tiers from starter deployments to single-tenant sovereign isolation.');
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Pricing</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96] mb-6">
              One platform. <span className="text-gradient-cyan">Sovereign tiers.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              Transparent pricing from a first deployment to civilisation-scale isolation. Switch tiers or cancel any time.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {TIERS.map((t) => (
              <div key={t.id} className={`relative rounded-2xl border ${t.highlight ? 'border-cyan-400/40 bg-cyan-400/[0.03] shadow-[0_30px_70px_-30px_rgba(0,217,255,0.3)]' : 'border-white/10 bg-white/[0.015]'} p-7 flex flex-col`}>
                {t.highlight && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-cyan-400 text-[10px] font-semibold tracking-[0.22em] text-[#05071A] px-3 py-1 uppercase">
                    {t.highlight}
                  </span>
                )}
                <div className="kicker text-cyan-300/70" style={{ letterSpacing: '0.3em' }}>{t.name.split(' ')[1]?.toUpperCase()}</div>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">{t.name}</h2>
                <p className="mt-2 text-sm text-white/55">{t.tagline}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold tabular-nums">{t.monthly}</span>
                  {t.monthly !== 'Custom' && <span className="text-sm text-white/40">/ month</span>}
                </div>
                <Link
                  to={t.cta.to}
                  className={`mt-7 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5 ${t.highlight ? 'text-white' : 'border border-white/15 text-white/80 hover:bg-white/5 hover:text-white'}`}
                  style={t.highlight ? { background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' } : undefined}
                >
                  {t.cta.label}
                </Link>
                <ul className="mt-7 space-y-3 border-t border-white/10 pt-6 text-sm text-white/75">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 w-4 h-4 text-cyan-300 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-3xl mx-auto text-center rounded-2xl border border-white/10 bg-white/[0.012] p-8">
            <h2 className="font-display text-2xl font-bold">Looking for Emergency AI?</h2>
            <p className="mt-3 text-white/55 text-sm max-w-xl mx-auto">
              The Emergency AI cinematic intelligence platform has its own subscription tiers — from a free Evaluator sandbox to single-tenant Institutional deployments.
            </p>
            <Link to="/emergency-ai" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white transition">
              See Emergency AI plans →
            </Link>
          </div>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default PricingPage;
