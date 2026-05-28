const AGENTS = [
  { name: 'Strategos', role: 'Strategic dispatch & executive briefing synthesis.' },
  { name: 'Sentinel', role: 'Narrative drift, threat & propagation tracking.' },
  { name: 'Cartographer', role: 'Market mapping, opportunity surfacing, competitive geometry.' },
  { name: 'Pulse', role: 'Sentiment, reach and resonance analytics in real time.' },
  { name: 'Architect', role: 'Multi-step scenario, campaign and crisis modelling.' },
  { name: 'Liaison', role: 'Lead qualification, relationship and revenue analysis.' },
  { name: 'Forge', role: 'Continuous media synthesis & cross-layer orchestration.' },
];

export function Agents() {
  return (
    <section id="intelligence" className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">SEVEN INTELLIGENCE AGENTS</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">An institutional intelligence layer.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-sov-mute">
            Seven named strategic agents run beneath every output — synthesizing dispatches, tracking narratives, modelling scenarios, qualifying relationships, orchestrating the substrate.
          </p>
        </div>
        <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a, i) => (
            <div key={a.name} className="rounded-xl border border-sov-edge bg-sov-panel/50 p-5 transition hover:-translate-y-0.5 hover:border-sov-cyan/40">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-md border border-sov-cyan/40 bg-sov-cyan/10 text-[11px] font-semibold text-sov-cyan">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="wordmark text-base font-semibold">{a.name}</div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-sov-mute">{a.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
