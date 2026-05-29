import { Reveal } from './Reveal';

const CAPABILITIES = [
  { title: 'Executive Briefing',        body: 'Decision-ready dispatches synthesized for the people who decide — open-source signal joined with institutional posture.' },
  { title: 'Narrative Monitoring',      body: 'Continuous watch for drift, propagation and threat. The institution sees the story before the story moves.' },
  { title: 'Opportunity Discovery',     body: 'Strategic geometry mapped from open-source intelligence. Where to move, when to hold the line.' },
  { title: 'Campaign Modelling',        body: 'Multi-step scenario and crisis planning — communications doctrine across days, not posts.' },
  { title: 'Relationship Intelligence', body: 'Stakeholder and revenue posture treated as a first-class governance layer.' },
  { title: 'Operational Coordination',  body: 'Cross-substrate orchestration under one audit trail. Doctrine, dispatch and review in one record.' },
];

export function IntelligenceAgents() {
  return (
    <section id="intelligence" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">STRATEGIC INTELLIGENCE</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              Decision support beneath every dispatch.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-emrg-mute">
              Beneath every communication, the platform synthesizes the signal institutional decision-makers need to read the room, hold the line, and brief their counterparts.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="rounded-2xl bg-emrg-panel/40 p-8 transition duration-500 hover:bg-emrg-panel/60">
              <h3 className="font-serif text-[20px] font-medium text-emrg-ink">{c.title}</h3>
              <p className="mt-5 text-[15px] leading-[1.7] text-emrg-mute">{c.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-center text-[12px] uppercase tracking-[0.28em] text-emrg-mute">
          Delivered as institutional briefings, not a metered API
        </p>
      </div>
    </section>
  );
}
