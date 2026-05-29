// Outcomes block — the seven things you operate, surfaced before any
// architecture is discussed. Pure outcome language; no codenames, no
// implementation chips, no counts.

const OUTCOMES = [
  {
    title: 'Acquire attention',
    body: 'Direct the narrative through cinematic, institutional-grade media.',
  },
  {
    title: 'Coordinate distribution',
    body: 'One contract orchestrates release across the channels that matter.',
  },
  {
    title: 'Operate intelligence',
    body: 'Brief decision-makers with synthesized signal, not raw noise.',
  },
  {
    title: 'Monitor narratives',
    body: 'Watch for the story changing under you, continuously, across channels.',
  },
  {
    title: 'Generate executive briefings',
    body: 'Decision-ready dispatches assembled from the open web and your own surface.',
  },
  {
    title: 'Execute campaigns at scale',
    body: 'A single staging surface for every region, channel and stakeholder layer.',
  },
  {
    title: 'Coordinate communications',
    body: 'Across teams, regions and stakeholders — one audited record of every dispatch.',
  },
];

export function Outcomes() {
  return (
    <section id="outcomes" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-mute">WHAT YOU OPERATE</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            Own the narrative. <span className="wordmark-cream italic">Across every form.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.slice(0, 6).map((o) => (
            <div key={o.title} className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
              <h3 className="font-serif text-xl text-emrg-ink">{o.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">{o.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-7 text-center">
          <h3 className="font-serif text-xl text-emrg-ink">{OUTCOMES[6].title}</h3>
          <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-relaxed text-emrg-mute">{OUTCOMES[6].body}</p>
        </div>
      </div>
    </section>
  );
}
