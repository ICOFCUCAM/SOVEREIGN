const PILLARS = [
  { label: 'Cinematic generation',      body: 'An owned creative substrate built for institutional voice.' },
  { label: 'Intelligent orchestration', body: 'A single command across every channel that matters.' },
  { label: 'Strategic distribution',    body: 'Releases coordinated and continuous, not one-off.' },
  { label: 'Operational intelligence',  body: 'Insight, anticipation and synthesis on every output.' },
];

export function OperatingLayer() {
  return (
    <section id="operating-layer" className="border-t border-sov-edge/30 bg-sov-bg/40">
      <div className="mx-auto max-w-6xl px-6 py-36">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[10px] tracking-[0.4em] text-sov-mute">PLATFORM CAPABILITIES</div>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.05] sm:text-5xl">
            One cinematic <span className="wordmark">operating layer.</span>
          </h2>
        </div>
        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-sov-edge/40 bg-sov-edge/40 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.label} className="bg-[#06090e] p-8 transition hover:bg-sov-panel/40">
              <div className="text-[10px] tracking-[0.3em] text-sov-teal">{p.label.toUpperCase()}</div>
              <p className="mt-5 text-sm leading-relaxed text-sov-mute">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
