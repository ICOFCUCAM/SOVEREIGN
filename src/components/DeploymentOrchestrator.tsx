import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark, Banknote, Vote, Building2, GraduationCap, Cpu, Truck,
  Link2, Globe, Sparkles, Server, ArrowRight, ArrowLeft, Check, Search,
  ShieldCheck, Network, Route, Loader2, Star, Save, History, Clock,
} from 'lucide-react';
import { searchDomains, formatPrice, type DomainResult } from '@/lib/registrar';
import { listDeployments, createDeployment, type Deployment } from '@/lib/deployments';
import { listRegistrants, type RegistrantProfile } from '@/lib/registrant';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { toast } from 'sonner';

type Strategy = 'existing' | 'register' | 'recommend' | 'skip';

const TYPES = [
  { id: 'gov', label: 'Government OS', icon: Landmark, hint: 'National digital governance runtime' },
  { id: 'bank', label: 'Banking Infrastructure', icon: Banknote, hint: 'Sovereign financial core' },
  { id: 'electoral', label: 'Electoral System', icon: Vote, hint: 'Verifiable civic elections' },
  { id: 'city', label: 'Smart City Platform', icon: Building2, hint: 'Urban operations mesh' },
  { id: 'edu', label: 'Education Infrastructure', icon: GraduationCap, hint: 'National learning systems' },
  { id: 'ai', label: 'AI Operations System', icon: Cpu, hint: 'Autonomous decision fabric' },
  { id: 'logistics', label: 'Logistics Infrastructure', icon: Truck, hint: 'Supply & movement grid' },
];

const STRATEGIES: Array<{ id: Strategy; label: string; icon: React.ElementType; hint: string }> = [
  { id: 'existing', label: 'Use Existing Domain', icon: Link2, hint: 'Connect a domain you already control' },
  { id: 'register', label: 'Register New Domain', icon: Globe, hint: 'Search the sovereign namespace' },
  { id: 'recommend', label: 'Let Sovereign AI Recommend', icon: Sparkles, hint: 'AI-suggested sovereign identities' },
  { id: 'skip', label: 'Continue Without Domain', icon: Server, hint: 'Deploy now on a sovereign subdomain' },
];

// Infrastructure provisioning plan, adapted to the institution's domain strategy.
const INFRA_BY_STRATEGY: Record<Strategy, Array<{ icon: React.ElementType; label: string }>> = {
  existing: [
    { icon: Network, label: 'Migrate DNS · point nameservers' },
    { icon: Server, label: 'Import existing zone records' },
    { icon: ShieldCheck, label: 'Provision SSL certificate' },
    { icon: Route, label: 'Route services to edge' },
  ],
  register: [
    { icon: Globe, label: 'Register sovereign identity' },
    { icon: Network, label: 'Connect DNS zone' },
    { icon: ShieldCheck, label: 'Provision SSL certificate' },
    { icon: Route, label: 'Route services to edge' },
  ],
  recommend: [
    { icon: Globe, label: 'Register sovereign identity' },
    { icon: Network, label: 'Connect DNS zone' },
    { icon: ShieldCheck, label: 'Provision SSL certificate' },
    { icon: Route, label: 'Route services to edge' },
  ],
  skip: [
    { icon: Server, label: 'Assign sovereign subdomain' },
    { icon: ShieldCheck, label: 'Provision SSL certificate' },
    { icon: Route, label: 'Route services to edge' },
    { icon: Network, label: 'Attach permanent domain later' },
  ],
};

// The lifecycle intelligently adapts to deployment strategy.
const LIFECYCLE_BY_STRATEGY: Record<Strategy, string[]> = {
  existing: ['Connect', 'Operate', 'Deploy'],
  register: ['Acquire', 'Register', 'Connect', 'Operate', 'Deploy'],
  recommend: ['Acquire', 'Register', 'Connect', 'Operate', 'Deploy'],
  skip: ['Operate', 'Deploy'],
};

const sanitizeSub = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 40);

const card = 'group relative text-left rounded-2xl border p-5 transition-all duration-500 ease-cinematic hover:-translate-y-0.5';

const DeploymentOrchestrator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [existing, setExisting] = useState('');
  const [sub, setSub] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const latest = useRef('');

  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mine, setMine] = useState<Deployment[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [registrants, setRegistrants] = useState<RegistrantProfile[]>([]);
  const [registrantId, setRegistrantId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setMine([]); setRegistrants([]); return; }
    listDeployments().then(setMine).catch(() => {});
    listRegistrants().then(setRegistrants).catch(() => {});
  }, [user]);

  const typeMeta = TYPES.find((t) => t.id === type);

  const runSearch = useCallback((q: string) => {
    const term = q.trim();
    setQuery(q);
    setPicked(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (term.length < 2) { setResults([]); setSearching(false); setSearchErr(null); return; }
    setSearching(true);
    latest.current = term;
    debounce.current = setTimeout(async () => {
      try {
        const res = await searchDomains(term);
        if (latest.current !== term) return;
        setResults([...res.exact, ...res.suggestions].filter((r) => r.available).slice(0, 9));
        setSearchErr(null);
      } catch (e) {
        if (latest.current !== term) return;
        setSearchErr((e as Error).message || 'Search unavailable.');
        setResults([]);
      } finally {
        if (latest.current === term) setSearching(false);
      }
    }, 450);
  }, []);

  const reset = () => { setStep(1); setType(null); setStrategy(null); setExisting(''); setSub(''); setQuery(''); setResults([]); setPicked(null); setSavedId(null); setRegistrantId(null); };

  const save = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!type || !strategy || !typeMeta) return;
    setSaving(true);
    try {
      const dec = domainDecision();
      const dep = await createDeployment({
        name: typeMeta.label,
        deployment_type: typeMeta.label,
        domain_strategy: strategy,
        domain: strategy === 'skip' ? null : strategy === 'existing' ? existing : picked,
        subdomain: strategy === 'skip' ? sub : null,
        lifecycle: LIFECYCLE_BY_STRATEGY[strategy],
        blueprint: { typeId: type, typeLabel: typeMeta.label, strategy, domain: dec.label, detail: dec.detail, registrant_profile_id: registrantId },
      });
      setSavedId(dep.id);
      setMine((m) => [dep, ...m]);
      toast.success('Deployment saved', { description: 'Your blueprint is persisted and resumable.' });
    } catch (e) {
      toast.error((e as Error).message || 'Could not save deployment.');
    }
    setSaving(false);
  };

  const resume = (d: Deployment) => {
    setType(TYPES.find((t) => t.label === d.deployment_type)?.id ?? null);
    setStrategy(d.domain_strategy);
    setExisting(d.domain_strategy === 'existing' ? d.domain ?? '' : '');
    setSub(d.domain_strategy === 'skip' ? d.subdomain ?? '' : '');
    setPicked(d.domain_strategy === 'register' || d.domain_strategy === 'recommend' ? d.domain ?? null : null);
    setSavedId(d.id);
    setStep(4);
  };

  // Resolved domain decision for the blueprint.
  const domainDecision = (): { label: string; detail: string } => {
    if (strategy === 'existing') return { label: existing || 'existing domain', detail: 'Connected — no registration required' };
    if (strategy === 'skip') return { label: `${sub || 'tenant'}.sovereign.so`, detail: 'Sovereign subdomain · connect a permanent domain later' };
    if (picked) return { label: picked, detail: 'Selected for sovereign registration (reservation only)' };
    return { label: 'Pending', detail: 'No domain selected' };
  };

  const canAdvance = () =>
    step === 1 ? !!type :
    step === 2 ? !!strategy :
    step === 3 ? (strategy === 'existing' ? existing.includes('.') : strategy === 'skip' ? !!sub : !!picked) :
    true;

  const Kicker = (n: number, t: string) => (
    <div className="flex items-center gap-2 kicker text-cyan-300/70 mb-5"><span className="font-mono text-white/30">STEP {n}</span><span className="w-8 h-px bg-white/15" />{t}</div>
  );

  return (
    <div className="relative glass-strong rounded-3xl p-6 sm:p-9 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 blur-[110px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #00D9FF, transparent 70%)' }} />

      {/* progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex-1 h-1 rounded-full overflow-hidden bg-white/8">
            <div className="h-full rounded-full transition-all duration-700 ease-cinematic" style={{ width: step >= n ? '100%' : '0%', background: 'linear-gradient(90deg,#00D9FF,#7C3AED)' }} />
          </div>
        ))}
      </div>

      {/* STEP 1 — deployment type */}
      {step === 1 && (
        <div>
          {mine.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center gap-2 kicker text-white/40 mb-3"><History className="w-3.5 h-3.5" /> Resume a deployment</div>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {mine.slice(0, 4).map((d) => (
                  <button key={d.id} onClick={() => resume(d)} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.015] px-4 py-3 text-left hover:border-cyan-400/30 transition-all duration-500 ease-cinematic hover:-translate-y-0.5">
                    <Clock className="w-4 h-4 text-cyan-300/60 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{d.name || d.deployment_type}</div>
                      <div className="text-[11px] font-mono text-white/40 truncate">{d.domain || d.subdomain || d.domain_strategy} · {d.status}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/25 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {Kicker(1, 'What would you like to deploy?')}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TYPES.map((t) => {
              const Icon = t.icon; const on = type === t.id;
              return (
                <button key={t.id} onClick={() => setType(t.id)} className={`${card} ${on ? 'border-cyan-400/50 bg-cyan-400/[0.06]' : 'border-white/8 bg-white/[0.015] hover:border-white/20'}`}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: on ? 'linear-gradient(135deg,#00D9FF,#7C3AED)' : 'rgba(255,255,255,0.05)' }}><Icon className={`w-4 h-4 ${on ? 'text-white' : 'text-cyan-300/70'}`} /></span>
                    <span className="font-semibold text-sm text-white">{t.label}</span>
                    {on && <Check className="w-4 h-4 text-cyan-300 ml-auto" />}
                  </div>
                  <div className="text-[11px] text-white/40 leading-snug pl-12">{t.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2 — domain strategy */}
      {step === 2 && (
        <div>
          {Kicker(2, 'Domain strategy')}
          <div className="grid sm:grid-cols-2 gap-3">
            {STRATEGIES.map((s) => {
              const Icon = s.icon; const on = strategy === s.id;
              return (
                <button key={s.id} onClick={() => setStrategy(s.id)} className={`${card} ${on ? 'border-cyan-400/50 bg-cyan-400/[0.06]' : 'border-white/8 bg-white/[0.015] hover:border-white/20'}`}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: on ? 'linear-gradient(135deg,#00D9FF,#7C3AED)' : 'rgba(255,255,255,0.05)' }}><Icon className={`w-4 h-4 ${on ? 'text-white' : 'text-cyan-300/70'}`} /></span>
                    <span className="font-semibold text-sm text-white">{s.label}</span>
                    {on && <Check className="w-4 h-4 text-cyan-300 ml-auto" />}
                  </div>
                  <div className="text-[11px] text-white/40 leading-snug pl-12">{s.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 — conditional detail */}
      {step === 3 && (
        <div>
          {strategy === 'existing' && (
            <div>
              {Kicker(3, 'Connect your domain')}
              <p className="text-white/50 text-sm mb-4 max-w-lg">Enter a domain your institution already controls. Sovereign connects DNS, provisions SSL and routes services — no new registration required.</p>
              <input aria-label="Existing domain to connect" value={existing} onChange={(e) => setExisting(e.target.value.toLowerCase().trim())} placeholder="gov.country" autoFocus
                className="w-full max-w-md px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
            </div>
          )}
          {strategy === 'skip' && (
            <div>
              {Kicker(3, 'Provision a sovereign subdomain')}
              <p className="text-white/50 text-sm mb-4 max-w-lg">Deploy immediately on sovereign infrastructure. Connect a permanent domain whenever you're ready — nothing is lost.</p>
              <div className="flex items-center max-w-md rounded-xl bg-white/5 border border-white/10 focus-within:border-cyan-400/50 overflow-hidden">
                <input aria-label="Sovereign subdomain label" value={sub} onChange={(e) => setSub(sanitizeSub(e.target.value))} placeholder="ministry" autoFocus className="flex-1 px-4 py-3.5 bg-transparent text-white font-mono placeholder:text-white/30 focus:outline-none" />
                <span className="px-4 text-white/40 font-mono text-sm border-l border-white/10 py-3.5">.sovereign.so</span>
              </div>
            </div>
          )}
          {(strategy === 'register' || strategy === 'recommend') && (
            <div>
              {Kicker(3, strategy === 'recommend' ? 'Sovereign AI recommendations' : 'Register a new domain')}
              <div className="relative max-w-md mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input aria-label="Search the sovereign namespace" value={query} onChange={(e) => runSearch(e.target.value)} autoFocus
                  placeholder={strategy === 'recommend' ? 'Describe the institution — e.g. national treasury' : 'Search the namespace'}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300 animate-spin" />}
              </div>
              {searchErr && <div className="text-rose-300/80 text-sm mb-4">{searchErr}</div>}
              <div className="grid sm:grid-cols-3 gap-2.5">
                {results.map((r) => {
                  const on = picked === r.domain;
                  return (
                    <button key={r.domain} onClick={() => setPicked(r.domain)} className={`relative rounded-xl border px-4 py-3 text-left transition-all duration-300 ${on ? 'border-cyan-400/50 bg-cyan-400/[0.06]' : 'border-white/8 bg-white/[0.015] hover:border-white/20'}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-white truncate">{r.domain}</span>
                        {r.premium && <Star className="w-3 h-3 text-amber-300 shrink-0" />}
                        {on && <Check className="w-3.5 h-3.5 text-cyan-300 ml-auto shrink-0" />}
                      </div>
                      <div className="text-[11px] font-mono text-white/45 mt-1">{formatPrice(r.price, r.currency)}<span className="text-white/25"> /yr</span></div>
                    </button>
                  );
                })}
              </div>
              {!searching && query.length >= 2 && !results.length && !searchErr && <div className="text-white/40 text-sm">No available identities — refine the search.</div>}
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — blueprint */}
      {step === 4 && typeMeta && (
        <div>
          {Kicker(4, 'Deployment blueprint')}
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5">
              <div className="kicker text-white/35 mb-2">System</div>
              <div className="flex items-center gap-2.5"><typeMeta.icon className="w-5 h-5 text-cyan-300" /><span className="text-white font-semibold">{typeMeta.label}</span></div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5">
              <div className="kicker text-white/35 mb-2">Domain</div>
              <div className="font-mono text-white font-semibold truncate">{domainDecision().label}</div>
              <div className="text-[11px] text-white/45 mt-1">{domainDecision().detail}</div>
            </div>
          </div>
          {/* Adaptive lifecycle */}
          {strategy && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5 mb-3">
              <div className="kicker text-white/35 mb-4">Adapted deployment lifecycle</div>
              <div className="flex flex-wrap items-center gap-y-2">
                {LIFECYCLE_BY_STRATEGY[strategy].map((stage, i, arr) => (
                  <React.Fragment key={stage}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/[0.08] border border-cyan-400/20 text-sm text-white font-medium">
                      <span className="font-mono text-[10px] text-cyan-300/60">{String(i + 1).padStart(2, '0')}</span>{stage}
                    </span>
                    {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-white/25 mx-1.5" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-5 mb-7">
            <div className="kicker text-cyan-300/70 mb-4">Infrastructure provisioning plan</div>
            <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6">
              {(strategy ? INFRA_BY_STRATEGY[strategy] : []).map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-sm text-white/70"><s.icon className="w-4 h-4 text-cyan-300/70 shrink-0" />{s.label}</div>
              ))}
            </div>
          </div>
          {(strategy === 'register' || strategy === 'recommend') && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5 mb-7">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="kicker text-white/35">Registrant identity</div>
                <Link to="/registrants" className="text-[11px] font-mono text-cyan-300/70 hover:text-cyan-300 inline-flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {registrants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {registrants.map((r) => {
                    const on = registrantId === r.id;
                    return (
                      <button key={r.id} onClick={() => setRegistrantId(on ? null : r.id)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${on ? 'border-cyan-400/50 bg-cyan-400/[0.08] text-white' : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/25'}`}>
                        {on && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                        {r.company_name || `${r.first_name} ${r.last_name}`}
                        {r.op_handle && <span className="font-mono text-[10px] text-emerald-300/70">· verified</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-white/45">No registrant identities yet. <Link to="/registrants" className="text-cyan-300 hover:underline">Create one</Link> to attach to this deployment.</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {savedId ? (
              <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 font-semibold"><Check className="w-4 h-4" /> Saved · resumable</span>
            ) : (
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {user ? 'Save deployment' : 'Sign in to save'}
              </button>
            )}
            <Link to="/dns" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-white/80 hover:text-white hover:border-white/25 transition">
              Open DNS console <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white/50 hover:text-white transition">Start over</button>
          </div>
          <div className="mt-5 text-[10px] font-mono uppercase tracking-widest text-amber-300/70 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Blueprint persisted as a draft · provisioning is activation-ready — no purchase is triggered
          </div>
        </div>
      )}

      {/* nav */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white disabled:opacity-0 transition"><ArrowLeft className="w-4 h-4" /> Back</button>
          <button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {authOpen && <AuthModal initialMode="signin" onClose={() => setAuthOpen(false)} />}
    </div>
  );
};

export default DeploymentOrchestrator;
