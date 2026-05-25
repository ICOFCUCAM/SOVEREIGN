import React from 'react';
import { geoEquirectangular, geoPath, geoInterpolate } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-110m.json';
import type { FeatureCollection } from 'geojson';

// Real flat world map — landmasses + country borders — for operational
// region maps. Lazy-loaded by callers so d3-geo/topojson stay out of the
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
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface MapNode { lon: number; lat: number; hub?: boolean }

const project = (lon: number, lat: number): [number, number] => (projection([lon, lat]) as [number, number]) || [0, 0];

const WorldMap: React.FC<{ accent: string; nodes: MapNode[]; arcs: Array<[number, number, number]>; className?: string }> = ({ accent, nodes, arcs, className = '' }) => {
  const pts = nodes.map((n) => ({ ...n, p: project(n.lon, n.lat) }));
  const arcPath = (a: number, b: number) => {
    const interp = geoInterpolate([nodes[a].lon, nodes[a].lat], [nodes[b].lon, nodes[b].lat]);
    const samples = Array.from({ length: 28 }, (_, k) => project(...(interp(k / 27) as [number, number])));
    return 'M' + samples.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="xMidYMid meet">
      <path d={landPath} fill={`${accent}1c`} stroke="rgba(120,160,220,0.16)" strokeWidth="0.18" />
      <path d={bordersPath} fill="none" stroke="rgba(130,170,225,0.3)" strokeWidth="0.2" />
      {arcs.map(([a, b, d], i) => {
        const dd = arcPath(a, b);
        return (
          <g key={i}>
            <path d={dd} fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="0.5" />
            <path d={dd} fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${d}s` }} />
          </g>
        );
      })}
      {pts.map((n, i) => (
        <g key={i}>
          {n.hub && <circle cx={n.p[0]} cy={n.p[1]} r="4" fill="none" stroke={accent} strokeWidth="0.7" className="animate-ring" style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${i * 0.5}s` }} />}
          <circle cx={n.p[0]} cy={n.p[1]} r={n.hub ? 2.2 : 1.4} fill={n.hub ? accent : '#7C4DFF'} className={n.hub ? 'animate-node' : 'animate-flicker'} style={{ transformOrigin: `${n.p[0]}px ${n.p[1]}px`, animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
    </svg>
  );
};

export default WorldMap;
