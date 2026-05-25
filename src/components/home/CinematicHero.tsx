import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Cloud, ShieldCheck, Truck, Wallet, Vote, ShieldAlert, DollarSign, Boxes, Brain, Rocket } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HeroEnvironment from '@/components/home/HeroEnvironment';

const Globe = lazy(() => import('@/components/home/Globe'));

// When a rendered environment plate is supplied, the live globe is layered
// over it as part of the interface; without a plate the SVG world already
// carries its own globe, so this overlay stays off to avoid doubling up.
const HAS_PLATE = !!((import.meta.env.VITE_HERO_PLATE as string | undefined)?.trim());

interface Panel { system: string; metric: string; detail: string; icon: React.ComponentType<{ className?: string }>; pos: string; side: 'l' | 'r'; delay: string; live?: boolean }
// Operational-intelligence feeds from live ecosystem systems, woven around the globe.
const PANELS: Panel[] = [
  { system: 'FlyttGo', metric: '1,284 active routes', detail: 'Logistics orchestration', icon: Truck, pos: 'top-[20%] left-[40%]', side: 'r', delay: '0s', live: true },
  { system: 'Mobile Pay', metric: '$4.2M settled · 24h', detail: 'Sovereign payment rails', icon: Wallet, pos: 'top-[15%] right-[5%]', side: 'l', delay: '1s', live: true },
  { system: 'Sovereign Cloud', metric: '47 edge nodes', detail: '23 regions online', icon: Cloud, pos: 'top-[40%] right-[1%]', side: 'l', delay: '2s' },
  { system: 'ELECPRO', metric: '3 elections live', detail: 'Integrity monitoring', icon: Vote, pos: 'top-[50%] left-[38%]', side: 'r', delay: '0.6s', live: true },
  { system: 'ACT', metric: '12 anomalies flagged', detail: 'Procurement oversight', icon: ShieldAlert, pos: 'top-[58%] right-[7%]', side: 'l', delay: '1.7s' },
  { system: 'Trust Layer', metric: 'Bank-grade security', detail: 'Sovereign ready', icon: ShieldCheck, pos: 'bottom-[24%] right-[15%]', side: 'l', delay: '2.6s' },
];

const CinematicHero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [domains, setDomains] = useState(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('domains').select('price_usd').eq('status', 'active');
      const rows = (data || []) as Array<{ price_usd: number }>;
      setDomains(rows.length);
      setValue(rows.reduce((s, r) => s + Number(r.price_usd || 0), 0));
    })();
  }, []);

  const onMove = (ev: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const ribbon = [
    { icon: Boxes, label: 'Premium domains', value: domains.toLocaleString() },
    { icon: DollarSign, label: 'Value indexed', value: `$${(value / 1e6).toFixed(1)}M` },
    { icon: Cloud, label: 'Edge nodes', value: '47' },
    { icon: Brain, label: 'AI valuations', value: '12.4K+' },
    { icon: Rocket, label: 'Avg deploy', value: '87s' },
    { icon: ShieldCheck, label: 'System uptime', value: '99.99%' },
  ];

  return (
    <section ref={sectionRef} onMouseMove={onMove} className="relative h-[85vh] min-h-[620px] overflow-hidden" style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* ── LAYER 1 · THE WORLD (cinematic environment plate or SVG fallback) ── */}
      <HeroEnvironment />

      {/* ── LAYER 2 · THE LIVE SYSTEM (interface over the world) ── */}
      {HAS_PLATE && (
        <div className="absolute z-[15] top-[10%] right-[-6%] sm:right-[-2%] lg:right-[3%] w-[82vw] sm:w-[58vw] lg:w-[44vw] max-w-[600px] aspect-square"
          style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -10px))' }}>
          <Suspense fallback={<div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.12), transparent 66%)' }} />}>
            <Globe className="w-full h-full" />
          </Suspense>
        </div>
      )}

      {/* ── FLOATING OPERATIONAL PANELS ── */}
      {PANELS.map((p) => {
        const Icon = p.icon;
        return (
          <div key={p.system} className={`hidden md:block absolute z-20 ${p.pos} animate-drift`} style={{ animationDelay: p.delay, transform: 'translate(calc(var(--px) * 14px), calc(var(--py) * 14px))' }}>
            {/* ecosystem lighting bleed — the panel sits in the atmosphere, casting glow */}
            <span className="pointer-events-none absolute -inset-6 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,150,255,0.16), transparent 70%)', filter: 'blur(8px)' }} />
            <div className="relative glass-strong rounded-xl px-3.5 py-2.5 border border-white/10 flex items-center gap-2.5 shadow-2xl">
              <span className={`pointer-events-none absolute top-1/2 ${p.side === 'r' ? 'left-full' : 'right-full'} w-9 h-px`}
                style={{ background: p.side === 'r' ? 'linear-gradient(90deg, rgba(0,194,255,0.6), transparent)' : 'linear-gradient(270deg, rgba(0,194,255,0.6), transparent)' }} />
              <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${p.side === 'r' ? 'left-[calc(100%+34px)]' : 'right-[calc(100%+34px)]'} w-1.5 h-1.5 rounded-full bg-cyan-300 animate-node`} />
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/25 to-purple-600/25 border border-cyan-500/25 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="leading-tight pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40">{p.system}</span>
                  {p.live && <span className="inline-flex items-center gap-1 text-[7px] font-mono uppercase tracking-wider text-emerald-300/80"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-node" />Live</span>}
                </div>
                <div className="text-[12px] font-semibold text-white whitespace-nowrap tabular-nums">{p.metric}</div>
                <div className="text-[9px] font-mono text-white/45 whitespace-nowrap">{p.detail}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── CONTENT (embedded in the world) ── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-24 pb-28">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.3em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign OS · Live
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.9rem] font-bold tracking-tight leading-[1.05] mb-6">
            <span className="block text-white">The operating layer for</span>
            <span className="block text-gradient-cyan">future digital civilization.</span>
          </h1>
          <p className="text-base text-white/55 max-w-md mb-8 leading-relaxed">
            Deploy sovereign institutions, operational ecosystems, and AI-native infrastructure at planetary scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.28)' }}>
              Enter Ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur text-white font-semibold hover:bg-white/5 transition-all">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Explore Marketplace
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['#00C2FF', '#7C4DFF', '#10B981', '#F59E0B'].map((c) => (
                <div key={c} className="w-7 h-7 rounded-full border-2 border-[#050816]" style={{ background: `linear-gradient(135deg, ${c}, #050816)` }} />
              ))}
            </div>
            <span className="text-xs text-white/45">Trusted by governments, enterprises & innovators</span>
          </div>
        </div>
      </div>

      {/* ── INFRASTRUCTURE RIBBON (floats over the city floor) ── */}
      <div className="absolute bottom-5 inset-x-0 z-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto glass-strong rounded-2xl border border-white/10 grid grid-cols-3 lg:grid-cols-6 divide-x divide-white/5">
          {ribbon.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-cyan-400" /></div>
                <div>
                  <div className="text-lg font-bold text-white tabular-nums leading-none">{m.value}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1">{m.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;
