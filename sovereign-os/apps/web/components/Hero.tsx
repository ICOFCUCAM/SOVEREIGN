const METRICS = [
  { v: '11', l: 'distribution platforms' },
  { v: '4', l: 'media classes' },
  { v: '7', l: 'intelligence agents' },
  { v: '3', l: 'sovereign layers' },
];

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

export function Hero() {
  return (
    <section id="top" className="hud-grid relative overflow-hidden border-b border-sov-edge/40">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1100px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-25 blur-[140px]"
        style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-32 text-center">
        <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-sov-edge bg-sov-panel/60 px-4 py-1.5 text-[11px] tracking-widest text-sov-mute">
          <span className="inline-block h-1.5 w-1.5 animate-pulseline rounded-full bg-sov-teal" />
          EMERGENCY AI · MEDIA · DISTRIBUTION · INTELLIGENCE
        </div>
        <h1 className="animate-rise mt-7 text-balance text-6xl font-semibold leading-[1.02] sm:text-8xl">
          <span className="wordmark">Emergency AI.</span>
        </h1>
        <p className="animate-rise mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#cfe3ee] sm:text-lg">
          AI media &amp; acquisition infrastructure, <span className="text-sov-cyan">owned end-to-end</span>.
        </p>
        <p className="animate-rise mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-sov-mute sm:text-base">
          Generate cinematic media, distribute it across every major platform, and run strategic
          intelligence — through one sovereign API <em className="not-italic text-[#cfe3ee]">you own</em>.
          No per-call middleman. No rented grid. No moderation lottery.
        </p>
        <div className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#pricing"
            className="rounded bg-sov-cyan px-6 py-2.5 text-sm font-semibold text-sov-bg transition hover:-translate-y-0.5 hover:bg-sov-cyan/90"
            style={{ boxShadow: '0 14px 40px -12px rgba(34,211,238,0.5)' }}
          >
            Choose a plan
          </a>
          <a
            href={`${PORTAL}/docs`}
            className="rounded border border-sov-edge px-6 py-2.5 text-sm text-sov-mute transition hover:-translate-y-0.5 hover:border-sov-cyan hover:text-sov-cyan"
          >
            Read the API docs
          </a>
        </div>
        {/* metric tiles */}
        <div className="animate-rise mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.l} className="rounded-lg border border-sov-edge bg-sov-panel/40 px-4 py-4 transition hover:border-sov-cyan/40">
              <div className="text-3xl font-semibold text-[#e8f6fb]">{m.v}</div>
              <div className="mt-1 text-[10px] tracking-[0.2em] text-sov-mute">{m.l}</div>
            </div>
          ))}
        </div>
        {/* trust strip */}
        <div className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] tracking-[0.2em] text-sov-mute">
          <span className="inline-flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-sov-teal" /> OWNED PIPELINE</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-sov-teal" /> PROVENANCE BAKED IN</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-sov-teal" /> SOVEREIGN JURISDICTION</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-sov-teal" /> QUEUED · AUDITED · RETRIED</span>
        </div>
      </div>
    </section>
  );
}
