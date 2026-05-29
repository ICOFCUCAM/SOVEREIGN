import { Reveal } from './Reveal';

const OUTCOMES = [
  { title: 'Acquire attention',          body: 'Direct the narrative through cinematic, institutional-grade media.' },
  { title: 'Coordinate distribution',    body: 'One contract orchestrates release across the channels that matter.' },
  { title: 'Operate intelligence',       body: 'Brief decision-makers with synthesized signal, not raw noise.' },
  { title: 'Monitor narratives',         body: 'Watch for the story changing under you, continuously, across channels.' },
  { title: 'Generate executive briefings', body: 'Decision-ready dispatches assembled from the open web and your own surface.' },
  { title: 'Execute campaigns at scale', body: 'A single staging surface for every region, channel and stakeholder layer.' },
  { title: 'Coordinate communications',  body: 'Across teams, regions and stakeholders — one audited record of every dispatch.' },
];

export function Outcomes() {
  return (
    <section id="outcomes" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">WHAT YOU OPERATE</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              Own the narrative. Across every form.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.slice(0, 6).map((o) => (
            <div key={o.title} className="rounded-2xl bg-emrg-panel/40 p-8">
              <h3 className="font-serif text-[20px] font-medium text-emrg-ink">{o.title}</h3>
              <p className="mt-5 text-[15px] leading-[1.7] text-emrg-mute">{o.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-emrg-panel/40 p-8 text-center">
          <h3 className="font-serif text-[20px] font-medium text-emrg-ink">{OUTCOMES[6].title}</h3>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.7] text-emrg-mute">{OUTCOMES[6].body}</p>
        </div>
      </div>
    </section>
  );
}
