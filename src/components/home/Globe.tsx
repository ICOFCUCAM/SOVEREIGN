import React, { useEffect, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-50m.json';
import type { FeatureCollection, LineString } from 'geojson';

const R = 188;
const CX = 200;
const CY = 200;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const land = feature(landTopo as any, (landTopo as any).objects.land) as unknown as FeatureCollection;
const graticule = geoGraticule10();

// Institutional hubs (lon/lat) that glow on the surface.
const HUBS: Array<[number, number]> = [
  [-74, 40.7], [-0.1, 51.5], [10.7, 59.9], [2.3, 48.9], [13.4, 52.5],
  [-79.4, 43.7], [55.3, 25.2], [103.8, 1.3], [37.6, 55.7], [-122, 37.8],
];

// Routes between hubs — densified into geodesics so they curve over the sphere.
const ROUTES: Array<[number, number]> = [[0, 1], [0, 5], [1, 2], [1, 4], [6, 1], [9, 0], [8, 6], [3, 2]];
const routeLines: LineString[] = ROUTES.map(([a, b]) => {
  const interp = geoInterpolate(HUBS[a], HUBS[b]);
  return { type: 'LineString', coordinates: Array.from({ length: 32 }, (_, k) => interp(k / 31)) };
});

const Globe: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [lambda, setLambda] = useState(20);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setLambda((l) => (l + 0.4) % 360), 50);
    return () => clearInterval(id);
  }, []);

  const projection = geoOrthographic().scale(R).translate([CX, CY]).rotate([lambda, -16, 0]).clipAngle(90);
  const path = geoPath(projection);
  const spherePath = path({ type: 'Sphere' }) || '';
  const gratPath = path(graticule) || '';
  const landPath = path(land) || '';
  const routePaths = routeLines.map((l) => path(l) || '');
  const hubPts = HUBS.map((c) => projection(c)).filter((p): p is [number, number] => !!p);

  return (
    <svg viewBox="0 0 400 400" className={className}>
      <defs>
        <radialGradient id="g-sphere" cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#12224d" />
          <stop offset="55%" stopColor="#081334" />
          <stop offset="100%" stopColor="#03050e" />
        </radialGradient>
        <radialGradient id="g-atmo" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="90%" stopColor="rgba(0,217,255,0.28)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="g-land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D9FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      <circle cx={CX} cy={CY} r={R + 14} fill="url(#g-atmo)" />
      <path d={spherePath} fill="url(#g-sphere)" stroke="rgba(0,217,255,0.3)" strokeWidth="1" />
      <path d={gratPath} fill="none" stroke="rgba(0,217,255,0.1)" strokeWidth="0.4" />
      <path d={landPath} fill="url(#g-land)" fillOpacity="0.34" stroke="rgba(0,217,255,0.55)" strokeWidth="0.4" strokeLinejoin="round" />

      {/* routes + traveling light */}
      {routePaths.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="url(#g-land)" strokeWidth="0.7" opacity="0.4" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${i * 0.5}s` }} />
        </g>
      ))}

      {/* hubs */}
      {hubPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i % 3 === 0 ? 2.4 : 1.6}
          fill={i % 3 === 0 ? '#00D9FF' : i % 3 === 1 ? '#10B981' : '#F59E0B'}
          className={i % 3 === 0 ? 'animate-node' : ''} style={{ transformOrigin: `${p[0]}px ${p[1]}px` }} />
      ))}

      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
    </svg>
  );
};

export default Globe;

