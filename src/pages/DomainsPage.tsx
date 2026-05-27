import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import HudCorners from '@/components/HudCorners';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { Search, Check, X, Sparkles, ArrowRight, ShieldCheck, Globe, Server, Rocket, Loader2, Crown, Copy } from 'lucide-react';
import { searchDomains, getTldPricing, formatPrice, type DomainResult, type SearchResponse, type TldPrice } from '@/lib/registrar';
import { resolveTenant, isRegistrarHost } from '@/lib/tenant';

// On domains.sovereign.so the namespace is a commercial registrar product; on
// the main ecosystem it is an infrastructure identity layer, not a product.
const IS_REGISTRAR = isRegistrarHost(resolveTenant().hostname);

const FLOW = [
  { icon: Search, label: 'Acquire', desc: 'Discover the namespace' },
  { icon: Globe, label: 'Register', desc: 'Claim sovereign identity' },
  { icon: Server, label: 'Operate', desc: 'DNS · nameservers · SSL', to: '/dns' },
  { icon: Rocket, label: 'Deploy', desc: 'Route to infrastructure', to: '/deploy' },
];

const cache = new Map<string, SearchResponse>();

const StatusPill: React.FC<{ r: DomainResult }> = ({ r }) => (
  r.available
    ? <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300"><Check className="w-3 h-3" /> Available</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/40"><X className="w-3 h-3" /> Taken</span>
);

const DomainRow: React.FC<{ r: DomainResult; primary?: boolean }> = ({ r, primary }) => {
  const reserve = () => toast.success(`${r.domain} noted`, { description: 'Sovereign registration opens soon — discovery only for now.' });
  return (
    <div className={`flex items-center gap-4 px-5 ${primary ? 'py-4' : 'py-3'} ${primary ? 'bg-white/[0.02]' : ''}`}>
      <Globe className={`w-4 h-4 shrink-0 ${r.available ? 'text-cyan-300/70' : 'text-white/25'}`} />
      <div className="min-w-0 flex-1">
        <div className={`font-mono truncate ${primary ? 'text-base text-white' : 'text-sm text-white/90'}`}>
          {r.domain}
          {r.premium && <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 align-middle"><Crown className="w-2.5 h-2.5" /> Premium</span>}
        </div>
      </div>
      <button
        aria-label={`Copy ${r.domain}`}
        onClick={() => { navigator.clipboard?.writeText(r.domain).then(() => toast.success(`${r.domain} copied`)).catch(() => {}); }}
        className="shrink-0 text-white/25 hover:text-cyan-300 transition-colors"
      ><Copy className="w-3.5 h-3.5" /></button>
      <StatusPill r={r} />
      <div className="text-right shrink-0 w-24">
        <div className={`font-mono ${r.available ? 'text-white' : 'text-white/30'} ${primary ? 'text-base' : 'text-sm'}`}>{formatPrice(r.price, r.currency)}</div>
        <div className="text-[9px] font-mono uppercase tracking-wider text-white/30">/ yr</div>
      </div>
      <button
        onClick={reserve}
        disabled={!r.available}
        className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${r.available ? 'text-white hover:-translate-y-0.5' : 'text-white/30 cursor-not-allowed border border-white/5'}`}
        style={r.available ? { background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 10px 30px -12px rgba(0,194,255,0.5)' } : undefined}
      >
        {r.available ? 'Reserve' : '—'}
      </button>
    </div>
  );
};

const Skeleton: React.FC = () => (
  <div className="divide-y divide-white/5">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
        <div className="w-4 h-4 rounded bg-white/10" />
        <div className="h-3 rounded bg-white/10 flex-1 max-w-[40%]" />
        <div className="h-4 w-20 rounded bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/10" />
        <div className="h-8 w-20 rounded-lg bg-white/10" />
      </div>
    ))}
  </div>
);

const DomainsPage: React.FC = () => {
  useDocumentTitle('Domains', 'Sovereign internet infrastructure — discover, register and operate domains as foundational digital infrastructure.');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tldPricing, setTldPricing] = useState<TldPrice[]>([]);
  const latest = useRef('');

  // Best-effort TLD pricing explorer for the discovery (idle) state.
  useEffect(() => {
    getTldPricing().then(setTldPricing).catch(() => {});
  }, []);

  const run = useCallback(async (raw: string) => {
    const q = raw.trim().toLowerCase();
    latest.current = q;
    if (!q || q.replace(/[^a-z0-9]/g, '').length < 2) { setResult(null); setError(null); setLoading(false); return; }
    if (cache.has(q)) { setResult(cache.get(q)!); setError(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await searchDomains(q);
      if (latest.current !== q) return; // a newer query superseded this one
      cache.set(q, res);
      if (cache.size > 60) cache.delete(cache.keys().next().value); // bound session memory
      setResult(res);
    } catch (e) {
      if (latest.current !== q) return;
      setError((e as Error).message || 'Search failed. Please retry.');
      setResult(null);
    } finally {
      if (latest.current === q) setLoading(false);
    }
  }, []);

  // Debounced live search.
  useEffect(() => {
    const t = setTimeout(() => run(query), 450);
    return () => clearTimeout(t);
  }, [query, run]);

  const showIdle = !loading && !result && !error;

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero — adapts to host: commercial registrar vs. identity layer */}
          <div className="text-center mb-10">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>
              {IS_REGISTRAR ? 'Sovereign domain registrar' : 'Sovereign internet infrastructure'}
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-cinematic text-balance leading-[0.98] mb-5">
              {IS_REGISTRAR
                ? <>Register your <br className="hidden sm:block" /> sovereign domain.</>
                : <>Claim your place in the<br className="hidden sm:block" /> sovereign namespace.</>}
            </h1>
            <p className="text-white/55 text-lg leading-relaxed max-w-2xl mx-auto">
              {IS_REGISTRAR
                ? 'Premium domains and transparent pricing on registrar-grade infrastructure — then operate DNS, SSL and deployment natively, all in one sovereign stack.'
                : 'Domains are not commodities here — they are the foundational identity layer of your digital sovereignty. Discover, connect, and operate them as infrastructure.'}
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto mb-4">
            <HudCorners color="#00D9FF" className="opacity-30" />
            <div className="relative flex items-center glass-strong rounded-2xl px-5 py-1.5 border border-white/10 focus-within:border-cyan-400/50 transition-colors">
              <Search className="w-5 h-5 text-white/40 shrink-0" />
              <input
                autoFocus
                aria-label="Search the sovereign domain namespace"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run(query)}
                placeholder="Search the namespace — e.g. sovereign, your-brand, a full domain…"
                className="flex-1 bg-transparent px-4 py-4 text-base sm:text-lg text-white placeholder:text-white/30 focus:outline-none font-mono"
                spellCheck={false}
              />
              {loading && <Loader2 className="w-5 h-5 text-cyan-300 animate-spin shrink-0" />}
            </div>
          </div>
          <p className="text-center text-[11px] font-mono uppercase tracking-wider text-white/30 mb-12">
            {IS_REGISTRAR
              ? 'Live availability & pricing · sovereign registrar infrastructure'
              : 'Domains as infrastructure identity · discover, connect & operate'}
          </p>

          {/* Error */}
          {error && (
            <div className="max-w-2xl mx-auto mb-12 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-5 py-4 text-sm text-rose-200/90">
              {error}
            </div>
          )}

          {/* Results */}
          {loading && !result && (
            <div className="max-w-3xl mx-auto glass-strong rounded-2xl overflow-hidden mb-12"><Skeleton /></div>
          )}

          {result && (
            <div className="max-w-3xl mx-auto space-y-10 mb-14">
              <section>
                <div className="kicker text-cyan-300/70 mb-3 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Primary namespace</div>
                <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                  {result.exact.map((r) => <DomainRow key={r.domain} r={r} primary />)}
                  {result.exact.length === 0 && <div className="px-5 py-10 text-center text-white/40">No results for this query.</div>}
                </div>
              </section>

              {result.suggestions.length > 0 && (
                <section>
                  <div className="kicker text-purple-300/70 mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Intelligent alternatives</div>
                  <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                    {result.suggestions.map((r) => <DomainRow key={r.domain} r={r} />)}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Idle: TLD pricing explorer */}
          {showIdle && tldPricing.length > 0 && (
            <div className="max-w-3xl mx-auto mb-12">
              <div className="kicker text-white/40 mb-4 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Sovereign namespace · indicative annual pricing</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {tldPricing.map((t) => (
                  <div key={t.tld} className="rounded-xl border border-white/8 bg-white/[0.015] px-3 py-3 text-center transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/30">
                    <div className="font-mono text-cyan-300/90 text-sm">.{t.tld}</div>
                    <div className="font-mono text-white/55 text-xs mt-1">{formatPrice(t.price, t.currency)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idle value props */}
          {showIdle && (
            <div className="max-w-3xl mx-auto mb-14 grid sm:grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, t: 'Registrar-grade', d: 'Direct Openprovider infrastructure, not a reseller storefront.' },
                { icon: Sparkles, t: 'Intelligent discovery', d: 'Namespace spread, premium detection, ranked alternatives.' },
                { icon: Server, t: 'Operate natively', d: 'Flow straight into DNS, nameservers and deployment.' },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-white/8 bg-white/[0.015] p-5">
                  <c.icon className="w-5 h-5 text-cyan-300/70 mb-3" />
                  <div className="font-display font-semibold text-white mb-1">{c.t}</div>
                  <div className="text-sm text-white/50 leading-relaxed">{c.d}</div>
                </div>
              ))}
            </div>
          )}

          {/* Idle callout — adapts to host: identity orchestration vs. registrant setup */}
          {showIdle && !IS_REGISTRAR && (
            <Link to="/deploy" className="group max-w-3xl mx-auto mb-14 flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] px-6 py-5 transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/40">
              <Rocket className="w-5 h-5 text-cyan-300 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold text-white">A domain isn't required to begin.</div>
                <div className="text-sm text-white/55 leading-relaxed">Connect an existing domain, or deploy now on a sovereign subdomain and attach a permanent identity later.</div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 shrink-0">Orchestrate <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          )}
          {showIdle && IS_REGISTRAR && (
            <Link to="/registrants" className="group max-w-3xl mx-auto mb-14 flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] px-6 py-5 transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/40">
              <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold text-white">Set up a registrant identity first.</div>
                <div className="text-sm text-white/55 leading-relaxed">Create and verify a reusable registrant profile so domains can be registered the moment you're ready.</div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 shrink-0">Manage identities <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          )}

          {/* Flow */}
          <div className="max-w-4xl mx-auto">
            <div className="kicker text-white/40 text-center mb-6">The sovereign domain lifecycle</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FLOW.map((s, i) => {
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
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default DomainsPage;
