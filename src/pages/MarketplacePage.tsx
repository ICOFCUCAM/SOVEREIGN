import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/lib/supabase';
import type { Domain, EcosystemProduct } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import InstitutionListings from '@/components/marketplace/InstitutionListings';
import BriefingModal from '@/components/BriefingModal';
import HudCorners from '@/components/HudCorners';
import Reveal from '@/components/Reveal';
import { useCountUp } from '@/hooks/useCountUp';
import { Search, ArrowUpRight, ArrowRight, ShieldCheck, Cpu, Activity, Globe2 } from 'lucide-react';

const WorldMap = lazy(() => import('@/components/WorldMap'));
const ACCENT = '#00D9FF';

const ACCENTS: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const fmt = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 2)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${n}`);

// deployment footprint nodes for the flagship telemetry
const NODES = [
  { lon: -74, lat: 40.7, cls: 'core' as const }, { lon: -0.1, lat: 51.5, cls: 'core' as const },
  { lon: 8.7, lat: 50.1, cls: 'strategic' as const }, { lon: 55.3, lat: 25.2, cls: 'strategic' as const },
  { lon: 103.8, lat: 1.3, cls: 'strategic' as const }, { lon: 139.7, lat: 35.7, cls: 'core' as const },
  { lon: 3.4, lat: 6.5, cls: 'treasury' as const }, { lon: 28, lat: -26.2, cls: 'emergency' as const },
  { lon: -46.6, lat: -23.5, cls: 'edge' as const }, { lon: 72.8, lat: 19, cls: 'edge' as const },
];
const ARCS: Array<[number, number, number]> = [[0, 1, 0], [1, 3, 0.6], [3, 4, 1], [4, 5, 0.4], [0, 8, 1.2], [1, 2, 0.8], [3, 9, 0.5]];

const FLAGSHIP_METRICS = [
  { value: 12, label: 'Deployed nations' },
  { value: 230, suffix: 'M+', label: 'Citizens impacted' },
  { value: 99.99, decimals: 2, suffix: '%', label: 'System uptime' },
  { value: 1.2, decimals: 1, suffix: 'B+', label: 'AI decisions / day' },
];
const FLAGSHIP_CAPS = [
  { icon: ShieldCheck, label: 'Complete governance stack' },
  { icon: Cpu, label: 'AI-native architecture' },
  { icon: Activity, label: 'Self-healing infrastructure' },
  { icon: Globe2, label: 'Global interoperability' },
];

const FlagMetric: React.FC<{ m: typeof FLAGSHIP_METRICS[number]; i: number }> = ({ m, i }) => {
  const { ref, value } = useCountUp(m.value, 1700 + i * 130, m.decimals || 0);
  const shown = m.decimals ? value.toFixed(m.decimals) : Math.round(value).toLocaleString();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="px-5 py-6">
      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none tracking-tight">{shown}<span className="text-white/45 text-[0.5em] font-semibold ml-0.5">{m.suffix}</span></div>
      <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 mt-2.5">{m.label}</div>
    </div>
  );
};

// ── tiered system card (scale varies by grade) ──
const SystemCard: React.FC<{ d: Domain; size?: 'lg' | 'md' }> = ({ d, size = 'md' }) => {
  const accent = ACCENTS[d.category || ''] || ACCENT;
  const lg = size === 'lg';
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className={`group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.014] hover:border-white/25 transition-all duration-500 hover:-translate-y-1 ${lg ? 'p-8' : 'p-6'}`}>
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -top-20 -right-16 w-52 h-52 rounded-full blur-[80px] opacity-[0.12] group-hover:opacity-25 transition-opacity" style={{ background: accent }} />
      <HudCorners color={accent} className="opacity-20 group-hover:opacity-50 transition-opacity" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: accent }}>{d.category || 'sovereign'}</span>
          <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className={`font-display font-bold text-white tracking-tight ${lg ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>{d.domain_name}</div>
        <p className={`text-white/50 leading-relaxed mt-2 ${lg ? 'text-base max-w-sm' : 'text-sm line-clamp-2 min-h-[2.5rem]'}`}>{d.tagline || 'Deployable sovereign institution.'}</p>
        <div className="flex items-end justify-between mt-7 pt-5 border-t border-white/8">
          <div>
            <div className={`font-bold text-white tabular-nums leading-none ${lg ? 'text-3xl' : 'text-xl'}`}>{fmt(Number(d.price_usd || 0))}</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">One-time acquisition</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums leading-none" style={{ color: accent }}>{d.valuation_score}<span className="text-xs text-white/35">/100</span></div>
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1.5">AI valuation</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const SectionHead: React.FC<{ kicker: string; title: string; desc?: string; to?: string; cta?: string }> = ({ kicker, title, desc, to, cta }) => (
  <div className="flex items-end justify-between gap-6 mb-9">
    <div className="max-w-2xl">
      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-3">{kicker}</div>
      <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter text-white leading-[0.98]">{title}</h2>
      {desc && <p className="text-white/50 mt-3 leading-relaxed">{desc}</p>}
    </div>
    {to && cta && (
      <Link to={to} className="group hidden sm:inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/45 hover:text-white transition shrink-0">
        {cta} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    )}
  </div>
);

const MarketplacePage: React.FC = () => {
  useDocumentTitle('Marketplace', 'A sovereign systems exchange — acquire deployable civilization-scale institutions, AI-scored and procurement-ready.');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [civicos, setCivicos] = useState<EcosystemProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [brief, setBrief] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, p] = await Promise.all([
        supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false }),
        supabase.from('ecosystem_products').select('*').eq('slug', 'civicos').maybeSingle(),
      ]);
      setDomains((d.data || []) as Domain[]);
      setCivicos((p.data as EcosystemProduct) || null);
      setLoading(false);
    })();
  }, []);

  // tier separation by deployment class (price)
  const sovereign = useMemo(() => domains.filter((d) => Number(d.price_usd) >= 1e6), [domains]);
  const strategic = useMemo(() => domains.filter((d) => Number(d.price_usd) >= 2e5 && Number(d.price_usd) < 1e6), [domains]);
  const emerging = useMemo(() => domains.filter((d) => Number(d.price_usd) < 2e5), [domains]);
  const curated = useMemo(() => (sovereign.length ? sovereign : domains).slice(0, 3), [sovereign, domains]);

  const browse = useMemo(() => {
    if (!q) return [] as Domain[];
    return domains.filter((d) => d.domain_name.toLowerCase().includes(q.toLowerCase()) || (d.tagline || '').toLowerCase().includes(q.toLowerCase()));
  }, [domains, q]);

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main>
        {/* ── SECTION 1 — acquisition statement (breathing hero) ── */}
        <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-36 pb-24 sm:pb-28">
          <div className="absolute right-[-10%] top-[-6%] w-[58vw] max-w-[860px] opacity-90 pointer-events-none" style={{ maskImage: 'radial-gradient(ellipse 70% 70% at 60% 40%, #000 55%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 60% 40%, #000 55%, transparent 80%)' }}>
            <img src="/hero-globe.webp" alt="" aria-hidden className="w-full h-auto" />
          </div>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(95deg, #050816 18%, rgba(5,8,22,0.7) 42%, transparent 72%)' }} />
          <div className="relative max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.28em] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign systems exchange
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.94] max-w-3xl mb-7">
              <span className="text-white">Acquire civilization-</span><br />
              <span className="text-white">scale </span><span className="text-gradient-cyan">systems.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/55 max-w-xl leading-relaxed mb-10">
              The world's most advanced sovereign, financial, infrastructure and intelligence systems — deployable, interoperable, sovereign by design.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setBrief(true)} className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.26)' }}>
                Request acquisition briefing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#flagship" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur text-white font-semibold hover:bg-white/8 transition-all">
                Explore systems
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-[11px] font-mono text-white/45">
              <span className="inline-flex items-center gap-1.5 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Market operational</span>
              <span>{domains.length || 47} <span className="text-white/30">live systems</span></span>
              <span>23 <span className="text-white/30">sovereign regions</span></span>
              <span>99.99% <span className="text-white/30">uptime</span></span>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 — flagship acquisition (CIVICOS) ── */}
        <section id="flagship" className="px-4 sm:px-6 lg:px-8 pb-28 sm:pb-36">
          <Reveal>
            <div className="relative max-w-7xl mx-auto rounded-[1.75rem] border border-white/10 overflow-hidden bg-[#04060f]" style={{ boxShadow: '0 50px 140px -50px rgba(0,0,0,0.9)' }}>
              <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
              <HudCorners color={ACCENT} className="opacity-40 z-10" />
              <div className="grid lg:grid-cols-[1.15fr_1fr]">
                {/* editorial left */}
                <div className="relative p-8 sm:p-12 lg:p-14">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-6">Flagship acquisition</div>
                  <h2 className="font-display text-6xl sm:text-7xl font-bold tracking-tighter text-white leading-[0.9] mb-4">CIVICOS</h2>
                  <p className="text-xl text-white/70 font-light mb-6">The operating system for nations.</p>
                  <div className="flex flex-wrap gap-2 mb-7">
                    {['Sovereign', 'Institutional', 'Civilization-scale'].map((t) => (
                      <span key={t} className="text-[9px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded text-cyan-300/80 border border-cyan-400/20 bg-cyan-400/[0.05]">{t}</span>
                    ))}
                  </div>
                  <p className="text-white/55 leading-relaxed max-w-lg mb-8">
                    CIVICOS unifies governance, finance, intelligence, infrastructure and citizen systems into a single sovereign operating layer — deployed nation-wide, self-healing, and interoperable by design.
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 max-w-md mb-9">
                    {FLAGSHIP_CAPS.map((c) => { const Icon = c.icon; return (
                      <div key={c.label} className="flex items-center gap-2.5 text-sm text-white/70"><Icon className="w-4 h-4 shrink-0" style={{ color: ACCENT }} /> {c.label}</div>
                    ); })}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/systems/civicos" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px" style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 36px rgba(0,194,255,0.28)' }}>
                      Acquire CIVICOS <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <Link to="/systems/civicos" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] text-white font-semibold hover:bg-white/5 transition">
                      Deployment preview
                    </Link>
                  </div>
                </div>

                {/* acquisition overview right */}
                <div className="relative border-t lg:border-t-0 lg:border-l border-white/8 bg-white/[0.012] p-8 sm:p-10">
                  <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/45 mb-2">Acquisition overview</div>
                  <div className="grid grid-cols-2 gap-px bg-white/8 rounded-xl overflow-hidden border border-white/8 mb-6">
                    {FLAGSHIP_METRICS.map((m, i) => <div key={m.label} className="bg-[#060b1a]"><FlagMetric m={m} i={i} /></div>)}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Global deployment footprint</div>
                  <div className="relative rounded-xl overflow-hidden border border-white/8" style={{ aspectRatio: '2 / 1' }}>
                    <Suspense fallback={<div className="w-full h-full" />}>
                      <WorldMap accent={ACCENT} nodes={NODES} arcs={ARCS} className="w-full h-full" />
                    </Suspense>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] mb-2">
                      <span className="text-white/40">Sovereign readiness</span><span className="text-white tabular-nums">98.6%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden"><span className="block h-full rounded-full" style={{ width: '98.6%', background: `linear-gradient(90deg, ${ACCENT}, #7C4DFF)` }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── SECTION 3 — curated sovereign systems ── */}
        {!loading && curated.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 pb-28 sm:pb-36">
            <div className="max-w-7xl mx-auto">
              <SectionHead kicker="Sovereign-grade" title="Curated sovereign systems." desc="The highest-value deployable institutions — civilization-scale operating systems and financial infrastructure." />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {curated.map((d) => <SystemCard key={d.id} d={d} size="lg" />)}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 4 — strategic + emerging assets, with institutional command search ── */}
        {!loading && (
          <section className="px-4 sm:px-6 lg:px-8 pb-28 sm:pb-36">
            <div className="max-w-7xl mx-auto">
              <SectionHead kicker="Strategic & emerging" title="The acquisition registry." desc="Strategic infrastructure and emerging sovereign systems — searchable across the live exchange." />
              {/* institutional command search */}
              <div className="relative mb-9 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-300/50" />
                <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the exchange" placeholder="Query the sovereign exchange…"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-mono text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none tracking-wide" />
              </div>

              {q ? (
                browse.length ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{browse.map((d) => <SystemCard key={d.id} d={d} />)}</div>
                ) : (
                  <div className="rounded-2xl border border-white/8 p-16 text-center text-white/40">No systems match "{q}".</div>
                )
              ) : (
                <div className="space-y-12">
                  {strategic.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40 mb-5">Strategic infrastructure · {strategic.length}</div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{strategic.slice(0, 6).map((d) => <SystemCard key={d.id} d={d} />)}</div>
                    </div>
                  )}
                  {emerging.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40 mb-5">Emerging systems · {emerging.length}</div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{emerging.slice(0, 6).map((d) => <SystemCard key={d.id} d={d} />)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SECTION 5 — institutional runtime packages (CIVICOS tiers + systems) ── */}
        <section className="px-4 sm:px-6 lg:px-8 pb-28 sm:pb-36">
          <div className="max-w-7xl mx-auto">
            <InstitutionListings />
          </div>
        </section>

        {/* ── SECTION 6 — strategic acquisition pathways ── */}
        <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 120%, rgba(0,194,255,0.16), transparent 60%)' }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-6">Strategic acquisition</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98] mb-6">Procure a sovereign system.</h2>
            <p className="text-white/55 text-lg leading-relaxed mb-9">Acquisition is brokered by sovereign-systems specialists — from single-ministry runtimes to civilization-scale deployment.</p>
            <button onClick={() => setBrief(true)} className="group inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 48px rgba(0,194,255,0.32)' }}>
              Request a sovereign briefing <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      <PlatformFooter />
      {brief && <BriefingModal systemName="SOVEREIGN" slug="platform" accent="#00C2FF" onClose={() => setBrief(false)} />}
    </div>
  );
};

export default MarketplacePage;
