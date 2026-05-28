const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

export function ClosingCta() {
  return (
    <section className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl border border-sov-edge bg-sov-panel/60 p-12 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-20 opacity-25 blur-[140px]"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #22d3ee, transparent 70%)' }}
          />
          <div className="relative">
            <div className="text-[11px] tracking-[0.3em] text-sov-mute">BEGIN</div>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-6xl">
              <span className="wordmark">Own the substrate.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-sov-mute">
              Generation, distribution and intelligence — sovereign by design, institutional by intent.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#pricing"
                className="rounded bg-sov-cyan px-7 py-3.5 text-sm font-semibold text-sov-bg transition hover:-translate-y-0.5"
                style={{ boxShadow: '0 14px 40px -12px rgba(34,211,238,0.5)' }}
              >
                Choose a plan
              </a>
              <a
                href={PORTAL}
                className="rounded border border-sov-edge px-7 py-3.5 text-sm text-sov-mute transition hover:-translate-y-0.5 hover:border-sov-cyan hover:text-sov-cyan"
              >
                Open developer console
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
