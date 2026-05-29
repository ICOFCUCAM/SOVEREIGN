import { Reveal } from './Reveal';

const CAPABILITIES = [
  { title: 'Executive Briefings',     body: 'Decision-ready dispatches assembled from open-source signal and institutional posture — delivered to the principals who must act.' },
  { title: 'Threat Monitoring',       body: 'Continuous watch on adversarial activity, narrative drift and propagation across every relevant surface.' },
  { title: 'Market Intelligence',     body: 'Strategic geometry mapped from open-source intelligence. Where the institution moves, when it holds the line.' },
  { title: 'Scenario Planning',       body: 'Multi-step scenario, contingency and crisis modelling — institutional doctrine across days, not posts.' },
  { title: 'Stakeholder Intelligence',body: 'Stakeholder posture, relationship mapping and revenue analysis surfaced as a first-class governance layer.' },
  { title: 'Operational Coordination',body: 'Cross-substrate orchestration under one audit trail. Doctrine, dispatch and review in one defensible record.' },
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
              Beneath every dispatch, the infrastructure synthesizes the signal institutional decision-makers need to read the room, hold the line, and brief their counterparts.
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
