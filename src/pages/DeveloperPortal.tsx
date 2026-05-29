import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import HudCorners from '@/components/HudCorners';
import AuthModal from '@/components/AuthModal';
import Reveal from '@/components/Reveal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import {
  Lock, Cpu, KeyRound, Code2, Terminal, Copy, ChevronDown, ArrowRight, ShieldCheck, BadgeCheck, FileText, Activity,
} from 'lucide-react';

// Public edge-function base. Auth uses the standard Supabase JWT (anon for
// public ops, the user's session JWT for owner-scoped ops).
const API_BASE = 'https://qvjdivcdefuprnenedje.supabase.co/functions/v1';

interface Endpoint {
  fn: string;
  title: string;
  desc: string;
  auth: 'anon' | 'user' | 'admin';
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    fn: 'domain-search',
    title: 'Domain availability + retail pricing',
    desc: 'Live registrar-grade lookup. Actions: search (label → exact + intelligent alternatives), check (explicit domains), tld-pricing (sovereign namespace).',
    auth: 'anon',
    example: `curl -s ${API_BASE}/domain-search \\
  -H 'Content-Type: application/json' \\
  -d '{"action":"search","query":"national-treasury"}'`,
  },
  {
    fn: 'domain-suggest',
    title: 'AI sovereign naming advisor',
    desc: 'Claude-powered institutional naming with deployment-aligned TLDs. Pass a brief; optionally a deployment context (e.g. "Electoral System") to bias strategy.',
    auth: 'anon',
    example: `curl -s ${API_BASE}/domain-suggest \\
  -H 'Content-Type: application/json' \\
  -d '{"prompt":"national digital treasury","context":"Government OS","count":12}'`,
  },
  {
    fn: 'connect-domain',
    title: 'Connect an institutional domain (TXT challenge)',
    desc: 'Prove control of an externally-registered domain via a DNS TXT challenge, then operate its DNS on sovereign infrastructure. Actions: init, verify, nameservers.',
    auth: 'user',
    example: `curl -s ${API_BASE}/connect-domain \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '{"action":"init","domain":"gov.country"}'`,
  },
  {
    fn: 'op-customer',
    title: 'Mint Openprovider customer handle',
    desc: 'Create a registry customer handle from an owned registrant profile. Ownership enforced via the caller JWT (RLS).',
    auth: 'user',
    example: `curl -s ${API_BASE}/op-customer \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '{"profile_id":"<uuid>"}'`,
  },
  {
    fn: 'dns-service',
    title: 'DNS mutations (zones · records · nameservers)',
    desc: 'Owner-scoped DNS operations enqueued onto the sovereign async pipeline. Actions: create-zone, delete-zone, modify-records, create-nameserver, update-nameservers.',
    auth: 'user',
    example: `curl -s ${API_BASE}/dns-service \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '{"action":"create-zone","name":"example.com","type":"master"}'`,
  },
  {
    fn: 'render-video',
    title: 'Render a video (Emergency AI)',
    desc: 'Image-to-video pipeline. Format presets: short_ad, social_vertical (9:16), social_square (1:1), long_film, custom. Optional aspectRatio + duration override the preset.',
    auth: 'user',
    example: `curl -s ${API_BASE}/render-video \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '{"script":"A 10-second cinematic teaser…","format":"social_vertical","duration":10}'`,
  },
  {
    fn: 'orchestrate-film',
    title: 'Long film orchestration',
    desc: 'Brief → 2–6 scenes → per-scene image → Runway motion → narration. Returns the parent film job id; scene jobs render asynchronously.',
    auth: 'user',
    example: `curl -s ${API_BASE}/orchestrate-film \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '{"brief":"A film about sovereign infrastructure.","scenes":4}'`,
  },
  {
    fn: 'post-campaign',
    title: 'Multi-channel publish',
    desc: 'Fan a campaign out to LinkedIn, YouTube, and X in parallel. One pipeline_job is recorded per platform; the parent campaign is marked published if any succeeded.',
    auth: 'user',
    example: `curl -s ${API_BASE}/post-campaign \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '{"campaign_id":"<uuid>","channels":["linkedin","x","youtube"]}'`,
  },
  {
    fn: 'subscription-checkout',
    title: 'Start a subscription (Emergency AI)',
    desc: 'Creates a Stripe Checkout Session in subscription mode. Returns a URL to redirect the operator to.',
    auth: 'user',
    example: `curl -s ${API_BASE}/subscription-checkout \\
  -H 'Authorization: Bearer <USER_JWT>' \\
  -H 'Content-Type: application/json' \\
  -d '{"plan":"operator","user_id":"<uuid>","email":"you@org.com"}'`,
  },
];

const authChip = (a: Endpoint['auth']) => {
  const map = {
    anon: { c: 'bg-emerald-500/15 text-emerald-300', t: 'Public' },
    user: { c: 'bg-cyan-500/15 text-cyan-300', t: 'User JWT' },
    admin: { c: 'bg-amber-500/15 text-amber-300', t: 'Admin' },
  } as const;
  const v = map[a];
  return <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded tracking-wider ${v.c}`}>{v.t}</span>;
};

const copyText = (s: string) => navigator.clipboard?.writeText(s).then(() => toast.success('Copied'));

const DeveloperPortal: React.FC = () => {
  useDocumentTitle('Developer Portal', 'Sovereign domain API — endpoints, authentication and code samples for institutional integrators.');
  const { user, loading } = useAuth();
  const [auth, setAuth] = useState<null | 'signin' | 'signup'>(null);

  if (!loading && !user) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" /><PlatformNav />
        <main className="pt-40 pb-32 px-4 text-center max-w-lg mx-auto">
          <span className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-cyan-500/10 border border-cyan-400/20"><Lock className="w-6 h-6 text-cyan-300" /></span>
          <h1 className="font-display text-3xl font-bold tracking-cinematic mb-3">Developer access required</h1>
          <p className="text-white/55 mb-7">The Developer Portal is reserved for subscribed institutional integrators. Sign in to view the API surface, authentication model and integration samples.</p>
          <button onClick={() => setAuth('signin')} className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>Sign in</button>
        </main>
        <PlatformFooter />
        {auth && <AuthModal initialMode={auth} onClose={() => setAuth(null)} />}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* ── Hero ── */}
          <div className="mb-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] text-cyan-300/80 kicker mb-5" style={{ letterSpacing: '0.28em' }}>
              <Cpu className="w-3.5 h-3.5" /> Sovereign domain API
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.96] mb-4">Developer Portal.</h1>
            <p className="text-white/55 text-lg leading-relaxed">One sovereign API surface for domain discovery, AI naming, registrar operations, DNS infrastructure and deployment continuity — integrate directly from institutional systems.</p>
          </div>

          {/* ── Base URL strip ── */}
          <div className="relative glass-strong rounded-2xl p-5 mb-10 overflow-hidden">
            <HudCorners color="#00D9FF" className="opacity-25" />
            <div className="relative flex items-center gap-3">
              <Terminal className="w-4 h-4 text-cyan-300/80 shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">API base</span>
              <code className="font-mono text-sm text-white truncate flex-1">{API_BASE}</code>
              <button aria-label="Copy base URL" onClick={() => copyText(API_BASE)} className="shrink-0 text-white/35 hover:text-cyan-300 transition-colors"><Copy className="w-4 h-4" /></button>
            </div>
          </div>

          {/* ── Authentication ── */}
          <Reveal>
            <div className="mb-12">
              <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Authentication</div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-cinematic mb-6">Three layers of access.</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5">
                  <div className="flex items-center gap-2 mb-3">{authChip('anon')}</div>
                  <div className="font-display font-semibold text-white mb-1">Public ops</div>
                  <div className="text-sm text-white/55 leading-relaxed">Discovery + AI advisor — anon Supabase JWT. No user state mutated.</div>
                </div>
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.05] p-5">
                  <div className="flex items-center gap-2 mb-3">{authChip('user')}</div>
                  <div className="font-display font-semibold text-white mb-1">Owner-scoped</div>
                  <div className="text-sm text-white/55 leading-relaxed">Connect, register, DNS, registrant identities — pass the user's session JWT. RLS enforces ownership end-to-end.</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5">
                  <div className="flex items-center gap-2 mb-3">{authChip('admin')}</div>
                  <div className="font-display font-semibold text-white mb-1">Admin</div>
                  <div className="text-sm text-white/55 leading-relaxed">Tenant-wide reads and platform operations — service-role only, never exposed to the browser.</div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── Endpoint reference ── */}
          <Reveal>
            <div className="mb-12">
              <div className="kicker text-cyan-300/70 mb-3" style={{ letterSpacing: '0.28em' }}>Endpoints</div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-cinematic mb-6">The sovereign API surface.</h2>
              <div className="rounded-2xl border border-white/8 bg-white/[0.015] divide-y divide-white/5 overflow-hidden">
                {ENDPOINTS.map((e) => (
                  <details key={e.fn} className="group">
                    <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                      <Code2 className="w-4 h-4 text-cyan-300/70 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm text-white truncate">POST /{e.fn}</div>
                        <div className="text-[11px] text-white/45 truncate">{e.title}</div>
                      </div>
                      {authChip(e.auth)}
                      <ChevronDown className="w-4 h-4 text-cyan-300/70 transition-transform duration-300 group-open:rotate-180 shrink-0" />
                    </summary>
                    <div className="px-5 pb-5 space-y-4">
                      <p className="text-sm text-white/60 leading-relaxed">{e.desc}</p>
                      <div className="relative rounded-xl border border-white/10 bg-black/40 p-4 overflow-hidden">
                        <button aria-label="Copy example" onClick={() => copyText(e.example)} className="absolute top-3 right-3 text-white/35 hover:text-cyan-300 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                        <pre className="font-mono text-[12px] text-white/80 leading-relaxed whitespace-pre-wrap break-all">{e.example}</pre>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Trust / SLA strip ── */}
          <Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
              {[
                { icon: ShieldCheck, t: 'DNSSEC default', d: 'All authoritative zones signed.' },
                { icon: FileText, t: 'Audited operations', d: 'Every mutation logged immutably.' },
                { icon: Activity, t: 'Queued · retried', d: 'Async pipeline with backoff + rate limit.' },
                { icon: BadgeCheck, t: 'Owner-scoped', d: 'RLS-isolated by default at every layer.' },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-white/8 bg-white/[0.015] p-4">
                  <x.icon className="w-4 h-4 text-cyan-300/80 mb-2" />
                  <div className="font-semibold text-white text-sm">{x.t}</div>
                  <div className="text-[11px] text-white/45 leading-snug mt-0.5">{x.d}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* ── Token info ── */}
          <Reveal>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-6">
              <div className="flex items-center gap-2 kicker text-cyan-300/80 mb-3"><KeyRound className="w-3.5 h-3.5" /> Where to find your tokens</div>
              <p className="text-sm text-white/65 leading-relaxed mb-4">
                For public discovery you can use the Supabase <span className="font-mono text-white/80">anon</span> publishable key.
                For owner-scoped operations, pass the user's session JWT (issued by sovereign auth) in <span className="font-mono text-white/80">Authorization: Bearer &lt;USER_JWT&gt;</span>.
                Service-role keys never leave the backend.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/command-center" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)' }}>Open Command Center <ArrowRight className="w-4 h-4" /></Link>
                <Link to="/search" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-white/80 hover:text-white text-sm font-semibold">Try the API surface <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default DeveloperPortal;
