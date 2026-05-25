import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Rocket, Brain, Cloud, ShieldCheck, Layers, Gauge, DollarSign, Boxes } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Cityscape from '@/components/home/Cityscape';

const Globe = lazy(() => import('@/components/home/Globe'));

interface Panel { title: string; lines: string[]; icon: React.ComponentType<{ className?: string }>; pos: string; side: 'l' | 'r'; delay: string }
// Positioned across the right ~60% of the scene, woven around the embedded globe.
const PANELS: Panel[] = [
  { title: 'Deployment Engine', lines: ['87s average deploy'], icon: Rocket, pos: 'top-[20%] left-[40%]', side: 'r', delay: '0s' },
  { title: 'AI Intelligence', lines: ['Real-time analysis'], icon: Brain, pos: 'top-[15%] right-[5%]', side: 'l', delay: '1s' },
  { title: 'Sovereign Cloud', lines: ['47 edge nodes', '23 regions'], icon: Cloud, pos: 'top-[40%] right-[1%]', side: 'l', delay: '2s' },
  { title: 'Domain Intelligence', lines: ['12.4K valuations'], icon: Gauge, pos: 'top-[50%] left-[38%]', side: 'r', delay: '0.6s' },
  { title: 'Trust Layer', lines: ['Bank-grade security', 'Sovereign ready'], icon: ShieldCheck, pos: 'top-[58%] right-[7%]', side: 'l', delay: '1.7s' },
  { title: 'Autonomous Foundry', lines: ['Concept → company'], icon: Layers, pos: 'bottom-[24%] right-[15%]', side: 'l', delay: '2.6s' },
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
    <section ref={sectionRef} onMouseMove={onMove} className="relative min-h-screen overflow-hidden" style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* ── ENVIRONMENT (full bleed) ── */}
      <div className="absolute inset-0">
        {/* deep atmosphere */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 68% 34%, rgba(10,20,52,0.95), transparent 60%), radial-gradient(circle at 72% 36%, rgba(0,194,255,0.13), transparent 52%), radial-gradient(circle at 60% 78%, rgba(124,77,255,0.12), transparent 55%)' }} />
        {/* ambient particles */}
        {Array.from({ length: 34 }).map((_, i) => (
          <div key={`pt${i}`} className="absolute w-0.5 h-0.5 rounded-full bg-cyan-300/40 animate-float"
            style={{ left: `${(i * 41) % 100}%`, top: `${(i * 67) % 96}%`, animationDelay: `${i * 0.35}s`, animationDuration: `${7 + (i % 6)}s` }} />
        ))}
        {/* embedded globe (right of centre) */}
        <div className="absolute top-[4%] sm:top-0 right-[-6%] lg:right-[2%] h-[78%] aspect-square max-w-[64%]"
          style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -10px))' }}>
          <Suspense fallback={<div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.12), transparent 66%)' }} />}>
            <Globe className="w-full h-full" />
          </Suspense>
        </div>
        {/* full-bleed megacity floor */}
        <div className="absolute bottom-0 inset-x-0 h-[44%]" style={{ transform: 'translate(calc(var(--px) * 4px), 0)' }}>
          <Cityscape className="w-full h-full" />
        </div>
        {/* haze seam: city tops dissolve into atmosphere + globe */}
        <div className="absolute bottom-[34%] inset-x-0 h-[20%] pointer-events-none" style={{ background: 'linear-gradient(to top, #050816 12%, rgba(5,8,22,0.55) 50%, transparent)' }} />
        {/* glow bleed where globe meets city */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 60% 64%, rgba(0,194,255,0.12), transparent 38%)' }} />
        {/* left legibility scrim — blends copy into the world */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(100deg, #050816 0%, rgba(5,8,22,0.92) 26%, rgba(5,8,22,0.55) 46%, transparent 68%)' }} />
      </div>

      {/* ── FLOATING OPERATIONAL PANELS ── */}
      {PANELS.map((p) => {
        const Icon = p.icon;
        return (
          <div key={p.title} className={`hidden md:block absolute z-20 ${p.pos} animate-drift`} style={{ animationDelay: p.delay, transform: 'translate(calc(var(--px) * 14px), calc(var(--py) * 14px))' }}>
            <div className="relative glass-strong rounded-xl px-3.5 py-2.5 border border-white/10 flex items-center gap-2.5 shadow-2xl">
              <span className={`pointer-events-none absolute top-1/2 ${p.side === 'r' ? 'left-full' : 'right-full'} w-9 h-px`}
                style={{ background: p.side === 'r' ? 'linear-gradient(90deg, rgba(0,194,255,0.6), transparent)' : 'linear-gradient(270deg, rgba(0,194,255,0.6), transparent)' }} />
              <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${p.side === 'r' ? 'left-[calc(100%+34px)]' : 'right-[calc(100%+34px)]'} w-1.5 h-1.5 rounded-full bg-cyan-300 animate-node`} />
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/25 to-purple-600/25 border border-cyan-500/25 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="leading-tight pr-1">
                <div className="text-[12px] font-semibold text-white whitespace-nowrap">{p.title}</div>
                {p.lines.map((l) => <div key={l} className="text-[9px] font-mono text-white/45 whitespace-nowrap">{l}</div>)}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── CONTENT (embedded in the world) ── */}
      <div className="relative z-10 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-24 pb-28">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300/75 text-[10px] font-mono uppercase tracking-[0.26em] mb-7">
            <Sparkles className="w-3 h-3" /> The operating system for digital civilization
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[0.95] mb-5">
            <span className="block text-white">Build the future.</span>
            <span className="block text-gradient-cyan">Own the infrastructure.</span>
          </h1>
          <p className="text-base text-white/60 max-w-md mb-7 leading-relaxed">
            Sovereign domain intelligence, AI-native deployment infrastructure, and autonomous venture creation — at planetary scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-7">
            <Link to="/marketplace" className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-white font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 40px rgba(0,194,255,0.3)' }}>
              Explore Marketplace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/valuation" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur text-white font-semibold hover:bg-white/5 transition-all">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Run AI Valuation
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
