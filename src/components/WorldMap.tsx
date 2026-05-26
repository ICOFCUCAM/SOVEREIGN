import React from 'react';
import { geoEquirectangular, geoPath, geoInterpolate, geoGraticule10 } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-110m.json';
import type { FeatureCollection } from 'geojson';

// A living sovereign planetary intelligence fabric. The connection paths stay
// almost entirely dark — only travelling luminous packets reveal their local
// section, fading behind themselves. Reactor nodes breathe and emit
// synchronization bursts. Lazy-loaded so d3-geo/topojson stay out of the
// main bundle.
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

const CLASS: Record<NodeClass, { r: number; rings: number; glow: number; dur: number; color: string; zone: number; burst: boolean }> = {
  core: { r: 2.6, rings: 2, glow: 13, dur: 4.2, color: '#22E0FF', zone: 26, burst: true },
  strategic: { r: 2.1, rings: 2, glow: 10, dur: 4.8, color: '#7C4DFF', zone: 20, burst: true },
  treasury: { r: 1.8, rings: 1, glow: 7, dur: 5.2, color: '#10E5A0', zone: 0, burst: false },
  emergency: { r: 1.9, rings: 1, glow: 8, dur: 3.4, color: '#FF5470', zone: 0, burst: true },
  edge: { r: 1.2, rings: 0, glow: 4, dur: 5.6, color: '#5AA0FF', zone: 0, burst: false },
};
const clsFor = (n: MapNode, i: number): NodeClass => n.cls || (n.hub ? (i % 2 ? 'strategic' : 'core') : (['treasury', 'emergency', 'edge', 'edge'] as NodeClass[])[i % 4]);

const project = (lon: number, lat: number): [number, number] => (projection([lon, lat]) as [number, number]) || [0, 0];

// deterministic depth motes — distant atmospheric particles drifting
const MOTES = Array.from({ length: 34 }, (_, i) => {
  const r = (s: number) => ((Math.sin((i + 1) * s) * 43758.5453) % 1 + 1) % 1;
  return {
    x: r(12.9898) * 100, y: r(78.233) * 100,
    s: 0.6 + r(43.12) * 1.8, dur: 16 + r(7.1) * 22, delay: -r(3.3) * 28,
    dx: (r(91.3) - 0.5) * 26, dy: -8 - r(5.7) * 26, max: 0.12 + r(2.4) * 0.4,
    near: r(33.7) > 0.7,
  };
});

const WorldMap: React.FC<{ accent: string; nodes: MapNode[]; arcs: Array<[number, number, number]>; className?: string }> = ({ accent, nodes, arcs, className = '' }) => {
  const pts = nodes.map((n, i) => ({ ...n, p: project(n.lon, n.lat), c: CLASS[clsFor(n, i)] }));
  const arcPath = (a: number, b: number) => {
    const interp = geoInterpolate([nodes[a].lon, nodes[a].lat], [nodes[b].lon, nodes[b].lat]);
    const samples = Array.from({ length: 40 }, (_, k) => project(...(interp(k / 39) as [number, number])));
    return 'M' + samples.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  };
  // stagger bursts by longitude so synchronization sweeps west→east like a wave
  const burstPhase = (x: number) => (x / W) * 5.4;

  return (
    <div className={`relative ${className}`} style={{ maskImage: 'radial-gradient(ellipse 82% 96% at 50% 48%, #000 56%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 82% 96% at 50% 48%, #000 56%, transparent 100%)' }}>
      {/* planetary base — deep oceans + regional tonal variation */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 52% 30%, #0a1b3a 0%, #060e22 45%, #03060f 100%)' }} />
      {/* high-atmosphere rim */}
      <div className="absolute inset-x-0 top-0 h-1/3 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 100% at 50% -25%, rgba(0,175,255,0.1), transparent 70%)' }} />
      {/* atmospheric depth — drifting volumetric haze */}
      <div className="absolute inset-0 animate-haze-a pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 55% at 50% 28%, rgba(0,160,255,0.13), transparent 70%)', filter: 'blur(26px)' }} />
      <div className="absolute inset-0 animate-haze-b pointer-events-none" style={{ background: 'radial-gradient(ellipse 45% 50% at 72% 55%, rgba(124,77,255,0.11), transparent 72%)', filter: 'blur(30px)' }} />
      {/* directional environmental lighting — soft illumination upper-left, shadow lower-right */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(130deg, rgba(130,185,255,0.07) 0%, transparent 42%, rgba(2,4,12,0.4) 100%)' }} />

      {/* distant depth particles — far atmospheric layer drifting behind the map */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ filter: 'blur(0.4px)' }}>
        {MOTES.map((m, i) => (
          <span key={i} className="absolute rounded-full animate-mote" style={{
            left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s,
            background: m.near ? 'rgba(150,205,255,0.9)' : 'rgba(110,160,220,0.7)',
            filter: m.near ? 'none' : 'blur(0.8px)',
            ['--pdx' as string]: `${m.dx}px`, ['--pdy' as string]: `${m.dy}px`, ['--pmax' as string]: `${m.max}`,
            animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s`,
          } as React.CSSProperties} />
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <filter id="wm-glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="1.6" /></filter>
          <filter id="wm-bloom" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3.4" /></filter>
          <filter id="wm-zone" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="6" /></filter>
          <linearGradient id="wm-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id="wm-reactor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor={accent} stopOpacity="0.5" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* coordinate graticule — faint infrastructural grid */}
        <path d={gratPath} fill="none" stroke="rgba(120,160,220,0.06)" strokeWidth="0.13" />
        {/* land + borders */}
        <path d={landPath} fill="url(#wm-land)" stroke="rgba(120,170,230,0.2)" strokeWidth="0.17" />
        <path d={bordersPath} fill="none" stroke="rgba(130,170,225,0.12)" strokeWidth="0.14" />

        {/* operational influence zones (sovereign cloud coverage) — core/strategic only */}
        {pts.map((n, i) => n.c.zone ? (
          <circle key={`z${i}`} cx={n.p[0]} cy={n.p[1]} r={n.c.zone} fill={n.c.color} opacity="0.05" filter="url(#wm-zone)" />
        ) : null)}

        {/* sovereign signal propagation — the path stays dark; a luminous packet
            travels it, a blurred wake trailing the bright head. Timing and
            intensity vary so it reads as staggered synchronization, not routes. */}
        {arcs.map(([a, b, d], i) => {
          const dd = arcPath(a, b);
          const pc = pts[a]?.c.color || accent;
          const dur = 2.8 + (i % 5) * 0.65;
          return (
            <g key={`a${i}`}>
              {/* implied corridor — barely-there atmospheric trace */}
              <path d={dd} fill="none" stroke={pc} strokeOpacity="0.045" strokeWidth="0.22" />
              {/* travelling wake — soft volumetric glow that fades behind the head */}
              <path d={dd} pathLength={100} fill="none" stroke={pc} strokeWidth="1.5" strokeLinecap="round"
                strokeDasharray="13 87" opacity="0.7" filter="url(#wm-bloom)"
                className="animate-signal" style={{ animationDelay: `${d + 0.16}s`, animationDuration: `${dur}s` }} />
              {/* travelling head — crisp luminous packet */}
              <path d={dd} pathLength={100} fill="none" stroke="#eafcff" strokeWidth="0.6" strokeLinecap="round"
                strokeDasharray="3 97" filter="url(#wm-glow)"
                className="animate-signal" style={{ animationDelay: `${d}s`, animationDuration: `${dur}s` }} />
            </g>
          );
        })}

        {/* sovereign infrastructure reactors */}
        {pts.map((n, i) => {
          const phase = burstPhase(n.p[0]);
          return (
            <g key={`n${i}`} style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px` }}>
              {/* layered breathing halo */}
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.glow * 1.6} fill={n.c.color} opacity="0.06" filter="url(#wm-zone)"
                className="animate-reactor" style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${(i % 6) * 0.4}s`, animationDuration: `${n.c.dur}s` }} />
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.glow} fill="url(#wm-reactor)" opacity="0.5" filter="url(#wm-glow)"
                className="animate-reactor" style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${(i % 6) * 0.4}s`, animationDuration: `${n.c.dur}s` }} />

              {/* synchronization bursts — staggered by longitude into a planetary wave */}
              {n.c.burst && Array.from({ length: 2 }).map((_, k) => (
                <circle key={`b${k}`} cx={n.p[0]} cy={n.p[1]} r={n.c.r + 1.5} fill="none" stroke={n.c.color} strokeWidth="0.45"
                  className="animate-burst" style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${phase + k * 3}s`, animationDuration: '6s' }} />
              ))}

              {/* steady resonance rings */}
              {Array.from({ length: n.c.rings }).map((_, k) => (
                <circle key={`r${k}`} cx={n.p[0]} cy={n.p[1]} r={n.c.r + 2.2 + k * 2.4} fill="none" stroke={n.c.color} strokeWidth="0.35"
                  strokeOpacity={0.38 - k * 0.12} className="animate-ring" style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${(i % 5) * 0.5 + k * 0.4}s`, animationDuration: `${n.c.dur * 0.7}s` }} />
              ))}

              {/* reactor core + white-hot center */}
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.r} fill={n.c.color} className="animate-reactor"
                style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${(i % 6) * 0.3}s`, animationDuration: `${n.c.dur}s` }} />
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.r * 0.42} fill="#ffffff" opacity="0.92" />
            </g>
          );
        })}
      </svg>

      {/* cinematic edge darkness — regions fade into atmosphere and shadow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 88% 100% at 50% 50%, transparent 46%, rgba(3,5,14,0.55) 86%, rgba(2,3,10,0.9) 100%)' }} />
      {/* near-field haze drift — foreground fog catching the light */}
      <div className="absolute inset-0 animate-haze-a pointer-events-none mix-blend-screen" style={{ background: 'radial-gradient(ellipse 30% 22% at 38% 64%, rgba(0,190,255,0.05), transparent 70%)', filter: 'blur(18px)' }} />
      {/* atmospheric grain */}
      <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
    </div>
  );
};

export default WorldMap;
