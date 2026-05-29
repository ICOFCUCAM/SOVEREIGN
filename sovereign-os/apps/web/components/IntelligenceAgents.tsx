import { Reveal } from './Reveal';

const CAPABILITIES = [
  { title: 'Executive Briefing',        body: 'Decision-ready dispatches synthesized from signal across the open web and your own channels.' },
  { title: 'Narrative Monitoring',      body: 'Drift, threat and propagation tracking across every channel the platform reaches.' },
  { title: 'Opportunity Discovery',     body: 'Market mapping and competitive geometry surfaced from the open web and your dispatches.' },
  { title: 'Campaign Modelling',        body: 'Multi-step scenario, campaign and crisis modelling — plans across days, not posts.' },
  { title: 'Relationship Intelligence', body: 'Lead qualification, relationship mapping and revenue analysis as a first-class layer.' },
  { title: 'Operational Coordination',  body: 'Cross-layer orchestration across the substrate, with one unified audit trail.' },
];

export function IntelligenceAgents() {
  return (
    <section id="intelligence" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">STRATEGIC INTELLIGENCE</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              An intelligence layer beneath every output.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-emrg-mute">
              Beneath every production and dispatch, the platform synthesizes the signal your institution needs to read the room, plan the next move, and brief the people who must decide.
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
          Delivered as briefings, dispatches and signal feeds inside the console
        </p>
      </div>
    </section>
  );
}
