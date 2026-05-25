import React from 'react';

const VB_W = 1000;
const VB_H = 340;
const WARM = ['#FFB257', '#FF8A4C'];
const COOL = ['#00C2FF', '#7C4DFF', '#10B981'];

// Deterministic RNG so the skyline is stable across renders.
function makeRng(seed: number) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

interface Tower { x: number; w: number; h: number; setback: number; antenna: boolean; }

function buildRow(count: number, seed: number, minH: number, maxH: number, maxW: number): Tower[] {
  const rng = makeRng(seed);
  const towers: Tower[] = [];
  let x = -10;
  for (let i = 0; i < count; i++) {
    const w = 12 + rng() * (maxW - 12);
    const h = minH + rng() * (maxH - minH);
    towers.push({ x, w, h, setback: rng() > 0.6 ? 0.55 + rng() * 0.25 : 0, antenna: rng() > 0.72 });
    x += w + 2 + rng() * 10;
    if (x > VB_W + 20) break;
  }
  return towers;
}

const farRow = buildRow(70, 7, 30, 90, 22);
const midRow = buildRow(46, 23, 60, 150, 34);
const nearRow = buildRow(30, 51, 110, 250, 52);

const Layer: React.FC<{ towers: Tower[]; fill: string; stroke: string; windows: boolean; density: number; opacity: number; seed: number }> = ({ towers, fill, stroke, windows, density, opacity, seed }) => {
  const rng = makeRng(seed);
  return (
    <g opacity={opacity}>
      {towers.map((t, i) => {
        const top = VB_H - t.h;
        const sbW = t.setback ? t.w * t.setback : 0;
        const sbX = t.x + (t.w - sbW) / 2;
        const sbTop = top - (t.setback ? 18 + rng() * 26 : 0);
        const neon = COOL[i % COOL.length];
        return (
          <g key={i}>
            {t.antenna && <line x1={t.x + t.w / 2} y1={top - 30} x2={t.x + t.w / 2} y2={top} stroke={neon} strokeWidth="0.8" opacity="0.55" />}
            {t.antenna && <circle cx={t.x + t.w / 2} cy={top - 30} r="1.4" fill={neon} />}
            {t.setback > 0 && <rect x={sbX} y={sbTop} width={sbW} height={top - sbTop + 2} fill={fill} stroke={stroke} strokeWidth="0.3" strokeOpacity="0.6" />}
            <rect x={t.x} y={top} width={t.w} height={t.h} fill={fill} stroke={stroke} strokeWidth="0.3" strokeOpacity="0.6" />
            {/* roof glow only on some towers — breaks the uniform outline */}
            {rng() > 0.45 && <line x1={t.x} y1={top} x2={t.x + t.w} y2={top} stroke={neon} strokeWidth="0.9" opacity={0.25 + rng() * 0.4} />}
            {windows && Array.from({ length: Math.floor(t.h / 9) }).map((_, r) =>
              Array.from({ length: Math.max(1, Math.floor(t.w / 7)) }).map((__, c) => {
                if (rng() > density) return null;
                const bright = rng() > 0.82;
                const warm = rng() > 0.78;
                return <rect key={`${r}-${c}`} x={t.x + 2.5 + c * 7} y={top + 5 + r * 9} width="2.6" height="3.4"
                  fill={warm ? WARM[i % 2] : neon} opacity={bright ? 0.85 : 0.2} />;
              }),
            )}
          </g>
        );
      })}
    </g>
  );
};

const Cityscape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMax slice" className={className}>
    <defs>
      <radialGradient id="city-horizon" cx="50%" cy="100%" r="85%">
        <stop offset="0%" stopColor="rgba(0,194,255,0.26)" /><stop offset="55%" stopColor="rgba(124,77,255,0.07)" /><stop offset="100%" stopColor="transparent" />
      </radialGradient>
      {/* depth fog — distant structure dissolves upward into atmosphere */}
      <linearGradient id="city-fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#050816" /><stop offset="60%" stopColor="rgba(5,8,22,0.5)" /><stop offset="100%" stopColor="transparent" />
      </linearGradient>
      <linearGradient id="city-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#050b1c" /><stop offset="100%" stopColor="transparent" />
      </linearGradient>
      {/* edge darkness — the skyline vanishes into shadow at the flanks */}
      <linearGradient id="city-edge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#050816" /><stop offset="14%" stopColor="rgba(5,8,22,0.2)" /><stop offset="50%" stopColor="transparent" />
        <stop offset="86%" stopColor="rgba(5,8,22,0.2)" /><stop offset="100%" stopColor="#050816" />
      </linearGradient>
      <filter id="city-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.4" /></filter>
      <filter id="city-blur-soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.9" /></filter>
    </defs>

    <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#city-horizon)" />

    {/* distant haze layer — blurred so it reads as far-off structure lost in atmosphere */}
    <g filter="url(#city-blur)">
      <Layer towers={farRow} fill="#0a1330" stroke="rgba(60,110,200,0.12)" windows={false} density={0} opacity={0.32} seed={101} />
    </g>
    {/* fog bank rolling over the distant skyline */}
    <rect x="0" y={VB_H - 250} width={VB_W} height="150" fill="url(#city-fog)" opacity="0.7" />
    {/* mid layer — slightly softened */}
    <g filter="url(#city-blur-soft)">
      <Layer towers={midRow} fill="#0a162f" stroke="rgba(0,194,255,0.12)" windows density={0.22} opacity={0.62} seed={202} />
    </g>
    {/* near layer — crisp foreground */}
    <Layer towers={nearRow} fill="#060b1c" stroke="rgba(0,217,255,0.2)" windows density={0.4} opacity={1} seed={303} />

    {/* atmospheric concealment: fog drift + flank darkness */}
    <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#city-fog)" opacity="0.18" />
    <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#city-edge)" />
    <rect x="0" y={VB_H - 3} width={VB_W} height="3" fill="rgba(0,194,255,0.4)" opacity="0.45" />
  </svg>
);

export default Cityscape;
