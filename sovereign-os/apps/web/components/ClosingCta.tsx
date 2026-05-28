const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

export function ClosingCta() {
  return (
    <section className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-32">
        <div className="relative overflow-hidden rounded-2xl border border-sov-edge bg-sov-panel/60 p-16 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-20 opacity-25 blur-[140px]"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #22d3ee, transparent 70%)' }}
          />
          <div className="relative">
            <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              <span className="wordmark">Begin.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-sov-mute">
              A single decision. A continuous operating layer.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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
                Talk to sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
