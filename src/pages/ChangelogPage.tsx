import React from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface Entry { date: string; tag: 'feature' | 'fix' | 'platform' | 'security'; title: string; body: string[]; }

const TAG_STYLE: Record<Entry['tag'], string> = {
  feature:  'bg-cyan-500/15 text-cyan-300',
  fix:      'bg-amber-500/15 text-amber-300',
  platform: 'bg-purple-500/15 text-purple-300',
  security: 'bg-emerald-500/15 text-emerald-300',
};

const ENTRIES: Entry[] = [
  {
    date: '2026-05-29',
    tag: 'feature',
    title: 'Emergency AI · multi-channel publishing + every video format',
    body: [
      'Real publishers wired for LinkedIn (UGC Posts), YouTube (resumable upload), and X (v2 tweets). Instagram and TikTok stay token-gated until business credentials are configured.',
      'render-video now accepts format presets (short_ad, social_vertical, social_square, long_film, custom) with operator-defined aspect ratio + duration.',
      'Studio surfaces a format chip selector and a multi-channel publisher with parallel fan-out and per-channel result toasts.',
    ],
  },
  {
    date: '2026-05-29',
    tag: 'platform',
    title: 'Emergency AI · production pipeline, subscriptions, marketing surface',
    body: [
      'Studio ported from the main Admin pipeline — full Produce-long-film + per-scene seeds + Render film workflow against the shared backend.',
      'Subscription system end-to-end: subscriptions table with RLS, subscription-checkout + subscription-portal edge functions, Stripe webhook handlers for subscription lifecycle.',
      'Pricing, docs (5 articles), legal (terms + privacy), and developer-portal pages added.',
    ],
  },
  {
    date: '2026-05-29',
    tag: 'platform',
    title: 'Homepage · acquisition terminal now sources featured infrastructure',
    body: [
      'EcosystemPanels.AcquisitionTerminal reads the five featured infrastructure assets (National Shell, TreasuryOS, Veritas Operations, EmergencyOS, USA Relocation) instead of top domains.',
      'MarketplaceTeaser ticker reverts to its original domain-only stream.',
    ],
  },
  {
    date: '2026-05-28',
    tag: 'feature',
    title: 'Restructured homepage capability layers + hero scale-up',
    body: [
      'AppLayout restored to cinematic act flow; hero headline scaled up.',
      'MarketplaceTeaser ticker streams featured infrastructure assets interleaved with domains.',
    ],
  },
  {
    date: '2026-05-27',
    tag: 'feature',
    title: 'Logistics & transport marketplace upgrade',
    body: [
      'Sixteen country relocation marketplaces re-framed as institutional acquisition opportunities (RelocationMarketplaceCard).',
      'Featured Acquisition Opportunity treatment on Norway, Denmark, Belgium, Czech.',
    ],
  },
  {
    date: '2026-05-26',
    tag: 'security',
    title: 'Dual-path domain orders + Stripe auth-hold',
    body: [
      'domain-checkout (Stripe self-service + invoice paths), stripe-webhook (HMAC-verified), domain-register (admin auth-hold capture/void).',
      'Owner-scoped RLS on domain_orders; BuyDomainModal + DomainOrdersAdmin surfaces.',
    ],
  },
];

const ChangelogPage: React.FC = () => {
  useDocumentTitle('Changelog', 'What shipped on the SOVEREIGN platform — features, fixes, and security updates.');
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Changelog</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.96] mb-4">
              What's <span className="text-gradient-cyan">shipping.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              Public log of features, fixes, and platform changes. Sorted by deployment date.
            </p>
          </div>

          <div className="space-y-10">
            {ENTRIES.map((e) => (
              <article key={`${e.date}-${e.title}`} className="border-l border-white/10 pl-6 -ml-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35 tabular-nums">{e.date}</span>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded tracking-wider ${TAG_STYLE[e.tag]}`}>{e.tag}</span>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight mb-3">{e.title}</h2>
                <ul className="space-y-2 text-sm text-white/65 leading-relaxed">
                  {e.body.map((b, i) => <li key={i} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-px before:w-2.5 before:bg-cyan-300/40">{b}</li>)}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-16 text-center text-sm text-white/40">
            Subscribe for releases at <Link to="/admin" className="text-cyan-300 hover:text-white">Command Center</Link>.
          </div>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default ChangelogPage;
