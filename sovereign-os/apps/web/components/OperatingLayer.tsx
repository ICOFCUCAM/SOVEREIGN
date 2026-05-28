const PILLARS = [
  {
    label: 'Generation',
    body: 'An owned creative substrate built for institutional voice.',
  },
  {
    label: 'Orchestration',
    body: 'Releases coordinated across every channel from a single command.',
  },
  {
    label: 'Intelligence',
    body: 'Insight, anticipation and synthesis on every output.',
  },
];

export function OperatingLayer() {
  return (
    <section id="operating-layer" className="border-t border-sov-edge/40 bg-sov-bg/40">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">SELECTED CAPABILITIES</div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
            One cinematic <span className="wordmark">operating layer.</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.label} className="rounded-xl border border-sov-edge bg-sov-panel/50 p-8">
              <div className="text-[10px] tracking-[0.3em] text-sov-teal">{p.label.toUpperCase()}</div>
              <p className="mt-5 text-base leading-relaxed text-[#cfe3ee]">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
