// Three sovereign layers — the architectural spine the platform exposes.
// Each card describes a real operational surface that already ships
// (orchestrate-film, post-campaign, the Studio queue + intelligence stubs).

import Link from 'next/link';

const LAYERS = [
  {
    n: 'LAYER 1',
    name: 'Media Acquisition',
    body: 'Cinematic, operational, and editorial media — directed by AI, rendered through a Runway + image + narration pipeline, and stitched by the FFmpeg assembly worker.',
    bullets: ['4 media classes', 'Film orchestration', 'FFmpeg assembly worker'],
    to: '/console/studio',
    cta: 'Open studio',
  },
  {
    n: 'LAYER 2',
    name: 'Sovereign Distribution Grid',
    body: 'One publish contract across the major networks. AI-scheduled releases, per-client token vaults, and a single audit trail for every dispatch.',
    bullets: ['11 platform surfaces', 'AI scheduling + reposting', 'Per-client token vault'],
    to: '/console/studio#publish',
    cta: 'See the grid',
  },
  {
    n: 'LAYER 3',
    name: 'Strategic Intelligence',
    body: 'Seven named strategic agents — running on the same metered API as the production pipeline — synthesize dispatches, track narratives, and brief decision-makers.',
    bullets: ['7 intelligence agents', 'Trend + viral forecasting', 'Executive briefings'],
    to: '#intelligence',
    cta: 'Meet the agents',
  },
];

export function SovereignLayers() {
  return (
    <section id="layers" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">THREE SOVEREIGN LAYERS</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            One pipeline, <span className="wordmark-cream italic">end to end.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-emrg-mute">
            Generation, distribution, and intelligence — three surfaces of one substrate. You operate them under a single console.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {LAYERS.map((l) => (
            <div key={l.n} className="relative flex flex-col rounded-2xl border border-emrg-edge bg-emrg-panel/50 p-7 transition hover:-translate-y-0.5 hover:border-emrg-dim">
              <div className="text-[10px] uppercase tracking-[0.28em] text-emrg-gold">{l.n}</div>
              <h3 className="mt-3 font-serif text-2xl text-emrg-ink">{l.name}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-emrg-mute">{l.body}</p>
              <ul className="mt-5 space-y-2 border-t border-emrg-edge pt-5 text-[12px] text-emrg-ink">
                {l.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-emrg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link href={l.to} className="mt-7 inline-flex items-center gap-1.5 text-[12px] tracking-wide text-emrg-cream transition hover:gap-2.5">
                {l.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
