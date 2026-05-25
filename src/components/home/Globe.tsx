import React from 'react';

const R = 150;
const CX = 200;
const CY = 200;

interface P { x: number; y: number; op: number; z: number }

// Orthographic dot lattice across the visible hemisphere → a "dotted Earth" globe.
const lattice: P[] = [];
for (let lat = -82; lat <= 82; lat += 10) {
  const rad = (lat * Math.PI) / 180;
  const c = Math.cos(rad);
  const steps = Math.max(6, Math.round(26 * c));
  for (let s = 0; s < steps; s++) {
    const lon = (s / steps) * Math.PI * 2 - Math.PI;
    const x3 = c * Math.sin(lon);
    const z3 = c * Math.cos(lon);
    const y3 = Math.sin(rad);
    if (z3 < 0.06) continue; // front hemisphere only
    lattice.push({ x: CX + R * 0.97 * x3, y: CY - R * 0.97 * y3, op: 0.1 + z3 * 0.5, z: z3 });
  }
}

// Bright hubs (subset) used as arc endpoints + glowing nodes.
const hubs: P[] = [];
const stride = Math.max(1, Math.floor(lattice.length / 10));
for (let i = 2; i < lattice.length && hubs.length < 10; i += stride) hubs.push(lattice[i]);

const PAIRS = [[0, 5], [1, 7], [2, 8], [3, 9], [6, 1], [7, 4], [0, 8]];
const arcs = PAIRS.filter(([a, b]) => hubs[a] && hubs[b]).map(([a, b]) => {
  const p1 = hubs[a];
  const p2 = hubs[b];
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = mx - CX;
  const dy = my - CY;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (dx / len) * 42;
  const cy = my + (dy / len) * 42;
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
});

const Globe: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 400 400" className={className}>
    <defs>
      <radialGradient id="sphere" cx="36%" cy="32%" r="78%">
        <stop offset="0%" stopColor="#10204a" />
        <stop offset="55%" stopColor="#08102a" />
        <stop offset="100%" stopColor="#04060f" />
      </radialGradient>
      <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
        <stop offset="72%" stopColor="transparent" />
        <stop offset="91%" stopColor="rgba(0,217,255,0.26)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <linearGradient id="garc" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00D9FF" /><stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>

    <circle cx={CX} cy={CY} r={R + 18} fill="url(#atmo)" />
    <circle cx={CX} cy={CY} r={R} fill="url(#sphere)" stroke="rgba(0,217,255,0.28)" strokeWidth="1" />

    <clipPath id="globeClip"><circle cx={CX} cy={CY} r={R} /></clipPath>
    <g clipPath="url(#globeClip)">
      {/* faint meridian/parallel guides for sphericity */}
      <g stroke="rgba(0,217,255,0.08)" strokeWidth="0.6" fill="none">
        {[-110, -55, 0, 55, 110].map((k, i) => <ellipse key={`p${i}`} cx={CX} cy={CY + k} rx={Math.sqrt(Math.max(0, R * R - k * k))} ry={Math.sqrt(Math.max(0, R * R - k * k)) * 0.16} />)}
        {[150, 104, 50].map((rx, i) => <ellipse key={`m${i}`} cx={CX} cy={CY} rx={rx} ry={R} />)}
      </g>

      {/* dot-matrix surface */}
      {lattice.map((d, i) => (
        <circle key={`l${i}`} cx={d.x} cy={d.y} r={0.9} fill="#00D9FF" opacity={d.op} />
      ))}

      {/* routes */}
      {arcs.map((d, i) => (
        <path key={`a${i}`} d={d} fill="none" stroke="url(#garc)" strokeWidth="1.1" strokeDasharray="3 5" className="animate-dash" opacity="0.75" />
      ))}
      {/* live data pulses */}
      {arcs.map((d, i) => (
        <circle key={`pulse${i}`} r={i % 2 ? 1.7 : 2.1} fill={i % 2 ? '#00D9FF' : '#ffffff'}>
          <animateMotion dur={`${3.4 + (i % 4) * 0.9}s`} begin={`${i * 0.6}s`} repeatCount="indefinite" path={d} />
          <animate attributeName="opacity" values="0;1;1;0" dur={`${3.4 + (i % 4) * 0.9}s`} begin={`${i * 0.6}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* glowing hubs */}
      {hubs.map((h, i) => (
        <circle key={`h${i}`} cx={h.x} cy={h.y} r={2.4} fill={i % 3 === 0 ? '#00D9FF' : i % 3 === 1 ? '#7C3AED' : '#10B981'}
          className="animate-node" style={{ animationDelay: `${(i % 5) * 0.4}s`, transformOrigin: `${h.x}px ${h.y}px` }} />
      ))}
    </g>

    <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
  </svg>
);

export default Globe;
