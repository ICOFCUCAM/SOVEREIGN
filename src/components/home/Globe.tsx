import React, { useEffect, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-50m.json';
import type { FeatureCollection, LineString } from 'geojson';

const R = 152;
const CX = 200;
const CY = 200;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const land = feature(landTopo as any, (landTopo as any).objects.land) as unknown as FeatureCollection;
const graticule = geoGraticule10();

// Global infrastructure hubs (lon/lat).
const HUBS: Array<[number, number]> = [
  [-74, 40.7], [-118, 34], [-79.4, 43.7], [-99, 19.4], [-74, 4.7], [-46.6, -23.5], [-58, -34.6],
  [-0.1, 51.5], [2.3, 48.9], [13.4, 52.5], [10.7, 59.9], [-3.7, 40.4],
  [3.4, 6.5], [31.2, 30], [36.8, -1.3], [28, -26.2], [55.3, 25.2],
  [72.8, 19], [103.8, 1.3], [114, 22.3], [139.7, 35.7], [151.2, -33.9],
];
const ROUTES = [[0, 7], [0, 1], [7, 8], [7, 10], [16, 7], [1, 20], [18, 16], [7, 13], [5, 4], [21, 18], [16, 17], [0, 2], [13, 12], [19, 18]];
const routeLines: LineString[] = ROUTES.map(([a, b]) => {
  const interp = geoInterpolate(HUBS[a], HUBS[b]);
  return { type: 'LineString', coordinates: Array.from({ length: 36 }, (_, k) => interp(k / 35)) };
});

const ORBITS = [
  { tilt: 18, rx: 192, ry: 66, c: '#00C2FF', dur: 16 },
  { tilt: -26, rx: 178, ry: 50, c: '#7C4DFF', dur: 22 },
  { tilt: 70, rx: 196, ry: 40, c: '#10B981', dur: 19 },
];
const ellipsePath = (rx: number, ry: number) => `M ${CX + rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX - rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX + rx} ${CY}`;

const Globe: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [lambda, setLambda] = useState(20);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Slow, majestic rotation, smoothed at ~30fps for a premium glide.
    const id = setInterval(() => setLambda((l) => (l + 0.16) % 360), 33);
    return () => clearInterval(id);
  }, []);

  const projection = geoOrthographic().scale(R).translate([CX, CY]).rotate([lambda, -16, 0]).clipAngle(90);
  const path = geoPath(projection);
  const center: [number, number] = [-lambda, 16];
  const visible = (c: [number, number]) => geoDistance(center, c) < Math.PI / 2 - 0.04;

  const spherePath = path({ type: 'Sphere' }) || '';
  const gratPath = path(graticule) || '';
  const landPath = path(land) || '';
  const routePaths = routeLines.map((l) => path(l) || '');
  const hubPts = HUBS.filter(visible).map((c) => ({ p: projection(c) as [number, number] }));

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="g-sphere" cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#14275a" /><stop offset="55%" stopColor="#081334" /><stop offset="100%" stopColor="#03050e" />
        </radialGradient>
        <radialGradient id="g-bloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,194,255,0.18)" /><stop offset="55%" stopColor="rgba(0,194,255,0.06)" /><stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* wide cinematic scatter — light bleeding into the surrounding atmosphere */}
        <radialGradient id="g-scatter" cx="50%" cy="50%" r="50%">
          <stop offset="40%" stopColor="rgba(0,150,255,0.12)" /><stop offset="72%" stopColor="rgba(0,120,255,0.05)" /><stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="g-atmo" cx="50%" cy="50%" r="50%">
          <stop offset="69%" stopColor="transparent" /><stop offset="86%" stopColor="rgba(0,194,255,0.28)" /><stop offset="94%" stopColor="rgba(0,194,255,0.1)" /><stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* terminator: day-side light falls off into the shadowed limb */}
        <radialGradient id="g-shade" cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="transparent" /><stop offset="62%" stopColor="transparent" /><stop offset="100%" stopColor="rgba(2,4,12,0.78)" />
        </radialGradient>
        <linearGradient id="g-land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00C2FF" /><stop offset="100%" stopColor="#7C4DFF" />
        </linearGradient>
        {/* atmospheric diffusion so the globe is embedded, not pasted on top */}
        <filter id="f-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1" /></filter>
        <filter id="f-bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="f-ray" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.4" /></filter>
        <filter id="f-haze" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      {/* outer scatter + bloom — soft light spill into atmosphere */}
      <circle cx={CX} cy={CY} r={R + 46} fill="url(#g-scatter)" filter="url(#f-haze)" />
      <circle cx={CX} cy={CY} r="198" fill="url(#g-bloom)" />

      {/* orbital intelligence rings */}
      {ORBITS.map((o, i) => (
        <g key={`o${i}`} transform={`rotate(${o.tilt} ${CX} ${CY})`}>
          <ellipse cx={CX} cy={CY} rx={o.rx} ry={o.ry} fill="none" stroke={o.c} strokeOpacity="0.18" strokeWidth="0.9" />
          <circle r="2.6" fill={o.c}>
            <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={ellipsePath(o.rx, o.ry)} />
          </circle>
          <circle r="1.6" fill="#ffffff">
            <animateMotion dur={`${o.dur}s`} begin={`${o.dur / 2}s`} repeatCount="indefinite" path={ellipsePath(o.rx, o.ry)} />
          </circle>
        </g>
      ))}

      {/* atmosphere rim — soft, diffuse, blurred into the surrounding dark (edge only) */}
      <circle cx={CX} cy={CY} r={R + 12} fill="url(#g-atmo)" filter="url(#f-soft)" />
      {/* sphere body — crisp technical limb */}
      <path d={spherePath} fill="url(#g-sphere)" stroke="rgba(0,217,255,0.28)" strokeWidth="0.8" />

      {/* SHARP surface — infrastructural, tactical, precise (no global blur) */}
      <path d={gratPath} fill="none" stroke="rgba(0,217,255,0.1)" strokeWidth="0.35" />
      <path d={landPath} fill="url(#g-land)" fillOpacity="0.34" stroke="rgba(0,217,255,0.6)" strokeWidth="0.4" strokeLinejoin="round" />

      {/* sovereign routing — corridors stay dim; a slow, eased luminous packet
          travels each route, a soft wake fading behind a crisp head */}
      {routePaths.map((d, i) => {
        const dur = 5 + (i % 5) * 0.7;
        const delay = (i % 7) * 0.6;
        return (
          <g key={`r${i}`}>
            <path d={d} fill="none" stroke="url(#g-land)" strokeWidth="0.5" opacity="0.28" strokeLinecap="round" />
            <path d={d} pathLength={100} fill="none" stroke="#00C2FF" strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray="9 91" opacity="0.55" filter="url(#f-ray)"
              className="animate-signal" style={{ animationDuration: `${dur}s`, animationDelay: `${delay + 0.12}s` }} />
            <path d={d} pathLength={100} fill="none" stroke="#eafcff" strokeWidth="0.9" strokeLinecap="round"
              strokeDasharray="2.5 97.5" filter="url(#f-ray)"
              className="animate-signal" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }} />
          </g>
        );
      })}

      {/* controlled node bloom underlay */}
      <g filter="url(#f-bloom)" opacity="0.5">
        {hubPts.map((h, i) => (
          <circle key={`hb${i}`} cx={h.p[0]} cy={h.p[1]} r={i % 4 === 0 ? 4 : 2.4}
            fill={i % 4 === 0 ? '#00C2FF' : i % 4 === 1 ? '#7C4DFF' : i % 4 === 2 ? '#10B981' : '#F59E0B'} />
        ))}
      </g>
      {/* crisp infrastructure nodes */}
      {hubPts.map((h, i) => (
        <circle key={`h${i}`} cx={h.p[0]} cy={h.p[1]} r={i % 4 === 0 ? 3 : 1.8}
          fill={i % 4 === 0 ? '#00C2FF' : i % 4 === 1 ? '#7C4DFF' : i % 4 === 2 ? '#10B981' : '#F59E0B'}
          className={i % 4 === 0 ? 'animate-node' : i % 3 === 0 ? 'animate-flicker' : ''}
          style={{ transformOrigin: `${h.p[0]}px ${h.p[1]}px`, animationDelay: `${(i % 7) * 0.5}s` }} />
      ))}
      {/* restrained telemetry — data pings expanding from major hubs */}
      {hubPts.map((h, i) => i % 4 === 0 ? (
        <circle key={`pg${i}`} cx={h.p[0]} cy={h.p[1]} r="3" fill="none" stroke="#00C2FF" strokeWidth="0.7"
          className="animate-ring" style={{ transformOrigin: `${h.p[0]}px ${h.p[1]}px`, animationDelay: `${(i % 5) * 0.8}s` }} />
      ) : null)}

      {/* terminator shadow — far hemisphere only; center stays lit + sharp */}
      <path d={spherePath} fill="url(#g-shade)" pointerEvents="none" />
    </svg>
  );
};

export default Globe;
