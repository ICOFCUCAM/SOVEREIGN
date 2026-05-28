const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

export function Hero() {
  return (
    <section id="top" className="hud-grid relative overflow-hidden border-b border-sov-edge/30">
      {/* the single cinematic glow that anchors the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[1000px] w-[1500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.18] blur-[180px]"
        style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)' }}
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-56 text-center sm:py-64">
        <div className="animate-rise inline-flex items-center gap-2 text-[10px] tracking-[0.4em] text-sov-mute">
          <span className="inline-block h-1 w-1 animate-pulseline rounded-full bg-sov-teal" />
          EMERGENCY AI
        </div>
        <h1 className="animate-rise mt-10 text-balance text-6xl font-semibold leading-[1.0] tracking-tight sm:text-[8.5rem] sm:leading-[0.95]">
          <span className="wordmark">Own the narrative.</span>
        </h1>
        <p className="animate-rise mx-auto mt-9 max-w-xl text-base leading-relaxed text-sov-mute sm:text-lg">
          Cinematic media infrastructure for institutions, brands and sovereign systems.
        </p>
        <div className="animate-rise mt-12 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#pricing"
            className="rounded bg-sov-cyan px-8 py-3 text-sm font-semibold text-sov-bg transition hover:-translate-y-0.5 hover:bg-sov-cyan/90"
            style={{ boxShadow: '0 14px 40px -12px rgba(34,211,238,0.5)' }}
          >
            Choose a plan
          </a>
          <a
            href={`${PORTAL}/docs`}
            className="rounded px-8 py-3 text-sm text-sov-mute transition hover:-translate-y-0.5 hover:text-sov-cyan"
          >
            Read the docs →
          </a>
        </div>
      </div>
    </section>
  );
}
