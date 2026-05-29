// Seven strategic agents — surfaced as named intelligence modules. They run
// against the same metered API as the production pipeline. The studio console
// will progressively expose each one as a queryable module; today they
// describe the intelligence surface and route any query into a pipeline_jobs
// entry tagged 'intelligence'.

const AGENTS = [
  {
    n: '01',
    name: 'Strategos',
    body: 'Strategic dispatch & executive briefing synthesis. Turns signals into a single decision-ready document.',
  },
  {
    n: '02',
    name: 'Sentinel',
    body: 'Narrative drift, threat, and propagation tracking. Watches for the story changing under you.',
  },
  {
    n: '03',
    name: 'Cartographer',
    body: 'Market mapping, opportunity surfacing, competitive geometry. The terrain you operate on.',
  },
  {
    n: '04',
    name: 'Pulse',
    body: 'Sentiment, reach and resonance analytics in real time. The room’s temperature, channel by channel.',
  },
  {
    n: '05',
    name: 'Architect',
    body: 'Multi-step scenario, campaign and crisis modelling. Plans across days, not posts.',
  },
  {
    n: '06',
    name: 'Liaison',
    body: 'Lead qualification, relationship and revenue analysis. The strategic CRM layer.',
  },
  {
    n: '07',
    name: 'Forge',
    body: 'Continuous media synthesis & cross-layer orchestration. The hands behind the pipeline.',
  },
];

export function IntelligenceAgents() {
  return (
    <section id="intelligence" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">SEVEN INTELLIGENCE AGENTS</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            An institutional <span className="wordmark-cream italic">intelligence layer.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-emrg-mute">
            Seven named strategic agents run beneath every output — synthesizing dispatches, tracking narratives, modelling scenarios, qualifying relationships, orchestrating the substrate.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((a) => (
            <div key={a.n} className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6 transition hover:border-emrg-dim">
              <div className="text-[10px] uppercase tracking-[0.28em] text-emrg-gold">{a.n}</div>
              <h3 className="mt-3 font-serif text-2xl text-emrg-ink">{a.name}</h3>
              <p className="mt-3 text-[12px] leading-relaxed text-emrg-mute">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
