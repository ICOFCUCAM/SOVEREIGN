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
  core: { r: 2.1, rings: 2, glow: 5, dur: 4.2, color: '#22E0FF', zone: 9, burst: true },
  strategic: { r: 1.7, rings: 2, glow: 4, dur: 4.8, color: '#7C4DFF', zone: 7, burst: true },
  treasury: { r: 1.4, rings: 1, glow: 2.8, dur: 5.2, color: '#10E5A0', zone: 0, burst: false },
  emergency: { r: 1.5, rings: 1, glow: 3, dur: 3.4, color: '#FF5470', zone: 0, burst: true },
  edge: { r: 1, rings: 0, glow: 1.8, dur: 5.6, color: '#5AA0FF', zone: 0, burst: false },
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
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 52% 30%, #081632 0%, #050b1c 48%, #02040c 100%)' }} />
      {/* high-atmosphere rim */}
      <div className="absolute inset-x-0 top-0 h-1/3 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 100% at 50% -25%, rgba(0,175,255,0.07), transparent 70%)' }} />
      {/* atmospheric depth — restrained drifting haze */}
      <div className="absolute inset-0 animate-haze-a pointer-events-none" style={{ background: 'radial-gradient(ellipse 38% 50% at 50% 30%, rgba(0,160,255,0.06), transparent 68%)', filter: 'blur(20px)' }} />
      <div className="absolute inset-0 animate-haze-b pointer-events-none" style={{ background: 'radial-gradient(ellipse 42% 46% at 72% 56%, rgba(124,77,255,0.05), transparent 70%)', filter: 'blur(22px)' }} />
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
          <filter id="wm-glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="0.9" /></filter>
          <filter id="wm-bloom" x="-160%" y="-160%" width="420%" height="420%"><feGaussianBlur stdDeviation="1.6" /></filter>
          <filter id="wm-zone" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="3" /></filter>
          <linearGradient id="wm-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.1" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.03" />
          </linearGradient>
          <radialGradient id="wm-reactor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor={accent} stopOpacity="0.5" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* coordinate graticule — faint infrastructural grid */}
        <path d={gratPath} fill="none" stroke="rgba(120,160,220,0.05)" strokeWidth="0.12" />
        {/* land + borders — sharp, tactical coastlines */}
        <path d={landPath} fill="url(#wm-land)" stroke="rgba(150,195,255,0.42)" strokeWidth="0.22" />
        <path d={bordersPath} fill="none" stroke="rgba(140,180,235,0.16)" strokeWidth="0.13" />

        {/* operational influence zones — tight sovereign coverage, core/strategic only */}
        {pts.map((n, i) => n.c.zone ? (
          <circle key={`z${i}`} cx={n.p[0]} cy={n.p[1]} r={n.c.zone} fill={n.c.color} opacity="0.05" filter="url(#wm-zone)" />
        ) : null)}

        {/* sovereign signal propagation — the path stays dark; a luminous packet
            travels it, a blurred wake trailing the bright head. Timing and
            intensity vary so it reads as staggered synchronization, not routes. */}
        {arcs.map(([a, b, d], i) => {
          const dd = arcPath(a, b);
          const pc = pts[a]?.c.color || accent;
          const dur = 1.9 + (i % 5) * 0.45;
          return (
            <g key={`a${i}`}>
              {/* implied corridor — barely-there atmospheric trace */}
              <path d={dd} fill="none" stroke={pc} strokeOpacity="0.035" strokeWidth="0.16" />
              {/* segmented intelligence stream — dim packets flowing continuously */}
              <path d={dd} pathLength={100} fill="none" stroke={pc} strokeWidth="0.4" strokeLinecap="round"
                strokeDasharray="0.9 7" opacity="0.22"
                className="animate-signal" style={{ animationDelay: `${d}s`, animationDuration: `${dur * 2.2}s` }} />
              {/* travelling wake — concentrated glow that fades immediately behind the head */}
              <path d={dd} pathLength={100} fill="none" stroke={pc} strokeWidth="0.9" strokeLinecap="round"
                strokeDasharray="6 94" opacity="0.6" filter="url(#wm-glow)"
                className="animate-signal" style={{ animationDelay: `${d + 0.1}s`, animationDuration: `${dur}s` }} />
              {/* travelling head — crisp luminous packet */}
              <path d={dd} pathLength={100} fill="none" stroke="#eafcff" strokeWidth="0.5" strokeLinecap="round"
                strokeDasharray="1.6 98.4" filter="url(#wm-glow)"
                className="animate-signal" style={{ animationDelay: `${d}s`, animationDuration: `${dur}s` }} />
            </g>
          );
        })}

        {/* orbital signal layer — faint planetary orbital traces with relays */}
        {[{ rx: 95, ry: 27, tilt: -13, c: accent, dur: 28 }, { rx: 82, ry: 41, tilt: 19, c: '#7C4DFF', dur: 36 }].map((o, i) => {
          const ep = `M ${100 + o.rx} 50 A ${o.rx} ${o.ry} 0 1 1 ${100 - o.rx} 50 A ${o.rx} ${o.ry} 0 1 1 ${100 + o.rx} 50`;
          return (
            <g key={`orb${i}`} transform={`rotate(${o.tilt} 100 50)`}>
              <ellipse cx="100" cy="50" rx={o.rx} ry={o.ry} fill="none" stroke={o.c} strokeOpacity="0.1" strokeWidth="0.16" />
              <circle r="0.7" fill={o.c} filter="url(#wm-glow)"><animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={ep} /></circle>
            </g>
          );
        })}

        {/* sovereign infrastructure reactors */}
        {pts.map((n, i) => {
          const phase = burstPhase(n.p[0]);
          return (
            <g key={`n${i}`} style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px` }}>
              {/* tight breathing halo — concentrated, not a fog mass */}
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.glow} fill="url(#wm-reactor)" opacity="0.55" filter="url(#wm-glow)"
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

              {/* reactor core — energy fill, defined housing ring, white-hot center */}
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.r} fill={n.c.color} className="animate-reactor"
                style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${(i % 6) * 0.3}s`, animationDuration: `${n.c.dur}s` }} />
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.r + 0.7} fill="none" stroke={n.c.color} strokeWidth="0.2" opacity="0.7" />
              <circle cx={n.p[0]} cy={n.p[1]} r={n.c.r * 0.4} fill="#ffffff" opacity="0.95" />
            </g>
          );
        })}
      </svg>

      {/* cinematic edge darkness — regions fade into atmosphere and shadow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 88% 100% at 50% 50%, transparent 46%, rgba(3,5,14,0.55) 86%, rgba(2,3,10,0.9) 100%)' }} />
      {/* near-field haze drift — faint foreground light spill */}
      <div className="absolute inset-0 animate-haze-a pointer-events-none mix-blend-screen" style={{ background: 'radial-gradient(ellipse 24% 18% at 38% 64%, rgba(0,190,255,0.03), transparent 70%)', filter: 'blur(12px)' }} />
      {/* atmospheric grain */}
      <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
    </div>
  );
};

export default WorldMap;
