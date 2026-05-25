import React from 'react';

// Deterministic sovereign skyline — "deployed civilization infrastructure" at the globe's base.
const BUILDINGS = Array.from({ length: 30 }, (_, i) => {
  const w = 12 + ((i * 13) % 16);
  const h = 26 + ((i * 41) % 96);
  return { x: i * 20.4, w, h };
});

const Cityscape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 600 170" preserveAspectRatio="xMidYMax meet" className={className}>
    <defs>
      <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a1430" />
        <stop offset="100%" stopColor="#04060f" />
      </linearGradient>
      <radialGradient id="horizon" cx="50%" cy="100%" r="70%">
        <stop offset="0%" stopColor="rgba(0,194,255,0.22)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    <rect x="0" y="40" width="600" height="130" fill="url(#horizon)" />
    {BUILDINGS.map((b, i) => {
      const top = 170 - b.h;
      const neon = i % 4 === 0 ? '#00C2FF' : i % 4 === 1 ? '#7C4DFF' : i % 4 === 2 ? '#10B981' : '#F59E0B';
      return (
        <g key={i}>
          <rect x={b.x} y={top} width={b.w - 3} height={b.h} fill="url(#bld)" stroke="rgba(0,217,255,0.12)" strokeWidth="0.5" />
          <line x1={b.x} y1={top} x2={b.x + b.w - 3} y2={top} stroke={neon} strokeWidth="1" opacity="0.7" />
          {Array.from({ length: Math.min(5, Math.floor(b.h / 18)) }).map((_, r) => (
            <rect key={r} x={b.x + 2} y={top + 6 + r * 13} width={b.w - 7} height="2" fill={neon} opacity={(i + r) % 3 === 0 ? 0.5 : 0.18} />
          ))}
        </g>
      );
    })}
  </svg>
);

export default Cityscape;
