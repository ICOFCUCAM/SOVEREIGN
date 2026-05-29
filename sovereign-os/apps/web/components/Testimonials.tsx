// Editorial testimonials block — institutional voice, no logos required.

const QUOTES = [
  {
    quote: 'We compress the time between a brief and broadcast-quality output from days to under an hour. The platform is the unfair advantage.',
    name: 'Director of Communications',
    role: 'European ministerial office',
  },
  {
    quote: 'The multi-channel fan-out alone has retired three vendors. One campaign goes to LinkedIn, YouTube, and X simultaneously, audited end to end.',
    name: 'Head of Content',
    role: 'Global financial institution',
  },
  {
    quote: 'For crisis response we need production-to-publish under five minutes. Emergency AI is the only stack we have found that delivers it.',
    name: 'Crisis Operations Lead',
    role: 'National emergency response agency',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">FROM THE OPERATORS</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            Working <span className="wordmark-cream italic">at scale.</span>
          </h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.quote} className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-7">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-emrg-gold" fill="currentColor" aria-hidden>
                <path d="M9 7H5v6h3c0 2.2-1.8 4-4 4v2c3.3 0 6-2.7 6-6V7zm10 0h-4v6h3c0 2.2-1.8 4-4 4v2c3.3 0 6-2.7 6-6V7z" />
              </svg>
              <blockquote className="mt-5 font-serif text-xl leading-snug text-emrg-ink">
                {q.quote}
              </blockquote>
              <figcaption className="mt-7 border-t border-emrg-edge pt-4 text-[12px] text-emrg-mute">
                <span className="block text-emrg-ink">{q.name}</span>
                <span>{q.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
