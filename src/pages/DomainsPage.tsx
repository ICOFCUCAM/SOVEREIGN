import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import HudCorners from '@/components/HudCorners';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { Search, Check, X, Sparkles, ArrowRight, ShieldCheck, Globe, Server, Rocket, Loader2, Crown, Copy, Link2, Compass } from 'lucide-react';
import { searchDomains, aiSuggestDomains, getTldPricing, formatPrice, type DomainResult, type SearchResponse, type TldPrice, type AiSuggestion } from '@/lib/registrar';
import { initConnection, type ChallengeRecord } from '@/lib/connections';
import { resolveTenant, isRegistrarHost } from '@/lib/tenant';

const IS_REGISTRAR = isRegistrarHost(resolveTenant().hostname);

type Path = 'search' | 'advisor' | 'connect' | 'temporary';
const PATHS: Array<{ id: Path; label: string; icon: React.ElementType; hint: string }> = [
  { id: 'search', label: 'Search', icon: Search, hint: 'Literal namespace lookup' },
  { id: 'advisor', label: 'Sovereign advisor', icon: Compass, hint: 'AI deployment-identity strategy' },
  { id: 'connect', label: 'Connect existing', icon: Link2, hint: 'Bring an institutional domain' },
  { id: 'temporary', label: 'Temporary deployment', icon: Server, hint: 'Deploy on a sovereign subdomain' },
];

// Institution archetypes that seed the advisor's naming strategy.
const ARCHETYPES = [
  'National government operating system',
  'Central bank & sovereign finance platform',
  'National electoral & civic integrity system',
  'Smart city operations platform',
  'AI operational infrastructure for the state',
  'National logistics & customs grid',
];

const cache = new Map<string, SearchResponse>();
const copy = (s: string) => navigator.clipboard?.writeText(s).then(() => toast.success(`${s} copied`)).catch(() => {});

const sanitizeSub = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 40);

const StatusPill: React.FC<{ r: DomainResult }> = ({ r }) => (
  r.available
    ? <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300"><Check className="w-3 h-3" /> Available</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/40"><X className="w-3 h-3" /> Taken</span>
);

const reserve = (d: string) => toast.success(`${d} noted`, { description: 'Sovereign registration opens soon — discovery only for now.' });

const DomainRow: React.FC<{ r: DomainResult; primary?: boolean }> = ({ r, primary }) => (
  <div className={`flex items-center gap-4 px-5 ${primary ? 'py-4' : 'py-3'} ${primary ? 'bg-white/[0.02]' : ''}`}>
    <Globe className={`w-4 h-4 shrink-0 ${r.available ? 'text-cyan-300/70' : 'text-white/25'}`} />
    <div className="min-w-0 flex-1">
      <div className={`font-mono truncate ${primary ? 'text-base text-white' : 'text-sm text-white/90'}`}>
        {r.domain}
        {r.premium && <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 align-middle"><Crown className="w-2.5 h-2.5" /> Premium</span>}
      </div>
    </div>
    <button aria-label={`Copy ${r.domain}`} onClick={() => copy(r.domain)} className="shrink-0 text-white/25 hover:text-cyan-300 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
    <StatusPill r={r} />
    <div className="text-right shrink-0 w-24">
      <div className={`font-mono ${r.available ? 'text-white' : 'text-white/30'} ${primary ? 'text-base' : 'text-sm'}`}>{formatPrice(r.price, r.currency)}</div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-white/30">/ yr</div>
    </div>
    <button onClick={() => reserve(r.domain)} disabled={!r.available}
      className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${r.available ? 'text-white hover:-translate-y-0.5' : 'text-white/30 cursor-not-allowed border border-white/5'}`}
      style={r.available ? { background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 10px 30px -12px rgba(0,194,255,0.5)' } : undefined}>
      {r.available ? 'Reserve' : '—'}
    </button>
  </div>
);

const Skeleton: React.FC = () => (
  <div className="divide-y divide-white/5">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
        <div className="w-4 h-4 rounded bg-white/10" /><div className="h-3 rounded bg-white/10 flex-1 max-w-[40%]" />
        <div className="h-4 w-20 rounded bg-white/10" /><div className="h-4 w-16 rounded bg-white/10" /><div className="h-8 w-20 rounded-lg bg-white/10" />
      </div>
    ))}
  </div>
);

// ── Path 2: Sovereign deployment-identity advisor (AI naming) ──
const AdvisorPanel: React.FC = () => {
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<AiSuggestion[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ran, setRan] = useState(false);
  const token = useRef('');

  const generate = useCallback(async (b: string) => {
    const term = b.trim();
    if (term.length < 3) { setErr('Describe the institution in a few words.'); return; }
    setBusy(true); setErr(null); setRan(true); token.current = term;
    try {
      const res = await aiSuggestDomains(term);
      if (token.current !== term) return;
      setResults(res.filter((r) => r.available).slice(0, 12));
      if (!res.some((r) => r.available)) setErr('No available identities from that brief — refine the mandate.');
    } catch (e) {
      if (token.current !== term) return;
      setErr((e as Error).message || 'The advisor is unavailable right now.');
      setResults([]);
    } finally { if (token.current === term) setBusy(false); }
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6 mb-6">
        <div className="flex items-center gap-2 kicker text-cyan-300/80 mb-3"><Compass className="w-3.5 h-3.5" /> Deployment-identity advisor</div>
        <p className="text-white/55 text-sm mb-4 leading-relaxed">Describe the institution and its mandate. The advisor proposes institution-grade naming strategies, deployment-aligned TLDs, and a rationale for each — validated live for availability and pricing.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={brief} onChange={(e) => { setBrief(e.target.value); setErr(null); }} onKeyDown={(e) => e.key === 'Enter' && generate(brief)}
            placeholder="e.g. national digital treasury and payments authority" autoFocus
            aria-label="Describe the institution"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
          />
          <button onClick={() => generate(brief)} disabled={busy || brief.trim().length < 3} aria-busy={busy}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 shrink-0">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Advise
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {ARCHETYPES.map((a) => (
            <button key={a} onClick={() => { setBrief(a); generate(a); }} className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.02] text-white/55 hover:text-white hover:border-cyan-400/30 transition">{a}</button>
          ))}
        </div>
      </div>

      {err && <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-5 py-4 text-sm text-rose-200/90 mb-6 flex items-center justify-between gap-4"><span>{err}</span><button onClick={() => generate(brief)} className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-300/30 text-rose-100 hover:bg-rose-400/10 transition text-xs font-semibold">Retry</button></div>}

      {busy && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-white/45">
          <Loader2 className="w-6 h-6 animate-spin mb-3 text-cyan-300" />
          <div className="text-sm">Formulating sovereign naming strategy…</div>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="kicker text-cyan-300/70 mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Recommended sovereign identities</div>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {results.map((r) => (
              <div key={r.domain} className="rounded-2xl border border-white/8 bg-white/[0.015] p-4 flex flex-col gap-2 transition-all duration-500 ease-cinematic hover:border-cyan-400/30">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white truncate flex-1">{r.domain}</span>
                  {r.premium && <Crown className="w-3 h-3 text-amber-300 shrink-0" />}
                  <button aria-label={`Copy ${r.domain}`} onClick={() => copy(r.domain)} className="text-white/25 hover:text-cyan-300 shrink-0"><Copy className="w-3.5 h-3.5" /></button>
                </div>
                {r.why && <div className="text-[11px] text-cyan-300/60 leading-snug">{r.why}</div>}
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xs text-white/55">{formatPrice(r.price, r.currency)}<span className="text-white/25"> /yr</span></span>
                  <button onClick={() => reserve(r.domain)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:-translate-y-0.5 transition-all" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)' }}>Reserve</button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.015] px-5 py-4 flex items-center gap-4">
            <Rocket className="w-5 h-5 text-cyan-300 shrink-0" />
            <div className="flex-1 text-sm text-white/55">Continue this identity into the deployment orchestrator — connect DNS, provision SSL and route services.</div>
            <Link to="/deploy" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300">Orchestrate <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </>
      )}
    </div>
  );
};

// ── Path 3: Connect an existing institutional domain (TXT challenge) ──
const ConnectPanel: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState<ChallengeRecord | null>(null);

  const init = async () => {
    if (!user) { onAuth(); return; }
    setBusy(true);
    try {
      const { record } = await initConnection(domain);
      setRecord(record);
      toast.success('Challenge issued', { description: 'Add the TXT record, then verify in the console.' });
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
        <div className="flex items-center gap-2 kicker text-cyan-300/80 mb-3"><Link2 className="w-3.5 h-3.5" /> Connect an institutional domain</div>
        <p className="text-white/55 text-sm mb-4 leading-relaxed">Already control a domain? Prove ownership with a DNS TXT challenge, then operate its DNS on sovereign infrastructure — no registration or transfer required.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && domain.includes('.') && init()}
            placeholder="gov.country" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Domain to connect"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
          <button onClick={init} disabled={busy || !domain.includes('.')} aria-busy={busy}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 shrink-0">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} {user ? 'Issue challenge' : 'Sign in to connect'}
          </button>
        </div>
        {record && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-2">Publish this DNS TXT record</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm font-mono">
              <span className="text-white/40">Type</span><span className="text-white">TXT</span>
              <span className="text-white/40">Name</span><span className="text-white break-all">{record.name}</span>
              <span className="text-white/40">Value</span>
              <span className="text-white break-all flex items-center gap-2">{record.value}<button aria-label="Copy value" onClick={() => copy(record.value)} className="text-white/30 hover:text-cyan-300"><Copy className="w-3.5 h-3.5" /></button></span>
            </div>
            <Link to="/deployments" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300">Verify & provision in console <ArrowRight className="w-4 h-4" /></Link>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Path 4: Continue with a temporary sovereign deployment ──
const TemporaryPanel: React.FC = () => {
  const [sub, setSub] = useState('');
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
        <div className="flex items-center gap-2 kicker text-cyan-300/80 mb-3"><Server className="w-3.5 h-3.5" /> Temporary sovereign deployment</div>
        <p className="text-white/55 text-sm mb-4 leading-relaxed">A domain isn't required to begin. Deploy now on a sovereign subdomain and attach a permanent institutional identity whenever you're ready — nothing is lost.</p>
        <div className="flex items-center max-w-md rounded-xl bg-white/5 border border-white/10 focus-within:border-cyan-400/50 overflow-hidden mb-4">
          <input value={sub} onChange={(e) => setSub(sanitizeSub(e.target.value))} placeholder="ministry" autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Sovereign subdomain label"
            className="flex-1 px-4 py-3 bg-transparent text-white font-mono placeholder:text-white/30 focus:outline-none" />
          <span className="px-4 text-white/40 font-mono text-sm border-l border-white/10 py-3">.sovereign.so</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm text-cyan-300/80 flex-1 truncate">{(sub || 'tenant')}.sovereign.so</div>
          <Link to="/deploy" className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold">Continue in orchestrator <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </div>
  );
};

const DomainsPage: React.FC = () => {
  useDocumentTitle('Domains', 'Sovereign deployment identity — search, AI-recommend, connect or temporarily deploy domains as foundational infrastructure.');
  const [mode, setMode] = useState<Path>('search');
  const [authModal, setAuthModal] = useState<null | 'signin' | 'signup'>(null);

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tldPricing, setTldPricing] = useState<TldPrice[]>([]);
  const latest = useRef('');

  useEffect(() => { getTldPricing().then(setTldPricing).catch(() => {}); }, []);

  const run = useCallback(async (raw: string) => {
    const q = raw.trim().toLowerCase();
    latest.current = q;
    if (!q || q.replace(/[^a-z0-9]/g, '').length < 2) { setResult(null); setError(null); setLoading(false); return; }
    if (cache.has(q)) { setResult(cache.get(q)!); setError(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await searchDomains(q);
      if (latest.current !== q) return;
      cache.set(q, res);
      if (cache.size > 60) cache.delete(cache.keys().next().value);
      setResult(res);
    } catch (e) {
      if (latest.current !== q) return;
      setError((e as Error).message || 'Search failed. Please retry.');
      setResult(null);
    } finally { if (latest.current === q) setLoading(false); }
  }, []);

  useEffect(() => {
    if (mode !== 'search') return;
    const t = setTimeout(() => run(query), 450);
    return () => clearTimeout(t);
  }, [query, run, mode]);

  const showIdle = mode === 'search' && !loading && !result && !error;

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-9">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>
              {IS_REGISTRAR ? 'Sovereign domain registrar' : 'Sovereign deployment identity'}
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-cinematic text-balance leading-[0.98] mb-5">
              {IS_REGISTRAR ? <>Register your <br className="hidden sm:block" /> sovereign domain.</> : <>Establish your<br className="hidden sm:block" /> sovereign identity.</>}
            </h1>
            <p className="text-white/55 text-lg leading-relaxed max-w-2xl mx-auto">
              Search the namespace, let the sovereign advisor name your institution, connect a domain you already control, or deploy now on sovereign infrastructure — domains are the identity layer, not a commodity.
            </p>
          </div>

          {/* Path selector */}
          <div className="max-w-3xl mx-auto mb-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PATHS.map((p) => {
              const on = mode === p.id;
              return (
                <button key={p.id} aria-pressed={on} onClick={() => setMode(p.id)}
                  className={`rounded-xl border p-3 text-left transition-all duration-500 ease-cinematic ${on ? 'border-cyan-400/50 bg-cyan-400/[0.07]' : 'border-white/8 bg-white/[0.015] hover:border-white/20'}`}>
                  <p.icon className={`w-4 h-4 mb-1.5 ${on ? 'text-cyan-300' : 'text-white/50'}`} />
                  <div className={`text-sm font-semibold ${on ? 'text-white' : 'text-white/70'}`}>{p.label}</div>
                  <div className="text-[10px] text-white/40 leading-snug mt-0.5">{p.hint}</div>
                </button>
              );
            })}
          </div>

          {/* Path: Search */}
          {mode === 'search' && (
            <>
              <div className="relative max-w-2xl mx-auto mb-4">
                <HudCorners color="#00D9FF" className="opacity-30" />
                <div className="relative flex items-center glass-strong rounded-2xl px-5 py-1.5 border border-white/10 focus-within:border-cyan-400/50 transition-colors">
                  <Search className="w-5 h-5 text-white/40 shrink-0" />
                  <input autoFocus aria-label="Search the sovereign domain namespace" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run(query)}
                    placeholder="Search the namespace — e.g. sovereign, your-brand, a full domain…"
                    className="flex-1 bg-transparent px-4 py-4 text-base sm:text-lg text-white placeholder:text-white/30 focus:outline-none font-mono" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                  {loading && <Loader2 className="w-5 h-5 text-cyan-300 animate-spin shrink-0" />}
                </div>
              </div>
              <p className="text-center text-[11px] font-mono uppercase tracking-wider text-white/30 mb-12">
                {IS_REGISTRAR ? 'Live availability & pricing · sovereign registrar infrastructure' : 'Domains as infrastructure identity · discover, connect & operate'}
              </p>

              {error && (
                <div className="max-w-2xl mx-auto mb-12 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-5 py-4 text-sm text-rose-200/90 flex items-center justify-between gap-4">
                  <span>{error}</span>
                  <button onClick={() => run(query)} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300/30 text-rose-100 hover:bg-rose-400/10 transition text-xs font-semibold">Retry</button>
                </div>
              )}

              {loading && !result && <div className="max-w-3xl mx-auto glass-strong rounded-2xl overflow-hidden mb-12"><Skeleton /></div>}

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
            </>
          )}

          {/* Path: Advisor / Connect / Temporary */}
          {mode === 'advisor' && <div className="mb-14"><AdvisorPanel /></div>}
          {mode === 'connect' && <div className="mb-14"><ConnectPanel onAuth={() => setAuthModal('signin')} /></div>}
          {mode === 'temporary' && <div className="mb-14"><TemporaryPanel /></div>}

          {/* Lifecycle — always present for continuity */}
          <div className="max-w-4xl mx-auto">
            <div className="kicker text-white/40 text-center mb-6">The sovereign deployment lifecycle</div>
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
      {authModal && <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  );
};

const FLOW = [
  { icon: Search, label: 'Acquire', desc: 'Discover or name the identity' },
  { icon: Globe, label: 'Register', desc: 'Claim sovereign identity' },
  { icon: Server, label: 'Operate', desc: 'DNS · nameservers · SSL', to: '/dns' },
  { icon: Rocket, label: 'Deploy', desc: 'Route to infrastructure', to: '/deploy' },
];

export default DomainsPage;
