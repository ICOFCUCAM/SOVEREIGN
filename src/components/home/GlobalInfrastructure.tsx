import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

const GlobalInfrastructure: React.FC = () => (
  <section className="py-32 sm:py-44 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Global infrastructure</div>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98] mb-5">
          Planetary reach. Sovereign by design.
        </h2>
        <p className="text-lg text-white/55 leading-relaxed">
          A global edge mesh — institutions deploy across sovereign regions in seconds.
        </p>
      </div>

      {/* one dominant world visualization — minimal overlays */}
      <div className="relative" style={{ aspectRatio: '2 / 1' }}>
        <div className="absolute -inset-4 blur-[70px] opacity-[0.08] pointer-events-none" style={{ background: `radial-gradient(ellipse 55% 55% at 50% 50%, ${ACCENT}, transparent 72%)` }} />
        <Suspense fallback={<div className="w-full h-full" />}>
          <WorldMap accent={ACCENT} nodes={NODES} arcs={ARCS} className="w-full h-full" />
        </Suspense>
      </div>

      {/* deployment-class legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8">
        {[['Core', '#22E0FF'], ['Strategic', '#7C4DFF'], ['Treasury', '#10E5A0'], ['Emergency', '#FF5470'], ['Edge', '#5AA0FF']].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-white/45">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c as string, boxShadow: `0 0 6px ${c}` }} /> {l}
          </span>
        ))}
      </div>

      {/* minimal overlays */}
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 mt-6 text-sm font-mono text-white/45">
        <span><span className="text-white">47</span> edge nodes</span>
        <span><span className="text-white">23</span> regions</span>
        <span><span className="text-white">99.99%</span> sovereign uptime</span>
      </div>

      <div className="text-center mt-10">
        <Link to="/deploy" className="group inline-flex items-center gap-2 text-white font-semibold">
          Open the deployment engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-400" />
        </Link>
      </div>
    </div>
  </section>
);

export default GlobalInfrastructure;
