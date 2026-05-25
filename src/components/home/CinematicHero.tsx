import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';

interface Node {
  p: EcosystemProduct;
  x: number; // percentage within the center field
  y: number;
}

const CinematicHero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [systems, setSystems] = useState<EcosystemProduct[]>([]);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('ecosystem_products')
        .select('*')
        .order('sort_order', { ascending: true });
      setSystems((data || []) as EcosystemProduct[]);
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const onMove = (ev: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  // Topology nodes — the real systems arranged in a sovereign mesh.
  const topo = systems.slice(0, 8);
  const nodes: Node[] = topo.map((p, i) => {
    const a = (i / Math.max(1, topo.length)) * Math.PI * 2 - Math.PI / 2;
    return { p, x: 50 + 39 * Math.cos(a), y: 50 + 39 * Math.sin(a) };
  });
  const activeIdx = nodes.length ? pulse % nodes.length : 0;

  const liveCount = systems.filter((s) => s.url).length;

  return (
    <section ref={sectionRef} onMouseMove={onMove}
      className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8 pt-24 pb-16 overflow-hidden"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-1/3 w-[700px] h-[700px] rounded-full blur-[170px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.16), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-1/4 w-[640px] h-[640px] rounded-full blur-[170px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.16), transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_300px] gap-8 items-center">
        {/* LEFT — strategic positioning */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/55 text-[10px] font-mono uppercase tracking-[0.28em] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sovereign OS · Live
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter leading-[0.95] mb-5">
            The operating layer for <span className="text-gradient-cyan">digital civilization.</span>
          </h1>
          <p className="text-white/55 leading-relaxed mb-8 max-w-sm">
            An interconnected network of deployable institutions — governance, finance, intelligence, logistics — already operating at planetary scale.
          </p>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
            <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition">
              Enter the ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition">
              Explore marketplace
            </Link>
          </div>
        </div>

        {/* CENTER — living ecosystem topology */}
        <div className="relative h-[380px] sm:h-[520px]" style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -10px))' }}>
          {/* connection layer */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="flow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00D9FF" /><stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            {nodes.map((n, i) => (
              <line key={`c${i}`} x1="50" y1="50" x2={n.x} y2={n.y} stroke="url(#flow)" strokeWidth="0.25"
                strokeDasharray="1.5 2.5" className="animate-dash" opacity={i === activeIdx ? 0.9 : 0.3} vectorEffect="non-scaling-stroke" />
            ))}
            {nodes.map((n, i) => {
              const m = nodes[(i + 1) % nodes.length];
              return <line key={`r${i}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="#ffffff" strokeWidth="0.18" opacity="0.08" vectorEffect="non-scaling-stroke" />;
            })}
          </svg>

          {/* core */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="absolute inset-[-44px] rounded-full blur-[44px] animate-core" style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.5), rgba(124,58,237,0.2) 60%, transparent)' }} />
            <div className="relative w-24 h-24 rounded-2xl glass-strong border border-cyan-400/20 flex flex-col items-center justify-center">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-cyan-300/80">Sovereign</div>
              <div className="font-display text-base font-bold text-white">CORE</div>
              <div className="mt-1 flex items-center gap-1 text-[8px] font-mono text-emerald-300"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> online</div>
            </div>
          </div>

          {/* system nodes */}
          {nodes.map((n, i) => (
            <div key={n.p.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-transform" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
              <Link to={`/systems/${n.p.slug}`}
                className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 border backdrop-blur transition-all ${i === activeIdx ? 'glass-strong border-white/20 scale-105' : 'bg-white/[0.04] border-white/10 hover:border-white/20'}`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: n.p.accent, boxShadow: i === activeIdx ? `0 0 8px ${n.p.accent}` : 'none' }} />
                <span className="text-[11px] font-medium text-white/85 whitespace-nowrap max-w-[120px] truncate">{n.p.name}</span>
              </Link>
            </div>
          ))}
        </div>

        {/* RIGHT — operational intelligence */}
        <div className="hidden lg:block">
          <div className="glass-strong rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-cyan-400" /> Operational Intelligence</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All systems operational
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-hidden">
              {systems.slice(0, 9).map((s, i) => {
                const on = i === activeIdx;
                const metric = Array.isArray(s.metrics) && s.metrics[0] ? s.metrics[0].value : (s.url ? 'Live' : 'Ready');
                return (
                  <div key={s.id} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${on ? 'bg-white/[0.06]' : ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.accent, boxShadow: on ? `0 0 6px ${s.accent}` : 'none' }} />
                    <span className="text-xs text-white/75 flex-1 truncate">{s.name}</span>
                    <span className="text-[10px] font-mono text-white/40 tabular-nums shrink-0">{metric}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-white font-bold text-sm tabular-nums">{systems.length}</div><div className="text-[8px] font-mono uppercase text-white/40">Systems</div></div>
              <div><div className="text-white font-bold text-sm tabular-nums">{liveCount}</div><div className="text-[8px] font-mono uppercase text-white/40">Live</div></div>
              <div><div className="text-white font-bold text-sm tabular-nums">5</div><div className="text-[8px] font-mono uppercase text-white/40">Sectors</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom signal */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">
        <span>{systems.length} systems</span><span className="w-1 h-1 rounded-full bg-white/20" />
        <span>5 sectors</span><span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="text-cyan-300/60">planetary scale</span>
      </div>
    </section>
  );
};

export default CinematicHero;
