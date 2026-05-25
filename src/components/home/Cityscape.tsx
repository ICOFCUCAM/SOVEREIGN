import React from 'react';

const NEON = ['#00C2FF', '#7C4DFF', '#10B981', '#F59E0B'];
const H = 260;

// Two depth layers of towers for a dense sovereign skyline.
const backRow = Array.from({ length: 60 }, (_, i) => ({ x: i * 15.2, w: 9 + ((i * 11) % 12), h: 30 + ((i * 53) % 80) }));
const frontRow = Array.from({ length: 46 }, (_, i) => ({ x: i * 19.8, w: 13 + ((i * 17) % 18), h: 60 + ((i * 67) % 150), spire: i % 7 === 0 }));

const Cityscape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 900 260" preserveAspectRatio="xMidYMax slice" className={className}>
    <defs>
      <linearGradient id="bld-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a1430" /><stop offset="100%" stopColor="#050a1c" />
      </linearGradient>
      <linearGradient id="bld-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0e1c42" /><stop offset="100%" stopColor="#04060f" />
      </linearGradient>
      <radialGradient id="horizon" cx="50%" cy="100%" r="80%">
        <stop offset="0%" stopColor="rgba(0,194,255,0.28)" /><stop offset="60%" stopColor="rgba(124,77,255,0.1)" /><stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>

    <rect x="0" y="20" width="900" height="240" fill="url(#horizon)" />

    {/* back layer (dim) */}
    <g opacity="0.6">
      {backRow.map((b, i) => {
        const top = H - b.h;
        return <rect key={i} x={b.x} y={top} width={b.w} height={b.h} fill="url(#bld-back)" stroke="rgba(0,194,255,0.1)" strokeWidth="0.4" />;
      })}
    </g>

    {/* front layer (bright, windowed) */}
    {frontRow.map((b, i) => {
      const top = H - b.h;
      const neon = NEON[i % 4];
      return (
        <g key={i}>
          {b.spire && <line x1={b.x + b.w / 2} y1={top - 22} x2={b.x + b.w / 2} y2={top} stroke={neon} strokeWidth="1" opacity="0.7" />}
          {b.spire && <circle cx={b.x + b.w / 2} cy={top - 22} r="1.6" fill={neon} />}
          <rect x={b.x} y={top} width={b.w - 3} height={b.h} fill="url(#bld-front)" stroke="rgba(0,217,255,0.16)" strokeWidth="0.5" />
          <line x1={b.x} y1={top} x2={b.x + b.w - 3} y2={top} stroke={neon} strokeWidth="1.2" opacity="0.8" />
          {/* window grid */}
          {Array.from({ length: Math.floor(b.h / 11) }).map((_, r) =>
            Array.from({ length: Math.max(1, Math.floor((b.w - 6) / 5)) }).map((__, cIdx) => (
              <rect key={`${r}-${cIdx}`} x={b.x + 2 + cIdx * 5} y={top + 5 + r * 11} width="2.4" height="3"
                fill={neon} opacity={(i + r + cIdx) % 4 === 0 ? 0.6 : 0.12} />
            )),
          )}
        </g>
      );
    })}

    {/* ground reflection sheen */}
    <rect x="0" y={H - 4} width="900" height="4" fill="rgba(0,194,255,0.4)" opacity="0.5" />
  </svg>
);

export default Cityscape;
