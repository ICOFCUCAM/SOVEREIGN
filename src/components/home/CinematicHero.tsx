import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Brain, Cloud, ShieldCheck, Globe, Rocket, Layers, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';

// Capability nodes that float around the orb (descriptors, not fabricated counts).
const NODES = [
  { label: 'AI Intelligence', sub: 'Real-time analysis', icon: Brain, pos: 'top-[6%] right-[10%]', delay: '0s' },
  { label: 'Sovereign Cloud', sub: 'Multi-region edge', icon: Cloud, pos: 'top-[34%] right-[-2%]', delay: '1.1s' },
  { label: 'Trust Layer', sub: 'Bank-grade security', icon: ShieldCheck, pos: 'bottom-[16%] right-[6%]', delay: '2.2s' },
  { label: 'Domain Intelligence', sub: 'AI valuations', icon: Globe, pos: 'bottom-[6%] left-[12%]', delay: '0.6s' },
  { label: 'Deployment Engine', sub: 'Minutes to live', icon: Rocket, pos: 'top-[10%] left-[2%]', delay: '1.7s' },
  { label: 'Autonomous Foundry', sub: 'Concept → company', icon: Layers, pos: 'top-[44%] left-[-4%]', delay: '2.8s' },
];

// Orb mesh geometry.
const C = 200;
const ring = (count: number, r: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  });
const outer = ring(7, 184);
const inner = ring(10, 120);

const InfraOrb: React.FC = () => (
  <div className="relative w-full max-w-[560px] aspect-square mx-auto">
    {/* Volumetric core glow */}
    <div className="absolute inset-[18%] rounded-full blur-[60px] animate-core"
      style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.55), rgba(124,58,237,0.25) 55%, transparent 72%)' }} />

    {/* Orbital rings */}
    <div className="absolute inset-0 rounded-full border border-cyan-400/15 animate-spin-slower" />
    <div className="absolute inset-[10%] rounded-full border border-purple-400/15 animate-spin-rev" />
    <div className="absolute inset-[22%] rounded-full border border-cyan-400/10 animate-spin-slow" />

    {/* Mesh */}
    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="orbCore" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(0,217,255,0.35)" />
          <stop offset="60%" stopColor="rgba(124,58,237,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D9FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      <circle cx={C} cy={C} r="150" fill="url(#orbCore)" />

      {/* radial connections core -> outer */}
      {outer.map((p, i) => (
        <line key={`r${i}`} x1={C} y1={C} x2={p.x} y2={p.y} stroke="url(#arc)" strokeWidth="0.6" opacity="0.35" />
      ))}
      {/* outer polygon (flowing dashes) */}
      <polygon points={outer.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="url(#arc)" strokeWidth="1" className="animate-dash" opacity="0.6" />
      {/* inner polygon */}
      <polygon points={inner.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.25" />

      {/* nodes */}
      {[...outer, ...inner].map((p, i) => (
        <circle key={`n${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 2.6 : 1.6} fill={i % 2 ? '#00D9FF' : '#7C3AED'}
          className="animate-node" style={{ animationDelay: `${(i % 6) * 0.5}s`, transformOrigin: `${p.x}px ${p.y}px` }} />
      ))}
      <circle cx={C} cy={C} r="4" fill="#fff" />
    </svg>
  </div>
);

const CinematicHero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ domains: 0, value: 0, identities: 0, systems: 0 });

  useEffect(() => {
    (async () => {
      const [d, b, e] = await Promise.all([
        supabase.from('domains').select('price_usd').eq('status', 'active'),
        supabase.from('brand_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('ecosystem_products').select('id', { count: 'exact', head: true }),
      ]);
      const rows = (d.data || []) as Pick<Domain, 'price_usd'>[];
      setStats({
        domains: rows.length,
        value: rows.reduce((s, r) => s + Number(r.price_usd || 0), 0),
        identities: b.count || 0,
        systems: e.count || 0,
      });
    })();
  }, []);

  const onMove = (ev: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width - 0.5;
    const py = (ev.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--px', px.toFixed(3));
    el.style.setProperty('--py', py.toFixed(3));
  };

  // Catalog figures are live from the DB; infrastructure figures are platform specs.
  const ribbon = [
    { label: 'Premium domains', value: stats.domains.toLocaleString(), icon: Globe },
    { label: 'Value indexed', value: `$${(stats.value / 1_000_000).toFixed(1)}M`, icon: DollarSign },
    { label: 'Edge regions', value: '23', icon: Cloud },
    { label: 'Ecosystem systems', value: stats.systems.toLocaleString(), icon: Layers },
    { label: 'Avg deploy', value: '< 2 min', icon: Rocket },
    { label: 'System uptime', value: '99.99%', icon: ShieldCheck },
  ];

  return (
    <section ref={sectionRef} onMouseMove={onMove}
      className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-10 overflow-hidden"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* Volumetric atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[6%] w-[820px] h-[820px] rounded-full blur-[180px] opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.18), transparent 70%)', transform: 'translate(calc(var(--px) * 26px), calc(var(--py) * 26px))' }} />
        <div className="absolute bottom-[-20%] left-[-5%] w-[760px] h-[760px] rounded-full blur-[180px] opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)', transform: 'translate(calc(var(--px) * -20px), calc(var(--py) * -20px))' }} />
        {/* perspective grid floor */}
        <div className="absolute bottom-0 inset-x-0 h-[45%] opacity-[0.12]" style={{
          backgroundImage: 'linear-gradient(rgba(0,217,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          transform: 'perspective(420px) rotateX(62deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
        {/* Copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.3em] mb-7">
            <Sparkles className="w-3 h-3" /> The operating system for digital civilization
          </div>
          <h1 className="font-display text-[2.6rem] sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] mb-6">
            The operating layer for
            <br />
            <span className="text-gradient-cyan">future digital civilization.</span>
          </h1>
          <p className="text-lg text-white/55 max-w-xl mb-9 leading-relaxed">
            Deploy sovereign digital institutions at planetary scale — where domains become economies, systems, and nations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/marketplace" className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition-all">
              Explore Marketplace <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/valuation" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-all">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Run AI Valuation
            </Link>
          </div>
        </div>

        {/* Cinematic centerpiece */}
        <div className="relative h-[420px] sm:h-[520px]" style={{ transform: 'translate(calc(var(--px) * -16px), calc(var(--py) * -16px))' }}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(calc(var(--px) * 10px), calc(var(--py) * 10px))' }}>
            <InfraOrb />
          </div>
          {/* Floating capability nodes */}
          {NODES.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.label} className={`absolute ${n.pos} animate-drift`} style={{ animationDelay: n.delay, transform: 'translate(calc(var(--px) * 22px), calc(var(--py) * 22px))' }}>
                <div className="glass-strong rounded-xl px-3 py-2 flex items-center gap-2.5 border border-white/10 shadow-xl">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                  <div className="leading-tight pr-1">
                    <div className="text-[11px] font-semibold text-white whitespace-nowrap">{n.label}</div>
                    <div className="text-[9px] font-mono text-white/40 whitespace-nowrap">{n.sub}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-metric ribbon */}
      <div className="relative max-w-7xl mx-auto w-full mt-12">
        <div className="glass rounded-2xl border border-white/5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-white/5">
          {ribbon.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="px-5 py-4">
                <Icon className="w-4 h-4 text-cyan-400 mb-2" />
                <div className="text-2xl font-bold text-white tabular-nums">{m.value}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mt-1">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;
