import React from 'react';

interface Props {
  score: number;
  label?: string;
  size?: number;
  gradient?: [string, string];
}

const ValuationRing: React.FC<Props> = ({ score, label, size = 120, gradient = ['#00D9FF', '#7C3AED'] }) => {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const gid = `g-${gradient[0].replace('#','')}-${gradient[1].replace('#','')}`;

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-3 rounded-full blur-2xl opacity-25" style={{ background: `radial-gradient(circle, ${gradient[0]}, transparent 70%)` }} />
        <svg className="-rotate-90 relative" width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="6"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" filter={`url(#${gid}-glow)`}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
            <filter id={`${gid}-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-white tabular-nums" style={{ textShadow: `0 0 24px ${gradient[0]}55` }}>{score}</div>
          <div className="text-[9px] uppercase tracking-widest text-white/40 font-mono">/100</div>
        </div>
      </div>
      {label && <div className="mt-2 text-xs text-white/60 font-medium tracking-wide">{label}</div>}
    </div>
  );
};

export default ValuationRing;
