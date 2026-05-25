import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { EcosystemProduct } from '@/lib/types';
import Globe from '@/components/home/Globe';

// Fixed slots around the globe for the floating system chips (benchmark-style).
const SLOTS = ['top-[6%] left-[1%]', 'top-[4%] right-[3%]', 'top-[40%] right-[-3%]', 'bottom-[16%] left-[-2%]', 'bottom-[10%] right-[5%]'];

const CinematicHero: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [systems, setSystems] = useState<EcosystemProduct[]>([]);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
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

  const active = systems.length ? pulse % systems.length : 0;
  const liveCount = systems.filter((s) => s.url).length;
  const chips = systems.slice(0, 5);

  return (
    <section ref={sectionRef} onMouseMove={onMove}
      className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8 pt-24 pb-16 overflow-hidden"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-6%] left-1/3 w-[760px] h-[760px] rounded-full blur-[180px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.16), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-1/4 w-[640px] h-[640px] rounded-full blur-[180px] opacity-30" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.16), transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_290px] gap-8 items-center">
        {/* LEFT — positioning */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/55 text-[10px] font-mono uppercase tracking-[0.28em] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sovereign OS · Live
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter leading-[0.95] mb-5">
            The operating layer for <span className="text-gradient-cyan">digital civilization.</span>
          </h1>
          <p className="text-white/55 leading-relaxed mb-8 max-w-sm">
            A live network of deployable institutions — governance, finance, intelligence, logistics — orchestrated across the globe.
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

        {/* CENTER — living globe + floating systems */}
        <div className="relative h-[380px] sm:h-[540px]" style={{ transform: 'translate(calc(var(--px) * -8px), calc(var(--py) * -8px))' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="w-full max-w-[540px] h-auto" />
          </div>
          {chips.map((s, i) => {
            const metric = Array.isArray(s.metrics) && s.metrics[0] ? `${s.metrics[0].label} · ${s.metrics[0].value}` : s.category;
            const on = i === active;
            return (
              <Link key={s.id} to={`/systems/${s.slug}`} className={`absolute z-10 ${SLOTS[i]} animate-drift`} style={{ animationDelay: `${i * 0.9}s`, transform: 'translate(calc(var(--px) * 18px), calc(var(--py) * 18px))' }}>
                <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border backdrop-blur transition-all ${on ? 'glass-strong border-white/20 scale-105' : 'bg-white/[0.04] border-white/10 hover:border-white/20'}`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.accent, boxShadow: on ? `0 0 8px ${s.accent}` : 'none' }} />
                  <div className="leading-tight pr-1">
                    <div className="text-[11px] font-semibold text-white whitespace-nowrap max-w-[150px] truncate">{s.name}</div>
                    <div className="text-[9px] font-mono text-white/40 whitespace-nowrap max-w-[150px] truncate">{metric}</div>
                  </div>
                </div>
              </Link>
            );
          })}
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
            <div className="space-y-1.5">
              {systems.slice(0, 9).map((s, i) => {
                const on = i === active;
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

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">
        <span>{systems.length} systems</span><span className="w-1 h-1 rounded-full bg-white/20" />
        <span>5 sectors</span><span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="text-cyan-300/60">planetary scale</span>
      </div>
    </section>
  );
};

export default CinematicHero;
