import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import BriefingModal from '@/components/BriefingModal';
import ContactModal from '@/components/ContactModal';
import { resolveTenant, isRegistrarHost, PLATFORM_ORIGIN } from '@/lib/tenant';

// Registrar surfaces link cross-host back to the main ecosystem; default to the
// canonical sovereigndo.com origin when no PLATFORM_ORIGIN env is configured.
const IS_REGISTRAR = isRegistrarHost(resolveTenant().hostname);
const PLATFORM_HOME = (PLATFORM_ORIGIN || 'https://sovereigndo.com').replace(/\/$/, '');
const REGISTRAR_LANDING_URL = (import.meta.env.VITE_REGISTRAR_LANDING_URL as string | undefined) || '/sovereign-domains';
const MEDIA_LANDING_URL = (import.meta.env.VITE_MEDIA_LANDING_URL as string | undefined) || 'https://emergency.sovereigndo.com';

type FooterLink = { label: string; to: string };

const PLATFORM_COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: 'Platform',
    links: [
      { label: 'Infrastructure', to: '/infrastructure' },
      { label: 'Marketplace', to: '/marketplace' },
      { label: 'Ecosystem', to: '/ecosystem' },
      { label: 'Channel', to: '/channel' },
      { label: 'Films', to: '/films' },
      { label: 'AI Valuation', to: '/valuation' },
      { label: 'Branding Studio', to: '/studio' },
    ],
  },
  {
    title: 'Featured infrastructures',
    links: [
      { label: 'CivicOS', to: '/systems/civicos' },
      { label: 'Veritas OS', to: '/systems/veritas-os' },
      { label: 'Veritas Financial', to: '/systems/veritas-banking' },
      { label: 'ELECPRO', to: '/systems/elecpro' },
      { label: 'Veritas Operations', to: '/systems/veritas-operations' },
      { label: 'Sovereign Dispatch', to: '/systems/sovereign-dispatch' },
      { label: 'Emergency AI', to: MEDIA_LANDING_URL },
    ],
  },
  {
    title: 'Operate',
    links: [
      { label: 'Pricing', to: '/pricing' },
      { label: 'Security', to: '/security' },
      { label: 'Status', to: '/status' },
      { label: 'Changelog', to: '/changelog' },
      { label: 'Docs', to: '/docs' },
      { label: 'Developer Portal', to: '/developer' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Press', to: '/press' },
      { label: 'Sovereign Domains', to: REGISTRAR_LANDING_URL },
      { label: 'Command Center', to: '/admin' },
      { label: 'Terms of service', to: '/legal/terms' },
      { label: 'Privacy policy', to: '/legal/privacy' },
    ],
  },
];

const REGISTRAR_COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: 'Domain platform',
    links: [
      { label: 'Sovereign Domains', to: '/' },
      { label: 'Search the namespace', to: '/search' },
      { label: 'Connect existing domain', to: '/search#connect' },
      { label: 'Temporary deployment', to: '/search#temporary' },
      { label: 'Domain landing preview', to: '/d/veritasos.ai' },
    ],
  },
  {
    title: 'Subscribed access',
    links: [
      { label: 'Command Center', to: '/command-center' },
      { label: 'Developer Portal', to: '/developer' },
      { label: 'DNS console', to: '/dns' },
      { label: 'Registrant identities', to: '/registrants' },
      { label: 'Deployments console', to: '/deployments' },
      { label: 'Deployment orchestrator', to: '/deploy' },
    ],
  },
  {
    title: 'Sovereign ecosystem',
    links: [
      { label: 'Sovereign Platform', to: `${PLATFORM_HOME}/` },
      { label: 'Emergency AI', to: MEDIA_LANDING_URL.startsWith('http') ? MEDIA_LANDING_URL : `${PLATFORM_HOME}${MEDIA_LANDING_URL}` },
      { label: 'Ecosystem', to: `${PLATFORM_HOME}/ecosystem` },
      { label: 'Marketplace', to: `${PLATFORM_HOME}/marketplace` },
      { label: 'AI Valuation', to: `${PLATFORM_HOME}/valuation` },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Press', to: `${PLATFORM_HOME}/press` },
      { label: 'Status', to: `${PLATFORM_HOME}/status` },
      { label: 'Terms of service', to: `${PLATFORM_HOME}/legal/terms` },
      { label: 'Privacy policy', to: `${PLATFORM_HOME}/legal/privacy` },
    ],
  },
];

const COLUMNS = IS_REGISTRAR ? REGISTRAR_COLUMNS : PLATFORM_COLUMNS;

const renderLink = (l: FooterLink) => {
  const cls = 'text-[13px] text-white/55 hover:text-white transition-colors duration-200';
  return /^https?:\/\//.test(l.to)
    ? <a href={l.to} target="_blank" rel="noreferrer" className={cls}>{l.label}</a>
    : <Link to={l.to} className={cls}>{l.label}</Link>;
};

const StatusPill: React.FC = () => (
  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.04] text-[10px] font-mono uppercase tracking-[0.22em] text-emerald-300/85">
    <span className="relative flex w-1.5 h-1.5">
      <span className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
      <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
    </span>
    All systems operational
  </span>
);

const PlatformFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState(false);
  const [contact, setContact] = useState(false);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());

  useEffect(() => { setYear(new Date().getFullYear()); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch('https://famous.ai/api/crm/6a122e7fba2cb2e96599de96/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer-signup', tags: ['platform-newsletter', 'sovereign-os'] }),
      });
    } catch { /* best-effort */ }
    setSent(true);
    setEmail('');
    setLoading(false);
  };

  return (
    <footer className="relative mt-32 border-t border-white/8 bg-[#04060F]">
      {/* Top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <div className="pt-20 pb-14 grid gap-12 lg:gap-20 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          {/* Brand & statement */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img src="/sovereign-logo.png" alt="" aria-hidden className="w-9 h-9 object-contain drop-shadow-[0_0_14px_rgba(0,194,255,0.35)] transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="leading-none">
                <div className="font-display text-white text-[17px] font-bold tracking-[0.08em]">SOVEREIGN</div>
                <div className="mt-1 text-[10px] font-mono tracking-[0.32em] text-cyan-300/55 uppercase">
                  {IS_REGISTRAR ? 'Sovereign Domain Infrastructure' : 'Institutional Infrastructure Platform'}
                </div>
              </div>
            </Link>

            <p className="mt-7 text-[15px] leading-[1.75] text-white/55 max-w-[36rem]">
              {IS_REGISTRAR
                ? 'Sovereign domain infrastructure — registration, authoritative DNS, SSL and deployment routing for civilization-grade systems.'
                : 'A platform for building, operating, deploying and governing institutional-grade infrastructures. Deploy individually. Operate together.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-mono uppercase tracking-[0.22em] text-white/35">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300/70" />
                Sovereign jurisdiction
              </span>
              <span>Continuous audit posture</span>
              <span>Tenant isolation</span>
            </div>
          </div>

          {/* Newsletter & briefing */}
          <div className="lg:pl-12 lg:border-l lg:border-white/8">
            <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-cyan-300/65">Institutional dispatch</div>
            <h3 className="mt-3 font-display text-2xl text-white tracking-tight leading-snug">
              Briefings and product dispatches, sent sparingly.
            </h3>
            <p className="mt-3 text-[14px] text-white/50 leading-relaxed max-w-md">
              For deployment notes, security advisories and architecture briefings from the Sovereign operations team.
            </p>

            <form onSubmit={submit} className="mt-7 flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                  placeholder="operations@yourorg.com"
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/60 focus:bg-white/[0.06] focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || sent}
                className="px-5 py-3 rounded-lg bg-white text-[#04060F] text-sm font-semibold inline-flex items-center gap-2 hover:bg-cyan-100 disabled:opacity-60 transition"
              >
                {sent ? <><CheckCircle2 className="w-4 h-4" /> Subscribed</> : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-4 text-[12px]">
              <button
                onClick={() => setBrief(true)}
                className="group inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold transition"
              >
                Request a sovereign briefing
                <ArrowRight className="w-3.5 h-3.5 text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <span className="hidden sm:inline-block w-px h-3 bg-white/15" aria-hidden />
              <button onClick={() => setContact(true)} className="hidden sm:inline-flex text-white/45 hover:text-white/80 transition">
                Institutional contact
              </button>
            </div>
          </div>
        </div>

        {/* ── Link columns ────────────────────────────────────────────── */}
        <div className="border-t border-white/8 py-14 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40 mb-5">
                {col.title}
              </div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>{renderLink(l)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Colophon ────────────────────────────────────────────────── */}
        <div className="border-t border-white/8 py-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="text-[11px] font-mono tracking-[0.18em] text-white/40">
              © {year} SOVEREIGN INSTITUTIONS · ALL RIGHTS RESERVED
            </span>
            <StatusPill />
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-white/50">
            <Link to="/legal/terms" className="hover:text-white transition">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-white transition">Privacy</Link>
            <Link to="/security" className="hover:text-white transition">Security</Link>
            <Link to="/status" className="hover:text-white transition">Status</Link>
            <span className="inline-flex items-center gap-1.5 text-white/35 font-mono text-[10px] uppercase tracking-[0.22em]">
              Multi-region · Sovereign-grade
            </span>
          </nav>
        </div>
      </div>

      {brief && <BriefingModal systemName="SOVEREIGN" slug="platform" accent="#00C2FF" onClose={() => setBrief(false)} />}
      {contact && <ContactModal purpose="institutional" onClose={() => setContact(false)} />}
    </footer>
  );
};

export default PlatformFooter;
