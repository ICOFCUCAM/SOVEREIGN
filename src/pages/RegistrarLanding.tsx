import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import HudCorners from '@/components/HudCorners';
import Reveal from '@/components/Reveal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Search, Globe, Compass, Link2, Server, ShieldCheck, Network, Route, Cpu, Rocket, ArrowRight, Sparkles, Cloud, Crown,
} from 'lucide-react';
import { getTldPricing, formatPrice, type TldPrice } from '@/lib/registrar';

// ── Capabilities marketed on the registrar landing ──
const CAPABILITIES = [
  { icon: Globe, t: 'Domain registration', d: 'Live availability and transparent retail pricing across the sovereign namespace, direct on registrar-grade infrastructure.' },
  { icon: Compass, t: 'AI naming advisor', d: 'Describe the institution. The advisor proposes institution-grade names with deployment-aligned TLDs and a rationale for each.' },
  { icon: Network, t: 'Authoritative DNS', d: 'Production-grade DNS zones, nameservers and records — queued, audited and rate-limited end-to-end.' },
  { icon: ShieldCheck, t: 'SSL & integrity', d: 'Certificate provisioning, DNSSEC and policy-grade integrity baked into every connected domain.' },
  { icon: Cloud, t: 'Hosting & routing', d: 'Edge routing to your sovereign deployment — connect existing domains or operate on temporary sovereign subdomains.' },
  { icon: Cpu, t: 'Deployment continuity', d: 'Acquire → Register → Connect → Operate → Deploy as one continuous flow into the orchestration engine.' },
];

const PATHS = [
  { icon: Search, label: 'Literal search', desc: 'Direct namespace lookup with live pricing.', to: '/search' },
  { icon: Compass, label: 'Sovereign advisor', desc: 'AI deployment-identity strategy.', to: '/search' },
  { icon: Link2, label: 'Connect existing', desc: 'Bring an institutional domain.', to: '/search' },
  { icon: Server, label: 'Temporary deployment', desc: 'Deploy on a sovereign subdomain.', to: '/search' },
];

const LIFECYCLE = [
  { label: 'Acquire', desc: 'Discover or name the identity', icon: Search },
  { label: 'Register', desc: 'Claim the sovereign identity', icon: Globe },
  { label: 'Connect', desc: 'Delegate DNS · point nameservers', icon: Link2 },
  { label: 'Operate', desc: 'DNS · SSL · records', icon: Server, to: '/dns' },
  { label: 'Deploy', desc: 'Route to infrastructure', icon: Rocket, to: '/deploy' },
];

const RegistrarLanding: React.FC = () => {
  useDocumentTitle('Sovereign Domains', 'Sovereign domain infrastructure — registration, DNS, SSL and deployment routing on registrar-grade infrastructure.');
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [tlds, setTlds] = useState<TldPrice[]>([]);
  useEffect(() => { getTldPricing().then(setTlds).catch(() => {}); }, []);

  const go = (path?: string) => {
    const search = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    nav(`/search${search}${path ? `#${path}` : ''}`);
  };

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* ── Hero ── */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] text-cyan-300/80 kicker mb-6" style={{ letterSpacing: '0.28em' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign domain infrastructure
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-cinematic text-balance leading-[0.96] mb-5">
              The registrar for <span className="text-gradient-cyan">civilization-grade systems.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              Register, route and operate domains as infrastructure — not as commodities. Authoritative DNS, SSL, AI naming, and direct continuity into sovereign deployment.
            </p>
          </div>

          {/* ── Inline search ── */}
          <div className="relative max-w-2xl mx-auto mb-4">
            <HudCorners color="#00D9FF" className="opacity-30" />
            <div className="relative flex items-center glass-strong rounded-2xl px-5 py-1.5 border border-white/10 focus-within:border-cyan-400/50 transition-colors">
              <Search className="w-5 h-5 text-white/40 shrink-0" />
              <input
                aria-label="Search the sovereign domain namespace"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && go()}
                placeholder="Search the namespace, or describe your institution"
                className="flex-1 bg-transparent px-4 py-4 text-base sm:text-lg text-white placeholder:text-white/30 focus:outline-none font-mono"
                spellCheck={false} autoCapitalize="off" autoCorrect="off"
              />
              <button onClick={() => go()} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)' }}>
                Search <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] font-mono uppercase tracking-wider text-white/35 mb-16">
            Live availability · retail pricing · registrar-grade infrastructure
          </p>

          {/* ── Four paths ── */}
          <Reveal>
            <div className="mb-20">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Four coordinated paths</div>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-cinematic text-balance">Search, advise, connect, or deploy now.</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {PATHS.map((p, i) => (
                  <Link key={p.label} to={p.to} className="group relative rounded-2xl border border-white/8 bg-white/[0.015] p-5 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-cyan-400/30">
                    <p.icon className="w-5 h-5 text-cyan-300/70 mb-3" />
                    <div className="font-display font-semibold text-white flex items-center gap-2">{p.label}<ArrowRight className="w-3.5 h-3.5 text-cyan-300/50 group-hover:translate-x-0.5 transition-transform" /></div>
                    <div className="text-xs text-white/45 mt-1 leading-relaxed">{p.desc}</div>
                    <div className="absolute top-4 right-4 font-mono text-[10px] text-white/20">0{i + 1}</div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Capabilities ── */}
          <Reveal>
            <div className="mb-20">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Capabilities</div>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-cinematic text-balance">An integrated registrar stack.</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CAPABILITIES.map((c) => (
                  <div key={c.t} className="rounded-2xl border border-white/8 bg-white/[0.015] p-6 h-full transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/30">
                    <c.icon className="w-5 h-5 text-cyan-300/80 mb-4" />
                    <div className="font-display font-semibold text-white mb-2">{c.t}</div>
                    <div className="text-sm text-white/55 leading-relaxed">{c.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Pricing strip ── */}
          {tlds.length > 0 && (
            <Reveal>
              <div className="mb-20">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <div className="kicker text-cyan-300/70 mb-2" style={{ letterSpacing: '0.28em' }}>Indicative annual pricing</div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-cinematic text-white">The sovereign namespace.</h2>
                  </div>
                  <Link to="/search" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300">See all <ArrowRight className="w-4 h-4" /></Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {tlds.map((t) => (
                    <Link key={t.tld} to={`/search?q=${encodeURIComponent('your-brand.' + t.tld)}`} className="rounded-xl border border-white/8 bg-white/[0.015] px-3 py-3 text-center transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/30">
                      <div className="font-mono text-cyan-300/90 text-sm">.{t.tld}</div>
                      <div className="font-mono text-white/55 text-xs mt-1">{formatPrice(t.price, t.currency)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* ── Lifecycle ── */}
          <Reveal>
            <div className="mb-20">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>End-to-end continuity</div>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-cinematic text-balance">From acquisition to live infrastructure.</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {LIFECYCLE.map((s, i) => {
                  const inner = (
                    <div className="relative rounded-2xl border border-white/8 bg-white/[0.015] p-5 h-full transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-cyan-400/30">
                      <s.icon className="w-5 h-5 text-cyan-300/70 mb-3" />
                      <div className="font-display font-semibold text-white flex items-center gap-2">{s.label}{s.to && <ArrowRight className="w-3.5 h-3.5 text-cyan-300/50" />}</div>
                      <div className="text-xs text-white/45 mt-1 leading-relaxed">{s.desc}</div>
                      <div className="absolute top-4 right-4 font-mono text-[10px] text-white/20">0{i + 1}</div>
                    </div>
                  );
                  return s.to ? <Link key={s.label} to={s.to}>{inner}</Link> : <div key={s.label}>{inner}</div>;
                })}
              </div>
            </div>
          </Reveal>

          {/* ── Closing CTA ── */}
          <Reveal>
            <div className="relative glass-strong rounded-3xl p-10 text-center overflow-hidden">
              <div className="absolute -inset-10 blur-[120px] opacity-15 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #00D9FF, transparent 70%)' }} />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.28em' }}><Sparkles className="w-3.5 h-3.5" /> Begin</div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-cinematic text-balance leading-tight mb-4">
                  Acquire your sovereign identity.
                </h2>
                <p className="text-white/55 max-w-xl mx-auto mb-7">Search a name, talk to the advisor, or connect a domain you already control. Every path lands in the same operate-and-deploy console.</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to="/search" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>
                    Search the namespace <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/deployments" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 hover:border-white/25 transition">
                    Open the console <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300/70">
                  <Crown className="w-3 h-3" /> Registration opens soon · discovery, AI advisory & connection live now
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default RegistrarLanding;
