// Capabilities — the three operational surfaces of the platform, named for
// what they DO. No "Layer 1/2/3", no FFmpeg/Runway, no platform counts.
// File name preserved to avoid breaking imports.

import Link from 'next/link';

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
    body: 'Executive briefings, narrative monitoring, scenario modelling and relationship intelligence — delivered as dispatches inside the console, not as a separately metered API.',
    bullets: ['Decision-ready output', 'Continuously audited', 'Sovereign jurisdiction'],
    to: '#intelligence',
    cta: 'Open intelligence',
  },
];

export function SovereignLayers() {
  return (
    <section id="capabilities" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-mute">CAPABILITIES</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            Built for the work of <span className="wordmark-cream italic">communications.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-emrg-mute">
            Production, distribution and intelligence — three operational surfaces under one institutional console.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="relative flex flex-col rounded-2xl border border-emrg-edge bg-emrg-panel/50 p-7 transition hover:-translate-y-0.5 hover:border-emrg-dim">
              <h3 className="font-serif text-2xl text-emrg-ink leading-tight">{c.title}</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-emrg-mute">{c.body}</p>
              <ul className="mt-6 space-y-2 border-t border-emrg-edge pt-5 text-[12px] text-emrg-ink">
                {c.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-emrg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link href={c.to} className="mt-7 inline-flex items-center gap-1.5 text-[12px] tracking-wide text-emrg-cream transition hover:gap-2.5">
                {c.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
