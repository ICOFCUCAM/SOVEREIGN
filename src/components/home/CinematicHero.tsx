import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Cloud, ShieldCheck, Globe, Rocket, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Capability nodes framing the ambient orb.
const NODES = [
  { label: 'AI Intelligence', sub: 'Real-time analysis', icon: Brain, pos: 'top-[14%] left-[7%]', delay: '0s' },
  { label: 'Sovereign Cloud', sub: 'Multi-region edge', icon: Cloud, pos: 'top-[12%] right-[8%]', delay: '1.1s' },
  { label: 'Trust Layer', sub: 'Bank-grade security', icon: ShieldCheck, pos: 'top-[42%] right-[3%]', delay: '2.2s' },
  { label: 'Domain Intelligence', sub: 'AI valuations', icon: Globe, pos: 'bottom-[24%] left-[4%]', delay: '0.6s' },
  { label: 'Deployment Engine', sub: 'Minutes to live', icon: Rocket, pos: 'bottom-[20%] right-[7%]', delay: '1.7s' },
  { label: 'Autonomous Foundry', sub: 'Concept → company', icon: Layers, pos: 'top-[44%] left-[3%]', delay: '2.8s' },
];

const C = 200;
const ring = (count: number, r: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  });
const outer = ring(7, 184);
const inner = ring(10, 120);

const InfraOrb: React.FC = () => (
  <div className="relative w-full max-w-[680px] aspect-square">
    <div className="absolute inset-[18%] rounded-full blur-[70px] animate-core"
      style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.5), rgba(124,58,237,0.22) 55%, transparent 72%)' }} />
    <div className="absolute inset-0 rounded-full border border-cyan-400/12 animate-spin-slower" />
    <div className="absolute inset-[10%] rounded-full border border-purple-400/12 animate-spin-rev" />
    <div className="absolute inset-[22%] rounded-full border border-cyan-400/8 animate-spin-slow" />
    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="orbCore2" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(0,217,255,0.3)" />
          <stop offset="60%" stopColor="rgba(124,58,237,0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="arc2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D9FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r="150" fill="url(#orbCore2)" />
      {outer.map((p, i) => <line key={`r${i}`} x1={C} y1={C} x2={p.x} y2={p.y} stroke="url(#arc2)" strokeWidth="0.6" opacity="0.3" />)}
      <polygon points={outer.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="url(#arc2)" strokeWidth="1" className="animate-dash" opacity="0.5" />
      <polygon points={inner.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.2" />
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
  const [signals, setSignals] = useState({ systems: 0, domains: 0 });

  useEffect(() => {
    (async () => {
      const [e, d] = await Promise.all([
        supabase.from('ecosystem_products').select('id', { count: 'exact', head: true }),
        supabase.from('domains').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      setSignals({ systems: e.count || 0, domains: d.count || 0 });
    })();
  }, []);

  const onMove = (ev: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section ref={sectionRef} onMouseMove={onMove}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* Ambient orb centerpiece */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.55]"
        style={{ transform: 'translate(calc(var(--px) * 14px), calc(var(--py) * 14px))' }}>
        <InfraOrb />
      </div>
      {/* Legibility scrim */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at center, rgba(5,7,26,0.82), rgba(5,7,26,0.35) 55%, transparent 80%)' }} />
      {/* Perspective grid floor */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[40%] opacity-[0.10]" style={{
        backgroundImage: 'linear-gradient(rgba(0,217,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.5) 1px, transparent 1px)',
        backgroundSize: '52px 52px', transform: 'perspective(440px) rotateX(64deg)', transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
      }} />

      {/* Floating capability nodes */}
      {NODES.map((n) => {
        const Icon = n.icon;
        return (
          <div key={n.label} className={`hidden lg:block absolute ${n.pos} animate-drift`} style={{ animationDelay: n.delay, transform: 'translate(calc(var(--px) * 20px), calc(var(--py) * 20px))' }}>
            <div className="glass rounded-xl px-3 py-2 flex items-center gap-2.5 border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/25 to-purple-600/25 border border-cyan-500/25 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div className="leading-tight pr-1 text-left">
                <div className="text-[11px] font-semibold text-white whitespace-nowrap">{n.label}</div>
                <div className="text-[9px] font-mono text-white/40 whitespace-nowrap">{n.sub}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Centered copy */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/55 text-[10px] font-mono uppercase tracking-[0.3em] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sovereign OS · Live
        </div>
        <h1 className="font-display text-[2.9rem] sm:text-7xl lg:text-[5.8rem] font-bold tracking-tighter leading-[0.92] mb-7">
          The operating layer for
          <br />
          <span className="text-gradient-cyan">digital civilization.</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
          Where domains become economies, systems, and nations — deployed as sovereign institutions at planetary scale.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition-all">
            Enter the ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-all">
            Explore the marketplace
          </Link>
        </div>
      </div>

      {/* Thin live signal line */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
        <span>{signals.systems} systems</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>5 sectors</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>{signals.domains} institutions</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="text-cyan-300/60">planetary scale</span>
      </div>
    </section>
  );
};

export default CinematicHero;
