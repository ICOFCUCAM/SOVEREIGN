const STAGES = [
  { label: 'Sovereign API', sub: 'one entrypoint' },
  { label: 'Generation', sub: 'film · image · audio · text' },
  { label: 'Intelligence', sub: '7 agents on every output' },
  { label: 'Distribution', sub: '11 platforms' },
  { label: 'Provenance', sub: 'audit + watermark' },
];

export function Architecture() {
  return (
    <section id="architecture" className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">ARCHITECTURE</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">One pipeline. Sovereign substrate.</h2>
        </div>
        <div className="relative mt-12 overflow-hidden rounded-2xl border border-sov-edge bg-sov-panel/50 p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-20 opacity-15 blur-[120px]"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #22d3ee, transparent 70%)' }}
          />
          <div className="relative grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
            {STAGES.map((s, i, a) => (
              <div key={s.label} className="contents">
                <div className="rounded-xl border border-sov-cyan/30 bg-sov-cyan/5 px-4 py-5 text-center">
                  <div className="text-sm font-semibold text-[#e8f6fb]">{s.label}</div>
                  <div className="mt-1 text-[10px] tracking-[0.2em] text-sov-mute">{s.sub}</div>
                </div>
                {i < a.length - 1 && (
                  <div aria-hidden className="hidden items-center justify-center text-sov-cyan/40 md:flex">
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <path d="M0 6h17M13 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-7 text-center text-[10px] tracking-[0.25em] text-sov-mute">
            QUEUED · AUDITED · RETRIED · RATE-LIMITED · OWNER-SCOPED TENANCY
          </div>
        </div>
      </div>
    </section>
  );
}
