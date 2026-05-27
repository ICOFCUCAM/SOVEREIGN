export function Hero() {
  return (
    <section id="top" className="hud-grid relative overflow-hidden border-b border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-28 text-center">
        <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-sov-edge bg-sov-panel/60 px-4 py-1.5 text-[11px] tracking-widest text-sov-mute">
          <span className="inline-block h-1.5 w-1.5 animate-pulseline rounded-full bg-sov-teal" />
          SOVEREIGN INFRASTRUCTURE · MEDIA · DISTRIBUTION · INTELLIGENCE
        </div>
        <h1 className="animate-rise mt-6 text-balance text-5xl font-semibold leading-[1.05] sm:text-6xl">
          <span className="wordmark">AI Media &amp; Acquisition</span>
          <br />
          Infrastructure, owned end-to-end.
        </h1>
        <p className="animate-rise mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-sov-mute sm:text-base">
          Generate cinematic media, distribute it across every major platform, and run strategic
          intelligence — through one sovereign API you own. No per-call middleman, no rented grid.
        </p>
        <div className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href="#pricing" className="rounded bg-sov-cyan px-5 py-2.5 text-sm font-semibold text-sov-bg hover:bg-sov-cyan/90">
            Choose a plan
          </a>
          <a href={(process.env.NEXT_PUBLIC_PORTAL_URL ?? '#') + '/docs'} className="rounded border border-sov-edge px-5 py-2.5 text-sm text-sov-mute hover:border-sov-cyan hover:text-sov-cyan">
            Read the API docs
          </a>
        </div>
        <p className="mt-4 text-[11px] text-sov-mute">11 platforms · 4 media classes · 7 intelligence agents</p>
      </div>
    </section>
  );
}
