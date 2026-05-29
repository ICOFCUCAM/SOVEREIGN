import Link from 'next/link';

// Cinematic Earth hero — the real photo-emerald globe sits to the right,
// feathered into the page via radial CSS masks so its dark background reads
// as transparent against the emrg-bg. Gold orbital arcs overlay it for the
// signature Emergency AI accent.
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
          opacity: 0.9,
        }}
      />
      <div
        aria-hidden
        className="absolute right-[-6%] top-[28%] h-[60%] w-[55%]"
        style={{
          background: 'radial-gradient(ellipse 50% 45% at 80% 35%, rgba(246,213,154,0.18), rgba(212,168,106,0.07) 45%, transparent 75%)',
          filter: 'blur(8px)',
        }}
      />
      <svg viewBox="0 0 800 800" className="absolute right-[-8%] top-1/2 h-[140%] w-auto -translate-y-1/2" aria-hidden>
        <g fill="none" stroke="#d4a86a" strokeLinecap="round">
          <ellipse cx="400" cy="400" rx="360" ry="350" strokeWidth="0.5" strokeDasharray="1 9" opacity="0.32" />
          <ellipse cx="400" cy="400" rx="395" ry="378" strokeWidth="0.5" strokeDasharray="1 11" opacity="0.22" transform="rotate(-14 400 400)" />
          <ellipse cx="400" cy="400" rx="430" ry="406" strokeWidth="0.4" strokeDasharray="1 14" opacity="0.16" transform="rotate(9 400 400)" />
        </g>
      </svg>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(95deg, #08080d 18%, rgba(8,8,13,0.86) 38%, rgba(8,8,13,0.4) 56%, transparent 75%)' }}
      />
    </div>
  );
}

// Outcome lines — the editorial spine of the hero. Three command verbs in
// institutional voice, no architecture numbers anywhere on this surface.
const OUTCOMES = [
  { verb: 'Own', object: 'the narrative.' },
  { verb: 'Coordinate', object: 'distribution.' },
  { verb: 'Operate', object: 'intelligence.' },
];

// Authority strip — replaces the architecture stat strip. Institutional
// signals: where it runs, under whose authority, how it's governed.
const AUTHORITY = [
  { label: 'Operational regions', value: '7' },
  { label: 'Jurisdiction', value: 'Sovereign' },
  { label: 'Operations', value: 'Continuously audited' },
  { label: 'Uptime SLA', value: '99.99%' },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <EarthBackdrop />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
          <div className="relative z-10 max-w-xl py-10">
            <div className="animate-rise flex items-center gap-3 text-[10px] tracking-[0.32em] text-emrg-dim">
              <span className="h-px w-8 bg-emrg-dim/70" />
              INSTITUTIONAL COMMUNICATIONS INFRASTRUCTURE
            </div>

            <h1 className="animate-rise mt-9 font-serif text-[60px] font-medium leading-[0.98] tracking-tight text-emrg-ink sm:text-[80px]">
              {OUTCOMES.map((o) => (
                <span key={o.verb} className="block">
                  {o.verb}{' '}
                  <span className="wordmark-cream font-semibold italic">{o.object}</span>
                </span>
              ))}
            </h1>

            <p className="animate-rise mt-7 max-w-md text-base leading-relaxed text-emrg-mute sm:text-lg">
              A unified command surface for institutions that coordinate media, distribution, and strategic intelligence at scale. Sovereign-grade. Mission-critical. Owned end to end.
            </p>

            <div className="animate-rise mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="mailto:institutional@emergency.ai?subject=Deployment%20briefing"
                className="inline-flex items-center gap-3 rounded-md bg-emrg-gold px-6 py-3 text-sm font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream"
                style={{ boxShadow: '0 14px 40px -12px rgba(212,168,106,0.55)' }}
              >
                Request a deployment briefing
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/console" className="inline-flex items-center gap-2 text-sm text-emrg-ink transition hover:text-emrg-cream">
                Open the console
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <dl className="animate-rise mt-12 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-emrg-edge/60 pt-7 sm:grid-cols-4">
              {AUTHORITY.map((s) => (
                <div key={s.label}>
                  <dd className="font-serif text-2xl text-emrg-ink">{s.value}</dd>
                  <dt className="mt-1 text-[10px] uppercase tracking-[0.22em] text-emrg-mute">{s.label}</dt>
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
