import Link from 'next/link';

export function ClosingCta() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-6 pb-28 sm:pb-32">
        <div
          className="relative overflow-hidden rounded-2xl border border-emrg-edge"
          style={{
            background:
              'radial-gradient(60% 100% at 100% 50%, rgba(212,168,106,0.18), transparent 70%),' +
              'linear-gradient(180deg, #0a0a10 0%, #06060a 100%)',
            boxShadow: '0 40px 120px -40px rgba(212,168,106,0.25)',
          }}
        >
          {/* ambient gold light leak from the right */}
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emrg-gold/40 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute right-2 top-1/2 h-2/3 w-32 -translate-y-1/2 blur-2xl" style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(212,168,106,0.18), transparent 70%)' }} />

          <div className="relative grid items-center gap-10 px-10 py-16 sm:px-14 sm:py-20 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="font-serif text-4xl font-medium leading-[1.02] text-emrg-ink sm:text-6xl">
                Ready to own<br />your infrastructure?
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-emrg-mute">
                Join institutions, brands and operators building the future of communications.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5 lg:justify-end">
              <Link
                href="/sign-in?mode=signup"
                className="inline-flex items-center gap-3 rounded-md bg-emrg-gold px-6 py-3 text-sm font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream"
                style={{ boxShadow: '0 16px 40px -14px rgba(212,168,106,0.6)' }}
              >
                Start Building
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href="mailto:institutional@emergency.ai"
                className="inline-flex items-center gap-2 text-sm text-emrg-ink transition hover:text-emrg-cream"
              >
                Contact Institutional Sales
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
