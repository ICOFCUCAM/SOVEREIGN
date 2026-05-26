import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/lib/supabase';
import type { Domain, EcosystemProduct } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import BriefingModal from '@/components/BriefingModal';
import PageSubNav from '@/components/PageSubNav';
import HudCorners from '@/components/HudCorners';
import Reveal from '@/components/Reveal';
import { useCountUp } from '@/hooks/useCountUp';
import {
  ArrowUpRight, ArrowRight, ShieldCheck, Cpu, Activity, Globe2, Check, Star,
  Banknote, Landmark, Truck, Server, Building2,
} from 'lucide-react';

const WorldMap = lazy(() => import('@/components/WorldMap'));
const ACCENT = '#00D9FF';

const ACCENTS: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF', logistics: '#F59E0B', saas: '#22D3EE',
};
const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  govtech: Landmark, fintech: Banknote, ai: Cpu, infra: Server, logistics: Truck, saas: Building2,
};
const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;
const regionsOf = (d: Domain) => 6 + ((d.domain_name.length * 3 + d.valuation_score) % 18);

// ── flagship telemetry ──
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

// ── market intelligence feed ──
const INTEL = [
  { name: 'Veritas.Financial', note: 'New institutional deployment in Singapore region', ago: '2m', c: '#10B981' },
  { name: 'CIVICOS Core', note: 'Sovereign upgrade package released', ago: '17m', c: '#6366F1' },
  { name: 'ElecPro.AI', note: 'New energy optimization model now available', ago: '1h', c: '#22D3EE' },
  { name: 'Flytgo', note: 'Expanded logistics network live in 12 regions', ago: '2h', c: '#F59E0B' },
];

// ── government platform tiers (with feature manifests, matching the exchange spec) ──
const GOV_TIERS = [
  { tier: 'Core', price: '$8M', label: 'Sovereign OS', desc: 'The full sovereign operating system for nations.', c: '#3B82F6', feats: ['Full governance', 'Finance & economy', 'Citizen systems', 'AI intelligence layer'] },
  { tier: 'Professional', price: '$35M', label: 'Professional', desc: 'Professional sovereign operating platform.', c: '#14B8A6', feats: ['Governance suite', 'Finance suite', 'Infrastructure suite', 'Security layer'] },
  { tier: 'Elite', price: '$120M', label: 'Enterprise', desc: 'Advanced enterprise sovereign platform.', c: '#7C4DFF', feats: ['Multi-dept governance', 'AI command center', 'Advanced security', 'National-scale ops'] },
  { tier: 'Strategic', price: '$500M', label: 'Strategic', desc: 'Strategic infrastructure and operations platform.', c: '#F59E0B', feats: ['Strategic infrastructure', 'Defense integration', 'Critical systems', '24/7 sovereign ops'] },
  { tier: 'Prime', price: '$1B+', label: 'Civilization', desc: 'Full civilization-scale operating platform.', c: '#E8C572', feats: ['Everything in Strategic', 'Unlimited scale', 'Custom sovereign', 'Dedicated sovereign cloud'] },
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

const GRADE: Record<string, { label: string; c: string }> = {
  sovereign: { label: 'Sovereign', c: '#22E0FF' }, strategic: { label: 'Strategic', c: '#7C4DFF' }, infrastructure: { label: 'Infrastructure', c: '#5AA0FF' },
};

// ── sovereign system card (benchmark style: badge, icon, price, regions) ──
const SovereignCard: React.FC<{ d: Domain; grade: keyof typeof GRADE }> = ({ d, grade }) => {
  const accent = ACCENTS[d.category || ''] || ACCENT;
  const Icon = ICONS[d.category || ''] || Server;
  const g = GRADE[grade];
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.014] hover:border-white/25 transition-all duration-500 hover:-translate-y-1 p-6">
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <span className="absolute -top-16 -right-14 w-44 h-44 rounded-full blur-[80px] opacity-[0.12] group-hover:opacity-25 transition-opacity" style={{ background: accent }} />
      <HudCorners color={accent} className="opacity-20 group-hover:opacity-50 transition-opacity" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/45">{d.category}</span>
          <span className="text-[8px] font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded" style={{ background: `${g.c}1f`, color: g.c }}>{g.label}</span>
        </div>
        <div className="font-display text-2xl font-bold text-white tracking-tight">{d.domain_name}</div>
        <p className="text-sm text-white/50 leading-relaxed mt-2 line-clamp-2 min-h-[2.5rem]">{d.tagline || 'Deployable sovereign institution.'}</p>
        <div className="flex items-end justify-between mt-6 pt-5 border-t border-white/8">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}><Icon className="w-4 h-4" style={{ color: accent }} /></span>
            <div>
              <div className="text-lg font-bold text-white tabular-nums leading-none">{fmtFull(Number(d.price_usd || 0))}</div>
              <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/40 mt-1">One-time acquisition</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="mt-3 text-[9px] font-mono uppercase tracking-[0.16em] text-emerald-300/70">Deployed in {regionsOf(d)} regions</div>
      </div>
    </Link>
  );
};

// ── compact infrastructure card ──
const InfraCard: React.FC<{ d: Domain }> = ({ d }) => {
  const accent = ACCENTS[d.category || ''] || ACCENT;
  return (
    <Link to={`/d/${encodeURIComponent(d.domain_name)}`}
      className="group relative block overflow-hidden rounded-xl border border-white/10 bg-white/[0.012] hover:border-white/25 hover:bg-white/[0.03] transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="font-display text-lg font-bold text-white tracking-tight">{d.domain_name}</span>
        <ArrowRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
      <p className="text-[12px] text-white/45 leading-snug line-clamp-2 min-h-[2.2rem] mb-4">{d.tagline}</p>
      <div className="text-base font-bold text-white tabular-nums" style={{ color: accent }}>{fmtFull(Number(d.price_usd || 0))}</div>
    </Link>
  );
};

const SectionHead: React.FC<{ kicker: string; title: string; to?: string; cta?: string }> = ({ kicker, title, to, cta }) => (
  <div className="flex items-end justify-between gap-6 mb-8">
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-3">{kicker}</div>
      <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter text-white leading-[0.98]">{title}</h2>
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
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('*').eq('status', 'active').order('valuation_score', { ascending: false });
      setDomains((data || []) as Domain[]);
      setLoading(false);
    })();
  }, []);

  // every active asset is shown, grouped by deployment class (no truncation)
  const sovereign = useMemo(() => domains.filter((d) => Number(d.price_usd) >= 1e6), [domains]);
  const strategic = useMemo(() => domains.filter((d) => Number(d.price_usd) >= 4e5 && Number(d.price_usd) < 1e6), [domains]);
  const infra = useMemo(() => domains.filter((d) => Number(d.price_usd) < 4e5), [domains]);
  const gradeOf = (d: Domain): keyof typeof GRADE => (Number(d.price_usd) >= 1e6 ? 'sovereign' : Number(d.price_usd) >= 4e5 ? 'strategic' : 'infrastructure');

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <PageSubNav label="Exchange" items={[{ id: 'flagship', label: 'Flagship' }, { id: 'sovereign', label: 'Sovereign' }, { id: 'infrastructure', label: 'Infrastructure' }, { id: 'platforms', label: 'Platforms' }]} />

      <main>
        {/* ── SECTION 1 — acquisition hero (planet stretches ~3/4 and fills the banner) ── */}
        <section className="relative overflow-hidden h-[54vh] min-h-[440px] px-4 sm:px-6 lg:px-8">
          {/* planet sized by banner height; only the rim is masked so it stretches wide while the uneven crop fades */}
          <div className="absolute right-[-8%] sm:right-[-6%] lg:right-[-4%] top-[56%] -translate-y-1/2 h-[132%] pointer-events-none">
            <img src="/hero-globe.webp" alt="" aria-hidden className="h-full w-auto max-w-none animate-breathe"
              style={{ transformOrigin: '55% 50%', filter: 'saturate(1.05) brightness(0.96)',
                maskImage: 'radial-gradient(ellipse 84% 84% at 48% 50%, #000 76%, transparent 99%)',
                WebkitMaskImage: 'radial-gradient(ellipse 84% 84% at 48% 50%, #000 76%, transparent 99%)' }} />
          </div>
          {/* left scrim for type legibility */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(95deg, #050816 16%, rgba(5,8,22,0.82) 40%, rgba(5,8,22,0.22) 60%, transparent 78%)' }} />
          {/* top scrim — keep the planet clear of the menu bar */}
          <div className="absolute inset-x-0 top-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #050816 32%, transparent)' }} />
          {/* bottom fade into the feed */}
          <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to top, #050816, transparent)' }} />
          {/* far-right operational readout — compact, docked low */}
          <div className="hidden lg:block absolute right-5 bottom-7 text-right pointer-events-none">
            <div className="text-[8px] font-mono text-white/30 tabular-nums">24.7136°N · 46.6753°E</div>
            <div className="text-[8px] font-mono uppercase tracking-[0.22em] text-cyan-300/40 mt-1">Global sovereign infrastructure</div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-center pt-14">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.28em] mb-6">
                <Star className="w-3 h-3" /> Sovereign marketplace
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[0.94] mb-5">
                <span className="text-white">Acquire civilization-</span><br />
                <span className="text-white">scale </span><span className="text-gradient-cyan">systems.</span>
              </h1>
              <p className="text-base text-white/55 max-w-md leading-relaxed mb-7">
                The world's most advanced sovereign, financial and intelligence systems — deployable, interoperable, sovereign by design.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <button onClick={() => setBrief(true)} className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
                  style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.26)' }}>
                  Acquire now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#flagship" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur text-white font-semibold hover:bg-white/8 transition-all">
                  Explore systems
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-white/45">
                <span className="inline-flex items-center gap-1.5 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Market operational</span>
                <span>47 <span className="text-white/30">edge nodes</span></span>
                <span>23 <span className="text-white/30">regions</span></span>
                <span>99.99% <span className="text-white/30">uptime</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 — market intelligence feed ── */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto rounded-2xl border border-white/10 bg-white/[0.012] p-5 sm:p-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-300/60 mb-4">Market intelligence</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 rounded-xl overflow-hidden">
              {INTEL.map((it) => (
                <div key={it.name} className="bg-[#060b1a] px-5 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white"><span className="w-1.5 h-1.5 rounded-full" style={{ background: it.c }} /> {it.name}</span>
                    <span className="text-[10px] font-mono text-white/35">{it.ago} ago</span>
                  </div>
                  <p className="text-[12px] text-white/45 leading-snug">{it.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3 — flagship acquisition (CIVICOS Core) ── */}
        <section id="flagship" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 pb-24">
          <Reveal>
            <div className="relative max-w-7xl mx-auto rounded-[1.75rem] border border-white/10 overflow-hidden bg-[#04060f]" style={{ boxShadow: '0 50px 140px -50px rgba(0,0,0,0.9)' }}>
              <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
              <HudCorners color={ACCENT} className="opacity-40 z-10" />
              <div className="grid lg:grid-cols-[1.15fr_1fr]">
                <div className="relative p-8 sm:p-12 lg:p-14">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-6">Flagship acquisition</div>
                  <h2 className="font-display text-5xl sm:text-6xl font-bold tracking-tighter text-white leading-[0.9] mb-4">CIVICOS Core</h2>
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
                      Acquire CIVICOS Core <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <Link to="/systems/civicos" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] text-white font-semibold hover:bg-white/5 transition">
                      Deployment preview
                    </Link>
                  </div>
                </div>
                <div className="relative border-t lg:border-t-0 lg:border-l border-white/8 bg-white/[0.012] p-8 sm:p-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/45">Acquisition overview</span>
                    <Star className="w-4 h-4 text-amber-300/70" />
                  </div>
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
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] mb-2"><span className="text-white/40">Sovereign readiness</span><span className="text-white tabular-nums">98.6%</span></div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden"><span className="block h-full rounded-full" style={{ width: '98.6%', background: `linear-gradient(90deg, ${ACCENT}, #7C4DFF)` }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── SECTION 4 — sovereign systems (the full sovereign + strategic registry) ── */}
        {!loading && (sovereign.length > 0 || strategic.length > 0) && (
          <section id="sovereign" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <SectionHead kicker="Sovereign-grade" title="Sovereign systems." to="/ecosystem" cta={`${sovereign.length + strategic.length} systems`} />
              {sovereign.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                  {sovereign.map((d) => <SovereignCard key={d.id} d={d} grade={gradeOf(d)} />)}
                </div>
              )}
              {strategic.length > 0 && (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40 mb-5 mt-2">Strategic infrastructure · {strategic.length}</div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {strategic.map((d) => <SovereignCard key={d.id} d={d} grade={gradeOf(d)} />)}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── SECTION 5 — infrastructure & deployment systems (all remaining assets) ── */}
        {!loading && infra.length > 0 && (
          <section id="infrastructure" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <SectionHead kicker="Infrastructure" title="Infrastructure & deployment systems." to="/ecosystem" cta={`${infra.length} systems`} />
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {infra.map((d) => <InfraCard key={d.id} d={d} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 6 — deployable government platforms ── */}
        <section id="platforms" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 pb-28">
          <div className="max-w-7xl mx-auto">
            <SectionHead kicker="Civilization deployment" title="Deployable government platforms." to="/systems/civicos" cta="View deployment packages" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {GOV_TIERS.map((t) => (
                <Link key={t.tier} to={`/systems/civicos?tier=${t.tier.toLowerCase()}`}
                  className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.014] hover:border-white/25 transition-all duration-500 hover:-translate-y-1 p-6">
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${t.c}, transparent)` }} />
                  <span className="absolute -top-16 -right-14 w-40 h-40 rounded-full blur-[80px] opacity-15 group-hover:opacity-30 transition-opacity" style={{ background: t.c }} />
                  <HudCorners color={t.c} className="opacity-20 group-hover:opacity-50 transition-opacity" />
                  <div className="relative">
                    <span className="inline-block text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded mb-4" style={{ background: `${t.c}1f`, color: t.c }}>{t.label}</span>
                    <div className="font-display text-base font-bold text-white tracking-tight uppercase">CIVICOS {t.tier}</div>
                    <p className="text-[12px] text-white/45 leading-snug mt-1.5 mb-5 min-h-[2.4rem]">{t.desc}</p>
                    <div className="text-3xl font-bold text-white tabular-nums leading-none">{t.price}</div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/40 mt-2 mb-5">One-time deployment</div>
                    <div className="space-y-2 pt-4 border-t border-white/8">
                      {t.feats.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-[12px] text-white/65"><Check className="w-3.5 h-3.5 shrink-0" style={{ color: t.c }} /> {f}</div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── closing — strategic acquisition ── */}
        <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-28 sm:py-36">
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
