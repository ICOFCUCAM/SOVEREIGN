const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

export function Hero() {
  return (
    <section id="top" className="hud-grid relative overflow-hidden border-b border-sov-edge/40">
      {/* ambient cinematic glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.22] blur-[160px]"
        style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)' }}
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-40 text-center sm:py-48">
        <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-sov-edge bg-sov-panel/60 px-4 py-1.5 text-[11px] tracking-[0.3em] text-sov-mute">
          <span className="inline-block h-1.5 w-1.5 animate-pulseline rounded-full bg-sov-teal" />
          EMERGENCY AI
        </div>
        <h1 className="animate-rise mt-8 text-balance text-6xl font-semibold leading-[1.02] tracking-tight sm:text-8xl">
          <span className="wordmark">Own the narrative.</span>
        </h1>
        <p className="animate-rise mx-auto mt-7 max-w-2xl text-base leading-relaxed text-sov-mute sm:text-lg">
          Cinematic media infrastructure for institutions, brands and sovereign systems.
        </p>
        <div className="animate-rise mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#pricing"
            className="rounded bg-sov-cyan px-7 py-3 text-sm font-semibold text-sov-bg transition hover:-translate-y-0.5 hover:bg-sov-cyan/90"
            style={{ boxShadow: '0 14px 40px -12px rgba(34,211,238,0.5)' }}
          >
            Choose a plan
          </a>
          <a
            href={`${PORTAL}/docs`}
            className="rounded border border-sov-edge px-7 py-3 text-sm text-sov-mute transition hover:-translate-y-0.5 hover:border-sov-cyan hover:text-sov-cyan"
          >
            Read the docs
          </a>
        </div>
      </div>
    </section>
  );
}
