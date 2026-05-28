const CAPABILITIES = [
  {
    title: 'Cinematic campaigns',
    body: 'Generate strategic films, images and editorial as a continuous creative practice.',
  },
  {
    title: 'Global distribution',
    body: 'Coordinate releases across every channel that matters to your audience.',
  },
  {
    title: 'Media operations',
    body: 'Run a sustained institutional media practice as managed operations.',
  },
  {
    title: 'Strategic intelligence',
    body: 'Deploy a market-aware intelligence layer beneath every creative output.',
  },
];

export function Capabilities() {
  return (
    <section id="platform" className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">WHAT YOU CAN DO</div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
            Built for institutional <span className="wordmark">media operations.</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {CAPABILITIES.map((c, i) => (
            <div
              key={c.title}
              className="rounded-xl border border-sov-edge bg-sov-panel/40 p-8 transition hover:border-sov-cyan/40"
            >
              <div className="text-[10px] tracking-[0.3em] text-sov-teal">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="mt-3 text-xl font-semibold text-[#e8f6fb]">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-sov-mute">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
