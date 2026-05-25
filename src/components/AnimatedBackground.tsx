import React from 'react';

// Persistent sovereign atmosphere. Fixed behind the whole app so the hero's
// cinematic world continues down the page as one continuous environment —
// depth fields, faint topology, drifting haze, vignette and depth motes.
const AnimatedBackground: React.FC<{ intensity?: 'low' | 'high' }> = ({ intensity = 'high' }) => {
  const particles = intensity === 'high' ? 30 : 16;
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050816]">
      {/* layered depth fields — slow volumetric atmosphere */}
      <div className="absolute inset-0">
        <div className="absolute top-[-12%] -left-40 w-[760px] h-[760px] rounded-full bg-cyan-500/[0.07] blur-[140px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[680px] h-[680px] rounded-full bg-purple-600/[0.07] blur-[140px] animate-pulse-slow" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-[-8%] left-1/3 w-[620px] h-[620px] rounded-full bg-blue-600/[0.06] blur-[140px] animate-pulse-slow" style={{ animationDelay: '5s' }} />
      </div>

      {/* infrastructure grid — barely there, masked to centre */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,217,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 72%)',
        }} />

      {/* topology contour traces — soft data terrain spanning the page */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.32]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <g stroke="rgba(0,194,255,0.05)" strokeWidth="0.12" fill="none">
          <path d="M-2,18 C30,12 60,26 102,16" />
          <path d="M-2,38 C28,46 64,32 102,42" />
          <path d="M-2,58 C26,52 58,66 102,56" />
          <path d="M-2,78 C32,84 60,72 102,82" />
        </g>
        <g stroke="rgba(124,77,255,0.04)" strokeWidth="0.12" fill="none">
          <path d="M-2,28 C40,34 70,20 102,30" />
          <path d="M-2,68 C36,62 66,76 102,66" />
        </g>
      </svg>

      {/* drifting haze banks — slow cinematic fog */}
      <div className="absolute inset-x-0 top-[10%] h-[50%] animate-haze-a" style={{ background: 'radial-gradient(ellipse 55% 40% at 38% 50%, rgba(40,70,150,0.07), transparent 72%)', filter: 'blur(40px)' }} />
      <div className="absolute inset-x-0 bottom-[8%] h-[50%] animate-haze-b" style={{ background: 'radial-gradient(ellipse 60% 42% at 64% 55%, rgba(0,110,190,0.06), transparent 74%)', filter: 'blur(46px)' }} />

      {/* depth motes */}
      <div className="absolute inset-0">
        {Array.from({ length: particles }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-cyan-400/30 animate-float"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${i * 0.4}s`, animationDuration: `${9 + (i % 5)}s` }} />
        ))}
      </div>

      {/* persistent vignette — edges sink into deep space for cinematic darkness */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 92% 88% at 50% 40%, transparent 48%, rgba(3,5,14,0.6) 84%, rgba(2,3,10,0.92) 100%)' }} />

      {/* noise overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
    </div>
  );
};

export default AnimatedBackground;
