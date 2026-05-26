import React, { lazy, Suspense } from 'react';
import Cityscape from '@/components/home/Cityscape';

const Globe = lazy(() => import('@/components/home/Globe'));

// LAYER 1 — THE WORLD
// A cinematic sovereign-infrastructure environment plate. When a rendered
// plate image is supplied (VITE_HERO_PLATE — a public path or absolute URL),
// it becomes the world; the live globe + city are layered as the operating
// interface on top. With no plate the SVG world stands in as a full fallback,
// so the hero never breaks regardless of asset availability.
const PLATE = (import.meta.env.VITE_HERO_PLATE as string | undefined)?.trim() || '';

const HeroEnvironment: React.FC = () => {
  return (
    <div className="absolute inset-0">
      {/* deep atmosphere */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 68% 34%, rgba(10,20,52,0.95), transparent 60%), radial-gradient(circle at 72% 36%, rgba(0,194,255,0.13), transparent 52%), radial-gradient(circle at 60% 78%, rgba(124,77,255,0.12), transparent 55%)' }} />

      {PLATE ? (
        // Rendered cinematic plate — the world is the photoreal image; the
        // live globe + panels (Layer 2) sit over it in CinematicHero.
        <>
          <img
            src={PLATE}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'translate(calc(var(--px) * -8px), calc(var(--py) * -8px)) scale(1.04)' }}
          />
          {/* grade the plate into the app palette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 64% 38%, transparent 30%, rgba(5,8,22,0.35) 78%, rgba(5,8,22,0.7) 100%)' }} />
        </>
      ) : (
        // SVG world fallback — full environment composed from primitives.
        <>
          {/* ambient particles */}
          {Array.from({ length: 34 }).map((_, i) => (
            <div key={`pt${i}`} className="absolute w-0.5 h-0.5 rounded-full bg-cyan-300/40 animate-float"
              style={{ left: `${(i * 41) % 100}%`, top: `${(i * 67) % 96}%`, animationDelay: `${i * 0.35}s`, animationDuration: `${7 + (i % 6)}s` }} />
          ))}
          {/* embedded live globe — width-driven square so it never collapses or clips */}
          <div className="absolute z-[5] top-[10%] right-[-6%] sm:right-[-2%] lg:right-[3%] w-[82vw] sm:w-[58vw] lg:w-[44vw] max-w-[600px] aspect-square"
            style={{ transform: 'translate(calc(var(--px) * -10px), calc(var(--py) * -10px))' }}>
            <Suspense fallback={<div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.12), transparent 66%)' }} />}>
              <Globe className="w-full h-full" />
            </Suspense>
          </div>
          {/* full-bleed megacity floor */}
          <div className="absolute bottom-0 inset-x-0 h-[44%]" style={{ transform: 'translate(calc(var(--px) * 4px), 0)' }}>
            <Cityscape className="w-full h-full" />
          </div>
          {/* haze seam: city tops dissolve into atmosphere + globe */}
          <div className="absolute bottom-[34%] inset-x-0 h-[20%] pointer-events-none" style={{ background: 'linear-gradient(to top, #050816 12%, rgba(5,8,22,0.55) 50%, transparent)' }} />
          {/* glow bleed where globe meets city */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 60% 64%, rgba(0,194,255,0.12), transparent 38%)' }} />
        </>
      )}

      {/* ── ENVIRONMENTAL COHESION — globe, skyline & atmosphere influence each other ── */}
      {/* skyline glow spill rising off the city floor */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 100% at 56% 100%, rgba(0,194,255,0.1), transparent 64%)' }} />
      {/* cyan illumination cast by the globe into the surrounding atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 76% 32%, rgba(0,170,255,0.1), transparent 42%)' }} />
      {/* violet reflection tying the palette across the lower-left environment */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 34% 82%, rgba(124,77,255,0.08), transparent 52%)' }} />

      {/* depth particle layer — sparse, dim, slow: distant motes for spatial depth */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={`dp${i}`} className="absolute w-px h-px rounded-full bg-cyan-300/20 animate-float pointer-events-none"
          style={{ left: `${(i * 53) % 100}%`, top: `${(i * 29) % 92}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${12 + (i % 5) * 2}s` }} />
      ))}

      {/* ── LEFT-SIDE ENVIRONMENTAL PRESENCE — faint topology + distant signals, no content ── */}
      <svg className="absolute left-0 top-0 h-full w-[46%] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <g stroke="rgba(0,194,255,0.07)" strokeWidth="0.18" fill="none">
          <path d="M-2,26 C22,20 48,33 102,24" />
          <path d="M-2,44 C28,52 52,40 102,49" />
          <path d="M-2,63 C20,58 60,70 102,61" />
          <path d="M-2,80 C30,86 58,76 102,83" />
        </g>
      </svg>
      {/* distant environmental signals on the left */}
      {[[10, 30], [22, 58], [7, 72], [16, 44], [27, 84]].map(([l, t], i) => (
        <div key={`ls${i}`} className={`absolute w-0.5 h-0.5 rounded-full bg-cyan-300/50 pointer-events-none ${i % 2 ? 'animate-flicker' : 'animate-node'}`}
          style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${i * 0.9}s`, transformOrigin: 'center' }} />
      ))}
      {/* soft volumetric presence — subtle light in the left environment */}
      <div className="absolute left-0 top-[30%] w-[30%] h-[45%] pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 30% 50%, rgba(0,120,200,0.06), transparent 70%)' }} />

      {/* drifting cinematic haze banks — soft fog moving through the scene */}
      <div className="absolute inset-x-0 top-[18%] h-[55%] pointer-events-none animate-haze-a" style={{ background: 'radial-gradient(ellipse 60% 40% at 40% 50%, rgba(40,70,150,0.1), transparent 70%)', filter: 'blur(30px)' }} />
      <div className="absolute inset-x-0 bottom-[20%] h-[50%] pointer-events-none animate-haze-b" style={{ background: 'radial-gradient(ellipse 70% 45% at 62% 60%, rgba(0,120,200,0.09), transparent 72%)', filter: 'blur(36px)' }} />

      {/* the world bleeds behind the typography — a soft pool, not a hard wall */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 58% 70% at 22% 52%, rgba(5,8,22,0.9) 0%, rgba(5,8,22,0.6) 38%, transparent 68%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(100deg, #050816 0%, rgba(5,8,22,0.72) 22%, rgba(5,8,22,0.28) 44%, transparent 64%)' }} />

      {/* cinematic vignette — edges sink into darkness for depth + scale */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 90% 85% at 56% 46%, transparent 52%, rgba(3,5,14,0.55) 84%, rgba(2,3,10,0.9) 100%)' }} />
      {/* letterbox falloff top + bottom */}
      <div className="absolute inset-x-0 top-0 h-[22%] pointer-events-none" style={{ background: 'linear-gradient(to bottom, #050816, transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[26%] pointer-events-none" style={{ background: 'linear-gradient(to top, #050816 8%, transparent)' }} />
    </div>
  );
};

export default HeroEnvironment;
