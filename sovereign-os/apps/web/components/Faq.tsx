const FAQ = [
  { q: 'How is this different from a per-call AI API?', a: 'Emergency AI is the entire pipeline — generation, distribution and intelligence — owned and operated as one sovereign system. You aren\'t renting tokens; you\'re running the substrate.' },
  { q: 'Does it really publish to all 11 platforms?', a: 'Yes — the distribution layer schedules, posts and orchestrates across the consumer surface set from a single sovereign API, with per-client token vaults and provenance preserved.' },
  { q: 'What do the 7 intelligence agents actually do?', a: 'They run beneath every output: strategic dispatch synthesis, narrative-drift detection, market mapping, sentiment analytics, scenario modelling, lead analysis and continuous media synthesis.' },
  { q: 'Who is it for?', a: 'Governments, ministries, banks, broadcasters, brands and institutional operators who treat media + intelligence as infrastructure rather than ad-spend.' },
  { q: 'How does it relate to Sovereign and Sovereign Domains?', a: 'Same backend, same identity layer, different surface. Emergency AI is the media + intelligence layer; Sovereign Domains is the registrar layer; Sovereign is the operating platform across all of it.' },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-sov-edge/40 bg-sov-bg/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">FREQUENTLY ASKED</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Institutional questions.</h2>
        </div>
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-sov-edge/60 overflow-hidden rounded-xl border border-sov-edge bg-sov-panel/50">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition hover:bg-sov-panel/60">
                <span className="flex-1 text-sm font-semibold text-[#e8f6fb]">{item.q}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 text-sov-cyan transition-transform duration-300 group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-sov-mute">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
