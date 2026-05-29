import Link from 'next/link';

// Institutional close — briefing first, plan second. The italic gold
// accent appears here and in the Hero only.
export function ClosingCta() {
  return (
    <section className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            backgroundColor: '#0a0a10',
            backgroundImage:
              'radial-gradient(60% 100% at 100% 50%, rgba(212,168,106,0.16), transparent 70%)',
          }}
        >
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emrg-gold/30 to-transparent" />

          <div className="relative grid items-center gap-12 px-12 py-20 sm:px-16 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">BEGIN</div>
              <h2 className="mt-6 font-serif text-[44px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[64px]">
                Operate the <span className="wordmark-cream font-medium italic">substrate.</span>
              </h2>
              <p className="mt-8 max-w-md text-[15px] leading-[1.75] text-emrg-mute">
                For governments, institutions and enterprises whose voice carries the mandate behind it. Doctrine-aligned. Continuously audited. Sovereign by default.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 lg:justify-end">
              <Link
                href="mailto:institutional@emergency.ai?subject=Deployment%20briefing"
                className="inline-flex items-center gap-3 rounded-md bg-emrg-gold px-7 py-3.5 text-sm font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream"
                style={{ boxShadow: '0 16px 60px -28px rgba(212,168,106,0.55)' }}
              >
                Request a briefing
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/pricing" className="text-[13px] uppercase tracking-[0.22em] text-emrg-mute transition hover:text-emrg-cream">
                Choose a plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
