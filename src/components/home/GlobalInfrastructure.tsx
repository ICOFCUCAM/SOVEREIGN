import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import HudCorners from '@/components/HudCorners';
import type { MapNode } from '@/components/WorldMap';

const WorldMap = lazy(() => import('@/components/WorldMap'));
const ACCENT = '#00D9FF';

// Edge nodes at real city coordinates [lon, lat], by deployment class.
const NODES: MapNode[] = [
  { lon: -74, lat: 40.7, cls: 'core' }, { lon: -46.6, lat: -23.5, cls: 'emergency' }, { lon: -0.1, lat: 51.5, cls: 'core' },
  { lon: 8.7, lat: 50.1, cls: 'treasury' }, { lon: 3.4, lat: 6.5, cls: 'treasury' }, { lon: 36.8, lat: -1.3, cls: 'edge' }, { lon: 55.3, lat: 25.2, cls: 'strategic' },
  { lon: 72.8, lat: 19, cls: 'edge' }, { lon: 103.8, lat: 1.3, cls: 'strategic' }, { lon: 139.7, lat: 35.7, cls: 'core' },
  { lon: 151.2, lat: -33.9, cls: 'edge' }, { lon: -118, lat: 34, cls: 'strategic' }, { lon: 28, lat: -26.2, cls: 'emergency' },
  { lon: 13.4, lat: 52.5, cls: 'edge' }, { lon: 126.9, lat: 37.5, cls: 'strategic' }, { lon: 121.5, lat: 31.2, cls: 'edge' },
  { lon: -79.4, lat: 43.7, cls: 'edge' }, { lon: 2.3, lat: 48.9, cls: 'edge' }, { lon: 100.5, lat: 13.7, cls: 'edge' },
];
const ARCS: Array<[number, number, number]> = [
  [0, 2, 0], [2, 6, 0.5], [6, 8, 1], [8, 9, 0.4], [0, 11, 1.2], [2, 3, 0.7],
  [6, 7, 0.3], [8, 10, 0.9], [2, 4, 1.4], [6, 12, 0.6], [0, 1, 1.1], [9, 8, 1.5],
  [11, 9, 2.0], [6, 9, 1.7], [2, 8, 1.1], [3, 6, 0.8], [4, 12, 1.3], [0, 9, 2.3],
];

const CLASSES: Array<[string, string]> = [
  ['Core', '#22E0FF'], ['Strategic', '#7C4DFF'], ['Treasury', '#10E5A0'], ['Emergency', '#FF5470'], ['Edge', '#5AA0FF'],
];

interface MetricDef { value: number; decimals?: number; prefix?: string; suffix?: string; label: string }
const METRICS: MetricDef[] = [
  { value: 47, label: 'Edge nodes' },
  { value: 23, label: 'Sovereign regions' },
  { value: 99.99, decimals: 2, suffix: '%', label: 'Network uptime' },
  { value: 87, suffix: 's', label: 'Median deploy' },
  { value: 214, label: 'Active routes' },
];

const Metric: React.FC<{ m: MetricDef; i: number }> = ({ m, i }) => {
  const { ref, value } = useCountUp(m.value, 1700 + i * 120, m.decimals || 0);
  const shown = m.decimals ? value.toFixed(m.decimals) : Math.round(value).toLocaleString();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="relative px-5 sm:px-7 py-6 text-center">
      <div className="text-2xl sm:text-3xl lg:text-[2.6rem] font-bold text-white tabular-nums leading-none tracking-tight">
        {m.prefix}{shown}<span className="text-white/45 text-[0.5em] font-semibold ml-0.5">{m.suffix}</span>
      </div>
      <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mt-3">{m.label}</div>
      <span className="absolute inset-x-7 bottom-0 h-px opacity-40" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
    </div>
  );
};

const GlobalInfrastructure: React.FC = () => (
  <section className="relative py-28 sm:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
    {/* deep atmospheric field */}
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[40vw] max-w-[900px] rounded-full blur-[120px] opacity-[0.06]" style={{ background: ACCENT }} />
    </div>

    <div className="relative max-w-7xl mx-auto">
      {/* TOP — massive deployment statement */}
      <div className="max-w-4xl mb-14 sm:mb-20">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">Global deployment theater</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live
          </span>
        </div>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-white leading-[0.92]">
          The planet is the
          <span className="block text-gradient-cyan">deployment surface.</span>
        </h2>
        <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mt-7">
          A sovereign edge mesh spanning continents — institutions provision across protected regions in seconds, routed through a living intelligence fabric.
        </p>
      </div>

      {/* CENTER — large cinematic command display */}
      <div className="relative rounded-[1.75rem] border border-white/10 overflow-hidden bg-[#04060f]" style={{ boxShadow: '0 40px 120px -40px rgba(0,0,0,0.9)' }}>
        <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}88, transparent)` }} />
        <HudCorners color={ACCENT} className="opacity-40 z-10" />
        {/* header legibility scrim */}
        <div className="absolute top-0 inset-x-0 h-20 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(4,6,15,0.85), transparent)' }} />
        {/* command-bar header */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 sm:px-7 py-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">Sovereign network · real-time</span>
          <div className="hidden sm:flex items-center gap-x-4 gap-y-1">
            {CLASSES.map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-white/40">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} /> {l}
              </span>
            ))}
          </div>
        </div>
        <div className="relative" style={{ aspectRatio: '2 / 1' }}>
          <Suspense fallback={<div className="w-full h-full" />}>
            <WorldMap accent={ACCENT} nodes={NODES} arcs={ARCS} className="w-full h-full" />
          </Suspense>
        </div>
      </div>

      {/* BOTTOM — premium institutional telemetry bar */}
      <div className="relative mt-7 rounded-2xl border border-white/10 bg-white/[0.012] overflow-hidden">
        <span className="absolute -left-32 top-1/2 -translate-y-1/2 w-72 h-40 rounded-full blur-[80px] opacity-[0.07] pointer-events-none" style={{ background: ACCENT }} />
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-white/8">
          {METRICS.map((m, i) => <Metric key={m.label} m={m} i={i} />)}
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
