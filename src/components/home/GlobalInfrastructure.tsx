import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import HudCorners from '@/components/HudCorners';

const Globe = lazy(() => import('@/components/home/Globe'));
const ACCENT = '#00D9FF';

const CLASSES: Array<[string, string]> = [
  ['Core', '#22E0FF'], ['Strategic', '#7C4DFF'], ['Treasury', '#10E5A0'], ['Emergency', '#FF5470'], ['Edge', '#5AA0FF'],
];

interface MetricDef { value: number; decimals?: number; suffix?: string; label: string }
const METRICS: MetricDef[] = [
  { value: 47, label: 'Edge nodes' },
  { value: 23, label: 'Sovereign regions' },
  { value: 99.99, decimals: 2, suffix: '%', label: 'Network uptime' },
  { value: 87, suffix: 's', label: 'Median deploy' },
  { value: 214, label: 'Active routes' },
];
const STATUS: Array<[string, string]> = [
  ['Routing', 'Synchronized'], ['Edge mesh', 'Nominal'], ['Interop fabric', 'Verified'],
];

const MetricRow: React.FC<{ m: MetricDef; i: number }> = ({ m, i }) => {
  const { ref, value } = useCountUp(m.value, 1600 + i * 130, m.decimals || 0);
  const shown = m.decimals ? value.toFixed(m.decimals) : Math.round(value).toLocaleString();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="flex items-baseline justify-between py-3.5 border-b border-white/[0.07]">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">{m.label}</span>
      <span className="text-xl sm:text-2xl font-bold text-white tabular-nums leading-none tracking-tight">
        {shown}<span className="text-white/45 text-[0.55em] font-semibold ml-0.5">{m.suffix}</span>
      </span>
    </div>
  );
};

const GlobalInfrastructure: React.FC = () => (
  <section className="relative py-28 sm:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <div className="absolute top-1/3 right-[10%] w-[46vw] h-[46vw] max-w-[760px] rounded-full blur-[130px] opacity-[0.07]" style={{ background: ACCENT }} />
    </div>

    <div className="relative max-w-7xl mx-auto">
      {/* deployment statement */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">Deployment infrastructure</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Operational
          </span>
        </div>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-[0.92]">
          A planetary edge mesh,
          <span className="block text-gradient-cyan">deployable in seconds.</span>
        </h2>
        <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mt-7">
          Sovereign routing across protected regions — institutions synchronize through a live intelligence fabric of orbital relays, edge nodes and signal corridors.
        </p>
      </div>

      {/* command console — living globe + deployment readout */}
      <div className="relative rounded-[1.75rem] border border-white/10 overflow-hidden bg-[#04060f]" style={{ boxShadow: '0 40px 120px -40px rgba(0,0,0,0.9)' }}>
        <span className="absolute inset-x-0 top-0 h-px z-20" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}88, transparent)` }} />
        <HudCorners color={ACCENT} className="opacity-40 z-20" />
        {/* command header */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 sm:px-7 py-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">Sovereign network · real-time</span>
          <div className="hidden md:flex items-center gap-x-4">
            {CLASSES.map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/40">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} /> {l}
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.45fr_1fr]">
          {/* living infrastructure object */}
          <div className="relative aspect-square lg:aspect-auto lg:min-h-[560px] flex items-center justify-center px-4 pt-12 pb-4"
            style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 52%, rgba(0,140,255,0.06), transparent 70%)' }}>
            <Suspense fallback={<div className="w-3/4 aspect-square rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.12), transparent 66%)' }} />}>
              <Globe className="w-full h-full max-w-[560px]" />
            </Suspense>
          </div>

          {/* deployment readout */}
          <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:p-9 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-white/[0.012]">
            <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-cyan-300/70 mb-4">Deployment telemetry</div>
            {METRICS.map((m, i) => <MetricRow key={m.label} m={m} i={i} />)}
            <div className="mt-6 space-y-2.5">
              {STATUS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em]">
                  <span className="text-white/40">{k}</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> {v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link to="/deploy" className="group inline-flex items-center gap-2 text-white font-semibold text-lg">
          Open the deployment engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-400" />
        </Link>
      </div>
    </div>
  </section>
);

export default GlobalInfrastructure;
