import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Deterministic starfield — sparse, dim, for deep-space depth.
const STARS = Array.from({ length: 54 }, (_, i) => {
  const r = (s: number) => ((Math.sin((i + 1) * s) * 43758.5453) % 1 + 1) % 1;
  return { x: r(12.9898) * 100, y: r(78.233) * 100, s: 0.5 + r(43.1) * 1.4, o: 0.12 + r(7.7) * 0.45, d: r(3.3) * 6, dur: 5 + r(9.1) * 6 };
});

// Sovereign orbital traces — arcs centred on the planet's mass (off the lower
// right) sweeping up into the editorial negative space, each with a relay.
const ORBITS = [
  { cx: 1210, cy: 820, rx: 1000, ry: 600, tilt: -16, c: '#00C2FF', dur: 26, dir: 1 },
  { cx: 1210, cy: 820, rx: 820, ry: 470, tilt: -32, c: '#7C4DFF', dur: 40, dir: -1 },
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
    <section ref={ref} onMouseMove={onMove} className="relative h-[88vh] min-h-[660px] max-h-[1100px] overflow-hidden"
      style={{ ['--px' as string]: '0', ['--py' as string]: '0' }}>
      {/* deep-space field, lit from the lower-right where the planet sits */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 90% at 78% 72%, #0c1d42 0%, #070f28 40%, #03060f 100%)' }} />
      {/* top vignette — keeps the navigation legible over the field */}
      <div className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(3,5,14,0.7), transparent)' }} />
      {/* layered atmospheric haze for depth */}
      <div className="absolute inset-0 animate-haze-a pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 45% at 72% 62%, rgba(0,150,255,0.1), transparent 70%)', filter: 'blur(50px)' }} />
      <div className="absolute inset-0 animate-haze-b pointer-events-none" style={{ background: 'radial-gradient(ellipse 44% 40% at 82% 80%, rgba(124,77,255,0.07), transparent 72%)', filter: 'blur(56px)' }} />

      {/* starfield */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <span key={i} className="absolute rounded-full bg-white animate-float" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o, animationDelay: `${s.d}s`, animationDuration: `${s.dur}s` }} />
        ))}
      </div>

      {/* sovereign orbital traces sweeping out of the planet into negative space */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs><filter id="hero-orb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" /></filter></defs>
        {ORBITS.map((o, i) => {
          const p = ellipsePath(o.cx, o.cy, o.rx, o.ry);
          return (
            <g key={i} transform={`rotate(${o.tilt} ${o.cx} ${o.cy})`}>
              <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill="none" stroke={o.c} strokeOpacity="0.22" strokeWidth="1.1" />
              <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill="none" stroke={o.c} strokeOpacity="0.05" strokeWidth="3" filter="url(#hero-orb)" />
              <circle r="2.6" fill={o.c} filter="url(#hero-orb)"><animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={p} keyPoints={o.dir > 0 ? '0;1' : '1;0'} keyTimes="0;1" /></circle>
              <circle r="1.5" fill="#eafcff"><animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={p} keyPoints={o.dir > 0 ? '0;1' : '1;0'} keyTimes="0;1" /></circle>
            </g>
          );
        })}
      </svg>

      {/* the planet — enormous, anchored to the lower-right, continuing past the edge */}
      <div aria-hidden className="absolute right-[-12%] sm:right-[-9%] lg:right-[-6%] bottom-[-28%] sm:bottom-[-30%] lg:bottom-[-32%] w-[112vw] sm:w-[92vw] lg:w-[82vw] max-w-[1440px] animate-breathe"
        style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -8px))', transformOrigin: '60% 55%' }}>
        <img src="/hero-globe.webp" alt="" decoding="async" className="w-full h-auto"
          style={{ filter: 'drop-shadow(-20px 0 120px rgba(0,130,255,0.2)) saturate(1.04) brightness(0.96)' }} />
      </div>
      {/* atmospheric limb glow hugging the planet edge */}
      <div className="absolute right-0 bottom-0 w-[60%] h-[80%] pointer-events-none animate-haze-a" style={{ background: 'radial-gradient(ellipse 60% 60% at 78% 64%, rgba(0,190,255,0.1), transparent 64%)' }} />
      {/* exposure restraint — keep the cyan bloom from blowing out */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 90% 90% at 74% 66%, transparent 52%, rgba(3,5,14,0.4) 90%)' }} />
      {/* left editorial scrim so the planet never competes with type */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(95deg, #050816 14%, rgba(5,8,22,0.82) 34%, rgba(5,8,22,0.35) 52%, transparent 70%)' }} />

      {/* ── editorial column, left ── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-xl lg:max-w-[46%]">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300/80 kicker mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> An institutional infrastructure company
          </div>
          <h1 className="font-display text-[3rem] sm:text-6xl lg:text-[4.4rem] xl:text-[5.25rem] font-bold tracking-cinematic leading-[0.96] text-balance mb-7">
            <span className="block text-white">The infrastructure</span>
            <span className="block text-white">your institution <span className="text-gradient-cyan">runs on.</span></span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-md mb-4 leading-relaxed">
            Sovereign builds and delivers institutional-grade infrastructure for governments, enterprises and institutions.
          </p>
          <p className="text-sm sm:text-base text-white/45 max-w-md mb-9 leading-relaxed">
            Deploy and operate the systems your organization depends on — finance, logistics, public services, intelligence and more. Our flagship infrastructures are examples of what you can launch through Sovereign, not the limit of it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-9">
            <Link to="/deploy" className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 14px 44px -12px rgba(0,194,255,0.5)' }}>
              Deploy Infrastructure <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/marketplace" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur text-white font-semibold ease-cinematic transition-all duration-500 hover:bg-white/8 hover:border-white/25 hover:-translate-y-0.5">
              Explore Infrastructures
            </Link>
          </div>
          <div className="hairline max-w-md mb-5" />
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 max-w-md">
            <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live network</span>
            {[['47', 'edge nodes'], ['23', 'sovereign regions'], ['99.99%', 'uptime']].map(([v, l]) => (
              <span key={l} className="flex flex-col leading-none">
                <span className="text-lg font-semibold text-white tabular-nums tracking-tight">{v}</span>
                <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35 mt-1.5">{l}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* fade into the deployment act */}
      <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #050816)' }} />
    </section>
  );
};

export default CinematicHero;
