import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Deterministic starfield — sparse, dim, for deep-space depth.
const STARS = Array.from({ length: 60 }, (_, i) => {
  const r = (s: number) => ((Math.sin((i + 1) * s) * 43758.5453) % 1 + 1) % 1;
  return { x: r(12.9898) * 100, y: r(78.233) * 62, s: 0.5 + r(43.1) * 1.4, o: 0.15 + r(7.7) * 0.5, d: r(3.3) * 6, dur: 5 + r(9.1) * 6 };
});

// Sovereign orbital traces — large arcs centred on the planet (below the fold)
// sweeping across the upper sky, each carrying a single relay.
const ORBITS = [
  { cx: 720, cy: 1010, rx: 980, ry: 660, tilt: -11, c: '#00C2FF', dur: 30, dir: 1 },
  { cx: 720, cy: 960, rx: 800, ry: 540, tilt: 9, c: '#7C4DFF', dur: 42, dir: -1 },
];
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy}`;

const CinematicHero: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (ev: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  return (
    <section ref={ref} onMouseMove={onMove} className="relative h-[94vh] min-h-[720px] overflow-hidden"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* deep-space field */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 95% 75% at 50% 8%, #0b1a3c 0%, #070f26 42%, #03060f 100%)' }} />
      {/* layered atmospheric haze for depth */}
      <div className="absolute inset-0 animate-haze-a pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 42% at 48% 26%, rgba(0,150,255,0.09), transparent 70%)', filter: 'blur(46px)' }} />
      <div className="absolute inset-0 animate-haze-b pointer-events-none" style={{ background: 'radial-gradient(ellipse 52% 40% at 62% 52%, rgba(124,77,255,0.07), transparent 72%)', filter: 'blur(54px)' }} />

      {/* starfield */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <span key={i} className="absolute rounded-full bg-white animate-float" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o, animationDelay: `${s.d}s`, animationDuration: `${s.dur}s` }} />
        ))}
      </div>

      {/* sovereign orbital traces */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <defs>
          <filter id="hero-orb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" /></filter>
        </defs>
        {ORBITS.map((o, i) => {
          const p = ellipsePath(o.cx, o.cy, o.rx, o.ry);
          return (
            <g key={i} transform={`rotate(${o.tilt} ${o.cx} ${o.cy})`}>
              <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill="none" stroke={o.c} strokeOpacity="0.2" strokeWidth="1" />
              <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill="none" stroke={o.c} strokeOpacity="0.05" strokeWidth="3" filter="url(#hero-orb)" />
              <circle r="3" fill={o.c} filter="url(#hero-orb)">
                <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={p} keyPoints={o.dir > 0 ? '0;1' : '1;0'} keyTimes="0;1" />
              </circle>
              <circle r="1.6" fill="#eafcff">
                <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={p} keyPoints={o.dir > 0 ? '0;1' : '1;0'} keyTimes="0;1" />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* planetary horizon — the Earth curving up from below, slowly alive */}
      <div aria-hidden className="absolute left-1/2 bottom-[-74%] sm:bottom-[-78%] lg:bottom-[-84%] w-[156%] sm:w-[120%] lg:w-[104%] max-w-[1700px] aspect-square animate-earth">
        <img src="/hero-globe.webp" alt="" decoding="async" className="w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 -12px 110px rgba(0,140,255,0.22)) saturate(1.05)' }} />
      </div>
      {/* atmospheric limb glow along the horizon */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none animate-haze-a" style={{ background: 'radial-gradient(ellipse 72% 62% at 50% 110%, rgba(0,200,255,0.14), rgba(0,150,255,0.04) 46%, transparent 66%)' }} />
      {/* exposure control — gentle vignette so the planet bloom never blows out */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 64%, transparent 40%, rgba(3,5,14,0.45) 88%, rgba(2,3,10,0.75) 100%)' }} />
      {/* top readability scrim */}
      <div className="absolute inset-x-0 top-0 h-[62%] pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(3,6,16,0.72) 8%, rgba(3,6,16,0.25) 48%, transparent)' }} />
      {/* focused scrim behind the editorial block so copy never fights the network */}
      <div className="absolute inset-x-0 top-0 h-[72%] pointer-events-none" style={{ background: 'radial-gradient(ellipse 58% 66% at 50% 26%, rgba(3,6,16,0.82), rgba(3,6,16,0.4) 52%, transparent 74%)' }} />

      {/* ── editorial content, centred above the horizon ── */}
      <div className="relative z-10 h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center pt-[13vh] sm:pt-[14vh]">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300/80 text-[10px] font-mono uppercase tracking-[0.3em] mb-8 backdrop-blur-sm"
          style={{ transform: 'translate(calc(var(--px) * 6px), calc(var(--py) * 4px))' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> The operating layer for digital civilization
        </div>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.2rem] font-bold tracking-tighter leading-[0.94] mb-8"
          style={{ transform: 'translate(calc(var(--px) * 10px), calc(var(--py) * 6px))' }}>
          <span className="block text-white">The operating system</span>
          <span className="block text-gradient-cyan">for civilization.</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed mb-10">
          Deploy AI-native institutions and sovereign infrastructure — at planetary scale.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/ecosystem" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 44px rgba(0,194,255,0.3)' }}>
            Launch Ecosystem <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur text-white font-semibold hover:bg-white/8 transition-all">
            Explore Marketplace
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-9 text-[11px] font-mono text-white/45">
          <span className="inline-flex items-center gap-1.5 text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live network</span>
          <span>47 <span className="text-white/30">edge nodes</span></span>
          <span>23 <span className="text-white/30">sovereign regions</span></span>
          <span>99.99% <span className="text-white/30">uptime</span></span>
        </div>
      </div>

      {/* fade into the deployment act */}
      <div className="absolute bottom-0 inset-x-0 h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #050816)' }} />
    </section>
  );
};

export default CinematicHero;
