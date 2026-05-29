import { Reveal } from './Reveal';

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
    <section id="testimonials" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">FROM THE OPERATORS</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              Working at scale.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.quote} className="rounded-2xl bg-emrg-panel/40 p-8">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-emrg-gold/70" fill="currentColor" aria-hidden>
                <path d="M9 7H5v6h3c0 2.2-1.8 4-4 4v2c3.3 0 6-2.7 6-6V7zm10 0h-4v6h3c0 2.2-1.8 4-4 4v2c3.3 0 6-2.7 6-6V7z" />
              </svg>
              <blockquote className="mt-7 font-serif text-[22px] leading-[1.35] text-emrg-ink">
                {q.quote}
              </blockquote>
              <figcaption className="mt-8 border-t border-emrg-edge/60 pt-5 text-[12px] text-emrg-mute">
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
