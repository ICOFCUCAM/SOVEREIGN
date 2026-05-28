const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

function EarthVisual() {
  return (
    <svg viewBox="0 0 700 700" className="absolute right-[-10%] top-1/2 h-[140%] w-auto -translate-y-1/2" aria-hidden>
      <defs>
        {/* Earth body — deep night side */}
        <radialGradient id="globe-body" cx="38%" cy="44%" r="62%">
          <stop offset="0%" stopColor="#181821" />
          <stop offset="55%" stopColor="#0c0c12" />
          <stop offset="100%" stopColor="#050507" />
        </radialGradient>
        {/* Sun-rise horizon — warm gold */}
        <radialGradient id="horizon" cx="92%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#f6d59a" stopOpacity="0.9" />
          <stop offset="20%" stopColor="#d4a86a" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#8a5e2a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#08080d" stopOpacity="0" />
        </radialGradient>
        {/* Soft glow extending beyond the rim */}
        <radialGradient id="atmos" cx="78%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#d4a86a" stopOpacity="0.0" />
          <stop offset="80%" stopColor="#d4a86a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#d4a86a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* outer atmosphere */}
      <circle cx="350" cy="350" r="340" fill="url(#atmos)" />
      {/* planet body */}
      <circle cx="350" cy="350" r="290" fill="url(#globe-body)" />
      {/* horizon highlight */}
      <circle cx="350" cy="350" r="290" fill="url(#horizon)" />
      {/* city lights — scatter of warm dots */}
      <g fill="#f4d49b" opacity="0.65">
        <circle cx="245" cy="370" r="0.9" />
        <circle cx="260" cy="395" r="0.8" />
        <circle cx="285" cy="410" r="1" />
        <circle cx="310" cy="425" r="0.9" />
        <circle cx="330" cy="440" r="1.1" />
        <circle cx="360" cy="430" r="0.9" />
        <circle cx="385" cy="410" r="1" />
        <circle cx="220" cy="340" r="0.8" />
        <circle cx="200" cy="305" r="0.8" />
        <circle cx="240" cy="290" r="0.9" />
        <circle cx="275" cy="275" r="1" />
        <circle cx="310" cy="265" r="0.9" />
        <circle cx="345" cy="285" r="0.8" />
        <circle cx="380" cy="305" r="0.9" />
      </g>
      {/* orbital arcs */}
      <g fill="none" stroke="#d4a86a" strokeLinecap="round">
        <ellipse cx="350" cy="350" rx="340" ry="335" strokeWidth="0.6" strokeDasharray="1 7" opacity="0.5" />
        <ellipse cx="350" cy="350" rx="370" ry="355" strokeWidth="0.6" strokeDasharray="1 9" opacity="0.35" transform="rotate(-12 350 350)" />
        <ellipse cx="350" cy="350" rx="400" ry="378" strokeWidth="0.5" strokeDasharray="1 12" opacity="0.22" transform="rotate(8 350 350)" />
      </g>
      {/* the sun — a tiny glowing point at the horizon */}
      <circle cx="610" cy="305" r="6" fill="#f6d59a" />
      <circle cx="610" cy="305" r="18" fill="#f6d59a" opacity="0.35" />
      <circle cx="610" cy="305" r="40" fill="#d4a86a" opacity="0.15" />
    </svg>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-6 pt-20 sm:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
          {/* Left: text */}
          <div className="relative z-10 max-w-xl py-10">
            <div className="animate-rise flex items-center gap-3 text-[10px] tracking-[0.32em] text-emrg-dim">
              <span className="h-px w-8 bg-emrg-dim/70" />
              CINEMATIC INTELLIGENCE INFRASTRUCTURE
            </div>
            <h1 className="animate-rise mt-9 font-serif text-[64px] font-medium leading-[0.95] tracking-tight text-emrg-ink sm:text-[88px]">
              Own the
              <br />
              <span className="wordmark-cream font-semibold italic">narrative.</span>
            </h1>
            <p className="animate-rise mt-7 max-w-md text-base leading-relaxed text-emrg-mute sm:text-lg">
              Cinematic media, intelligent distribution, and strategic communications — unified in one sovereign platform.
            </p>
            <div className="animate-rise mt-9 flex flex-wrap items-center gap-5">
              <a
                href="#pricing"
                className="inline-flex items-center gap-3 rounded-md bg-emrg-gold px-6 py-3 text-sm font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream"
                style={{ boxShadow: '0 14px 40px -12px rgba(212,168,106,0.55)' }}
              >
                Explore the Platform
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href={`${PORTAL}/docs`} className="inline-flex items-center gap-2 text-sm text-emrg-ink transition hover:text-emrg-cream">
                View Documentation
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div className="animate-rise mt-16 flex items-center gap-3 text-[10px] tracking-[0.32em] text-emrg-mute">
              <span className="inline-block h-1.5 w-1.5 animate-pulseline rounded-full border border-emrg-dim" />
              BUILT FOR INSTITUTIONS. DESIGNED FOR IMPACT.
            </div>
          </div>

          {/* Right: cinematic earth */}
          <div className="relative h-[520px] lg:h-[640px]">
            <EarthVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
