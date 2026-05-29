import Link from 'next/link';
import { Reveal } from './Reveal';

const CAPABILITIES = [
  {
    title: 'Media production at command speed',
    body: 'Cinematic film, image, narration and editorial — directed, produced and assembled under one command surface. The house voice carries through every output.',
    bullets: ['Production at scale', 'House-voice control', 'Audit-trailed output'],
    to: '/console/studio',
    cta: 'Open studio',
  },
  {
    title: 'Coordinated distribution across every channel',
    body: 'One sovereign contract orchestrates release across the channels that matter. Provenance preserved. One audit trail. Honest coverage state, never fake success.',
    bullets: ['Orchestrated release', 'Per-tenant credentials', 'Honest coverage state'],
    to: '/console/studio#publish',
    cta: 'Coordinate release',
  },
  {
    title: 'Strategic intelligence for decision-makers',
    body: 'Executive briefings, narrative monitoring, scenario modelling and relationship intelligence — delivered as dispatches inside the console, not a separately metered API.',
    bullets: ['Decision-ready output', 'Continuously audited', 'Sovereign jurisdiction'],
    to: '#intelligence',
    cta: 'Open intelligence',
  },
];

export function SovereignLayers() {
  return (
    <section id="capabilities" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">CAPABILITIES</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              Built for the work of communications.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-emrg-mute">
              Production, distribution and intelligence — three operational surfaces under one institutional console.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <article key={c.title} className="relative flex flex-col rounded-2xl bg-emrg-panel/50 p-8 transition duration-500 hover:-translate-y-1 hover:bg-emrg-panel/70">
              {/* Single gold hairline — the only accent on the card. */}
              <span aria-hidden className="h-px w-10 bg-emrg-gold/70" />
              <h3 className="mt-7 font-serif text-[24px] font-medium leading-[1.15] text-emrg-ink">{c.title}</h3>
              <p className="mt-5 text-[15px] leading-[1.7] text-emrg-mute">{c.body}</p>
              <ul className="mt-8 space-y-3 border-t border-emrg-edge/60 pt-6 text-[13px] text-emrg-ink">
                {c.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <Link href={c.to} className="mt-10 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-emrg-cream transition hover:gap-3">
                {c.cta} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
