const OUTCOMES = [
  { title: 'Cinematic campaigns',          body: 'Strategic films, images and editorial as a continuous creative practice.' },
  { title: 'Strategic distribution',       body: 'Coordinate releases across every channel that matters to your audience.' },
  { title: 'Institutional communications', body: 'A sustained institutional media program, run as managed operations.' },
  { title: 'Coordinated intelligence',     body: 'Market-aware intelligence beneath every output, briefing every decision.' },
];

export function Capabilities() {
  return (
    <section id="platform" className="border-t border-sov-edge/30">
      <div className="mx-auto max-w-6xl px-6 py-36">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[10px] tracking-[0.4em] text-sov-mute">WHAT IT ENABLES</div>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.05] sm:text-5xl">
            Built for institutional <span className="wordmark">media operations.</span>
          </h2>
        </div>
        <div className="mt-20 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {OUTCOMES.map((o, i) => (
            <div key={o.title} className="group">
              <div className="text-[10px] tracking-[0.4em] text-sov-teal">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="mt-4 text-xl font-semibold text-[#e8f6fb] sm:text-2xl">{o.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-sov-mute">{o.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
