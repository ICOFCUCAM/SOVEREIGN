import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Cloud, Server, ShieldCheck, ArrowRight, Globe2 } from 'lucide-react';
import type { MapNode } from '@/components/WorldMap';

const WorldMap = lazy(() => import('@/components/WorldMap'));

const ACCENT = '#00D9FF';
const VIOLET = '#7C4DFF';

// Edge nodes at real city coordinates [lon, lat].
const NODES: MapNode[] = [
  { lon: -74, lat: 40.7, hub: true },   // 0 New York
  { lon: -46.6, lat: -23.5 },           // 1 São Paulo
  { lon: -0.1, lat: 51.5, hub: true },  // 2 London
  { lon: 8.7, lat: 50.1 },              // 3 Frankfurt
  { lon: 3.4, lat: 6.5 },               // 4 Lagos
  { lon: 36.8, lat: -1.3 },             // 5 Nairobi
  { lon: 55.3, lat: 25.2, hub: true },  // 6 Dubai
  { lon: 72.8, lat: 19 },               // 7 Mumbai
  { lon: 103.8, lat: 1.3, hub: true },  // 8 Singapore
  { lon: 139.7, lat: 35.7, hub: true }, // 9 Tokyo
  { lon: 151.2, lat: -33.9 },           // 10 Sydney
  { lon: -118, lat: 34 },               // 11 Los Angeles
  { lon: 28, lat: -26.2 },              // 12 Johannesburg
];
const ARCS: Array<[number, number, number]> = [
  [0, 2, 0], [2, 6, 0.5], [6, 8, 1], [8, 9, 0.4], [0, 11, 1.2], [2, 3, 0.7],
  [6, 7, 0.3], [8, 10, 0.9], [2, 4, 1.4], [6, 12, 0.6], [0, 1, 1.1], [9, 8, 1.5],
];

const RegionMap: React.FC = () => (
  <div className="relative w-full rounded-2xl border border-white/10 overflow-hidden glass-strong" style={{ aspectRatio: '2 / 1' }}>
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,194,255,0.1), transparent 60%), linear-gradient(160deg, #0A1024, #05070F)' }} />
    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 border-b border-white/5 z-10">
      <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">Sovereign cloud · global mesh</span>
      <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> 23 regions online
      </span>
    </div>
    <div className="absolute inset-x-0 bottom-0 top-8">
      <Suspense fallback={<div className="w-full h-full" />}>
        <WorldMap accent={ACCENT} nodes={NODES} arcs={ARCS} className="w-full h-full" />
      </Suspense>
    </div>
  </div>
);

const FEED = [
  { sys: 'govmesh.ai', region: 'us-east', state: 'live' },
  { sys: 'mobilepay.io', region: 'eu-west', state: 'live' },
  { sys: 'flyttgo.com', region: 'ap-south', state: 'deploying' },
  { sys: 'elecpro.gov', region: 'af-north', state: 'live' },
  { sys: 'edupro.app', region: 'sa-east', state: 'live' },
];

const STATS = [
  { icon: Cloud, label: 'Edge nodes', value: '47' },
  { icon: Globe2, label: 'Regions', value: '23' },
  { icon: Rocket, label: 'Avg deploy', value: '87s' },
  { icon: ShieldCheck, label: 'Uptime', value: '99.99%' },
];

const GlobalInfrastructure: React.FC = () => {
  const [pct, setPct] = useState(42);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => (p >= 96 ? 28 : p + 6)), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-16">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Global infrastructure</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98] mb-5">
            Sovereign cloud. Planetary reach.
          </h2>
          <p className="text-lg text-white/55 leading-relaxed">
            Institutions provision across a global edge mesh — DNS orchestration, sovereign data residency and AI provisioning, deployed in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-stretch">
          <RegionMap />

          <div className="flex flex-col gap-5">
            {/* deployment stats */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="glass-strong rounded-xl border border-white/10 px-4 py-3.5">
                    <Icon className="w-4 h-4 text-cyan-400 mb-2" />
                    <div className="text-2xl font-bold text-white tabular-nums leading-none">{s.value}</div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1.5">{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* live deployment feed */}
            <div className="glass-strong rounded-xl border border-white/10 p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-white font-semibold text-sm"><Server className="w-4 h-4 text-cyan-400" /> Deployment feed</span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live</span>
              </div>
              <div className="space-y-2">
                {FEED.map((f) => (
                  <div key={f.sys} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-white/70 flex-1 truncate">{f.sys}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/35">{f.region}</span>
                    {f.state === 'live' ? (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-300 w-16 text-right">Live</span>
                    ) : (
                      <span className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                        <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${VIOLET}, ${ACCENT})` }} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Link to="/deploy" className="group inline-flex items-center gap-2 text-white font-semibold">
              Open the deployment engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-400" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalInfrastructure;
