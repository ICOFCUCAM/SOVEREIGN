import { Reveal } from './Reveal';

const OUTCOMES = [
  { title: 'Hold the narrative',          body: 'Carry institutional voice under pressure — without chasing trends or improvising posture.' },
  { title: 'Coordinate distribution',     body: 'A single sovereign mandate across every channel. Provenance preserved; doctrine intact.' },
  { title: 'Operate intelligence',        body: 'Brief the people who decide with synthesized signal. Read the room before you respond.' },
  { title: 'Watch the narrative',         body: 'Drift, threat and propagation monitored continuously, under audit, across every surface.' },
  { title: 'Brief the institution',       body: 'Decision-ready dispatches assembled from open-source signal and internal posture.' },
  { title: 'Mobilise at speed',           body: 'One staging surface for every stakeholder layer. Communications coordinated, not improvised.' },
  { title: 'Hold authoritative communications', body: 'One audited record. Every dispatch attributable to the institution behind it.' },
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
