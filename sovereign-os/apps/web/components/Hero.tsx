import Link from 'next/link';

// Cinematic Earth backdrop — opacity reduced from prior pass so the planet
// reads as atmosphere rather than centre-piece. The left column is the
// editorial column; the right column reserves space for the planet.
function EarthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        aria-hidden
        className="absolute right-[-12%] top-1/2 h-[160%] w-[80%] -translate-y-1/2"
        style={{
          backgroundImage: 'url(/emergency-earth.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 60% 50%, #000 35%, rgba(0,0,0,0.85) 55%, transparent 90%)',
          maskImage: 'radial-gradient(ellipse 70% 60% at 60% 50%, #000 35%, rgba(0,0,0,0.85) 55%, transparent 90%)',
          opacity: 0.7,
        }}
      />
      <div
        aria-hidden
        className="absolute right-[-6%] top-[28%] h-[60%] w-[55%]"
        style={{
          background: 'radial-gradient(ellipse 50% 45% at 80% 35%, rgba(246,213,154,0.14), rgba(212,168,106,0.05) 45%, transparent 75%)',
          filter: 'blur(8px)',
        }}
      />
      <svg viewBox="0 0 800 800" className="absolute right-[-8%] top-1/2 h-[140%] w-auto -translate-y-1/2" aria-hidden>
        <g fill="none" stroke="#d4a86a" strokeLinecap="round">
          <ellipse cx="400" cy="400" rx="360" ry="350" strokeWidth="0.5" strokeDasharray="1 9" opacity="0.24" />
          <ellipse cx="400" cy="400" rx="395" ry="378" strokeWidth="0.5" strokeDasharray="1 11" opacity="0.16" transform="rotate(-14 400 400)" />
        </g>
      </svg>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(95deg, #08080d 18%, rgba(8,8,13,0.88) 38%, rgba(8,8,13,0.42) 56%, transparent 75%)' }}
      />
    </div>
  );
}

const OUTCOMES = [
  { verb: 'Own', object: 'the narrative.' },
  { verb: 'Coordinate', object: 'distribution.' },
  { verb: 'Operate', object: 'intelligence.' },
];

// Three institutional signals — keeps operational credibility without
// the SaaS-style metric parade. One numeric, two qualitative.
const AUTHORITY = [
  { value: '7', label: 'Operational regions' },
  { value: 'Sovereign', label: 'Jurisdiction' },
  { value: 'Continuous', label: 'Audit posture' },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <EarthBackdrop />
      <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-32 sm:pt-36 sm:pb-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <div className="relative z-10 max-w-xl py-10">

            <div className="animate-rise flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-emrg-dim">
              <span className="h-px w-8 bg-emrg-dim/70" />
              INSTITUTIONAL COMMUNICATIONS INFRASTRUCTURE
            </div>

            <h1 className="animate-rise mt-12 font-serif text-[64px] font-medium tracking-[-0.015em] leading-[1.02] text-emrg-ink sm:text-[88px]">
              {OUTCOMES.map((o) => (
                <span key={o.verb} className="block">
                  {o.verb}{' '}
                  <span className="wordmark-cream font-medium italic">{o.object}</span>
                </span>
              ))}
            </h1>

            <p className="animate-rise mt-12 max-w-md text-[15px] leading-[1.7] text-emrg-mute">
              Strategic communications infrastructure for institutions whose voice must hold. Sovereign by mandate. Continuously under audit.
            </p>

            <div className="animate-rise mt-12">
              <Link
                href="mailto:institutional@emergency.ai?subject=Deployment%20briefing"
                className="inline-flex items-center gap-3 rounded-md bg-emrg-gold px-7 py-3.5 text-sm font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream"
                style={{ boxShadow: '0 16px 60px -28px rgba(212,168,106,0.5)' }}
              >
                Request a deployment briefing
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <dl className="animate-rise mt-20 grid grid-cols-3 gap-x-8 border-t border-emrg-edge/60 pt-8">
              {AUTHORITY.map((s) => (
                <div key={s.label}>
                  <dd className="font-serif text-[20px] text-emrg-ink leading-none">{s.value}</dd>
                  <dt className="mt-3 text-[11px] uppercase tracking-[0.28em] text-emrg-mute">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden h-[640px] lg:block" />
        </div>
      </div>
    </section>
  );
}
