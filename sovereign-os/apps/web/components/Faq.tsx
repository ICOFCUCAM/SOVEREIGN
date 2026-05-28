const FAQ = [
  { q: 'Who is Emergency AI for?',                 a: 'Institutions, brands and sovereign operators running serious media programs.' },
  { q: 'How is this different from a generic AI API?', a: 'Emergency AI is a managed creative and distribution layer designed for sustained institutional operations, not a metered call interface.' },
  { q: 'Do I keep ownership of what I produce?',    a: 'Yes. Your media, your accounts, your audience — owned by you.' },
  { q: 'Is it suitable for enterprise governance?', a: 'Yes. Auditability, access controls and deployment flexibility are first-class.' },
  { q: 'How do I get started?',                     a: 'Choose a plan to begin, or contact sales for institutional onboarding.' },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-sov-edge/40 bg-sov-bg/40">
      <div className="mx-auto max-w-4xl px-6 py-28">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">FREQUENTLY ASKED</div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
            Institutional <span className="wordmark">questions.</span>
          </h2>
        </div>
        <div className="mx-auto mt-12 divide-y divide-sov-edge/60 overflow-hidden rounded-xl border border-sov-edge bg-sov-panel/50">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5 transition hover:bg-sov-panel/60">
                <span className="flex-1 text-base font-semibold text-[#e8f6fb]">{item.q}</span>
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
              <div className="px-6 pb-6 text-sm leading-relaxed text-sov-mute">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
