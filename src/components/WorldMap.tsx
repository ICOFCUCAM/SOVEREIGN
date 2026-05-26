import React from 'react';
import { geoEquirectangular, geoPath, geoInterpolate, geoGraticule10 } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-110m.json';
import type { FeatureCollection } from 'geojson';

// Real flat planetary map rendered as a cinematic sovereign-infrastructure
// deployment theater. Lazy-loaded by callers so d3-geo/topojson stay out of
// the main bundle.
const W = 200;
const H = 100;
/* eslint-disable @typescript-eslint/no-explicit-any */
const topo = countriesTopo as any;
const countries = feature(topo, topo.objects.countries) as unknown as FeatureCollection;
const borders = mesh(topo, topo.objects.countries, (a: any, b: any) => a !== b);
const projection = geoEquirectangular().fitSize([W, H], { type: 'Sphere' } as any);
const path = geoPath(projection as any);
const landPath = path(countries as any) || '';
const bordersPath = path(borders as any) || '';
const gratPath = path(geoGraticule10() as any) || '';
/* eslint-enable @typescript-eslint/no-explicit-any */

export type NodeClass = 'core' | 'strategic' | 'treasury' | 'emergency' | 'edge';
export interface MapNode { lon: number; lat: number; hub?: boolean; cls?: NodeClass }

const CLASS: Record<NodeClass, { r: number; rings: number; glow: number; dur: number; color: string; zone: number }> = {
  core: { r: 3, rings: 3, glow: 13, dur: 3.2, color: '#22E0FF', zone: 26 },
  strategic: { r: 2.4, rings: 2, glow: 10, dur: 2.6, color: '#7C4DFF', zone: 20 },
  treasury: { r: 2, rings: 1, glow: 7, dur: 3.6, color: '#10E5A0', zone: 0 },
  emergency: { r: 2, rings: 2, glow: 8, dur: 1.9, color: '#FF5470', zone: 0 },
  edge: { r: 1.4, rings: 0, glow: 4, dur: 4.4, color: '#5AA0FF', zone: 0 },
};
const clsFor = (n: MapNode, i: number): NodeClass => n.cls || (n.hub ? (i % 2 ? 'strategic' : 'core') : (['treasury', 'emergency', 'edge', 'edge'] as NodeClass[])[i % 4]);

const project = (lon: number, lat: number): [number, number] => (projection([lon, lat]) as [number, number]) || [0, 0];

const WorldMap: React.FC<{ accent: string; nodes: MapNode[]; arcs: Array<[number, number, number]>; className?: string }> = ({ accent, nodes, arcs, className = '' }) => {
  const pts = nodes.map((n, i) => ({ ...n, p: project(n.lon, n.lat), c: CLASS[clsFor(n, i)] }));
  const arcPath = (a: number, b: number) => {
    const interp = geoInterpolate([nodes[a].lon, nodes[a].lat], [nodes[b].lon, nodes[b].lat]);
    const samples = Array.from({ length: 30 }, (_, k) => project(...(interp(k / 29) as [number, number])));
    return 'M' + samples.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  };

  return (
    <div className={`relative ${className}`} style={{ maskImage: 'radial-gradient(ellipse 82% 96% at 50% 48%, #000 58%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 82% 96% at 50% 48%, #000 58%, transparent 100%)' }}>
      {/* planetary base — deep oceans + regional tonal variation */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 52% 30%, #0a1b3a 0%, #060e22 45%, #03060f 100%)' }} />
      {/* atmospheric depth — drifting haze */}
      <div className="absolute inset-0 animate-haze-a pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 55% at 50% 28%, rgba(0,160,255,0.12), transparent 70%)', filter: 'blur(24px)' }} />
      <div className="absolute inset-0 animate-haze-b pointer-events-none" style={{ background: 'radial-gradient(ellipse 45% 50% at 72% 55%, rgba(124,77,255,0.1), transparent 72%)', filter: 'blur(28px)' }} />
      {/* directional environmental lighting — soft illumination upper-left, shadow lower-right */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(130deg, rgba(130,185,255,0.07) 0%, transparent 42%, rgba(2,4,12,0.35) 100%)' }} />
      {/* operational scan sweep */}
      <div className="absolute inset-y-0 w-1/3 animate-sweep pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.05), transparent)' }} />

      <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="wm-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.4" /></filter>
          <filter id="wm-zone" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="6" /></filter>
          <linearGradient id="wm-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* coordinate graticule — infrastructural grid */}
        <path d={gratPath} fill="none" stroke="rgba(120,160,220,0.07)" strokeWidth="0.15" />
        {/* land + borders */}
        <path d={landPath} fill="url(#wm-land)" stroke="rgba(120,170,230,0.22)" strokeWidth="0.18" />
        <path d={bordersPath} fill="none" stroke="rgba(130,170,225,0.14)" strokeWidth="0.15" />

        {/* operational influence zones (sovereign cloud coverage) — core/strategic only */}
        {pts.map((n, i) => n.c.zone ? (
          <circle key={`z${i}`} cx={n.p[0]} cy={n.p[1]} r={n.c.zone} fill={n.c.color} opacity="0.06" filter="url(#wm-zone)" />
        ) : null)}

        {/* propagation corridors */}
        {arcs.map(([a, b, d], i) => {
          const dd = arcPath(a, b);
          return (
            <g key={`a${i}`}>
              <path d={dd} fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="0.4" />
              <path d={dd} fill="none" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${d}s` }} />
              <path d={dd} fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${d + 1.3}s`, animationDuration: '3s' }} />
            </g>
          );
        })}

        {/* multi-class sovereign infrastructure hubs */}
        {pts.map((n, i) => (
          <g key={`n${i}`} style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px` }}>
            {n.c.rings >= 2 && <circle cx={n.p[0]} cy={n.p[1]} r={n.c.glow * 1.7} fill={n.c.color} opacity="0.07" filter="url(#wm-zone)" />}
            <circle cx={n.p[0]} cy={n.p[1]} r={n.c.glow} fill={n.c.color} opacity="0.16" filter="url(#wm-glow)" />
            {Array.from({ length: n.c.rings }).map((_, k) => (
              <circle key={k} cx={n.p[0]} cy={n.p[1]} r={n.c.r + 2.5 + k * 2.6} fill="none" stroke={n.c.color} strokeWidth="0.4"
                strokeOpacity={0.4 - k * 0.1} className="animate-ring" style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${(i % 5) * 0.5 + k * 0.4}s`, animationDuration: `${n.c.dur}s` }} />
            ))}
            <circle cx={n.p[0]} cy={n.p[1]} r={n.c.r} fill={n.c.color} className="animate-node" style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${(i % 6) * 0.3}s`, animationDuration: `${n.c.dur}s` }} />
            <circle cx={n.p[0]} cy={n.p[1]} r={n.c.r * 0.45} fill="#ffffff" opacity="0.85" />
          </g>
        ))}
      </svg>

      {/* cinematic edge darkness / partial concealment */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 90% 100% at 50% 50%, transparent 50%, rgba(3,5,14,0.5) 88%, rgba(2,3,10,0.85) 100%)' }} />
    </div>
  );
};

export default WorldMap;
