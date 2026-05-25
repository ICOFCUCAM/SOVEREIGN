import React from 'react';

const R = 150;
const CX = 200;
const CY = 200;

// Surface nodes (phyllotaxis spread across the disc → reads as points on a sphere).
const DOTS = Array.from({ length: 18 }, (_, i) => {
  const a = i * 2.39996;
  const r = 26 + (i % 6) * 20;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a), big: i % 4 === 0 };
});

// Great-circle-style arcs between nodes (bowed away from the core).
const PAIRS = [[0, 7], [2, 11], [4, 14], [1, 13], [8, 16], [3, 10], [5, 15]];
const arcs = PAIRS.map(([a, b]) => {
  const p1 = DOTS[a];
  const p2 = DOTS[b];
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = mx - CX;
  const dy = my - CY;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (dx / len) * 46;
  const cy = my + (dy / len) * 46;
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
});

const parallels = [-120, -80, -40, 0, 40, 80, 120].map((k) => ({ cy: CY + k, rx: Math.sqrt(R * R - k * k), ry: Math.sqrt(R * R - k * k) * 0.17 }));
const meridians = [150, 128, 100, 66, 30].map((rx) => rx);

const Globe: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 400 400" className={className}>
    <defs>
      <radialGradient id="sphere" cx="38%" cy="34%" r="75%">
        <stop offset="0%" stopColor="#0e1a3a" />
        <stop offset="55%" stopColor="#070d22" />
        <stop offset="100%" stopColor="#04060f" />
      </radialGradient>
      <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
        <stop offset="74%" stopColor="transparent" />
        <stop offset="92%" stopColor="rgba(0,217,255,0.22)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <linearGradient id="garc" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00D9FF" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>

    {/* atmosphere */}
    <circle cx={CX} cy={CY} r={R + 16} fill="url(#atmo)" />
    {/* sphere */}
    <circle cx={CX} cy={CY} r={R} fill="url(#sphere)" stroke="rgba(0,217,255,0.25)" strokeWidth="1" />

    {/* graticule */}
    <g stroke="rgba(0,217,255,0.16)" strokeWidth="0.7" fill="none">
      {parallels.map((p, i) => <ellipse key={`p${i}`} cx={CX} cy={p.cy} rx={p.rx} ry={p.ry} />)}
      {meridians.map((rx, i) => <ellipse key={`m${i}`} cx={CX} cy={CY} rx={rx} ry={R} />)}
      <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} />
    </g>

    {/* clip arcs + dots to the sphere */}
    <clipPath id="globeClip"><circle cx={CX} cy={CY} r={R} /></clipPath>
    <g clipPath="url(#globeClip)">
      {arcs.map((d, i) => (
        <path key={`a${i}`} d={d} fill="none" stroke="url(#garc)" strokeWidth="1.1"
          strokeDasharray="3 5" className="animate-dash" opacity="0.7" />
      ))}
      {DOTS.map((dt, i) => (
        <circle key={`d${i}`} cx={dt.x} cy={dt.y} r={dt.big ? 2.4 : 1.4}
          fill={i % 3 === 0 ? '#00D9FF' : i % 3 === 1 ? '#7C3AED' : '#10B981'}
          className={dt.big ? 'animate-node' : ''} style={dt.big ? { animationDelay: `${(i % 5) * 0.4}s`, transformOrigin: `${dt.x}px ${dt.y}px` } : undefined} />
      ))}
    </g>

    {/* specular limb */}
    <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
  </svg>
);

export default Globe;
