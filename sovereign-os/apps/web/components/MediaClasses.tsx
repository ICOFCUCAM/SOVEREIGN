// Four media classes — what the production layer composes. Editorial is
// surfaced as a marketing construct for now (the orchestrator already drafts
// copy alongside film + narration; an editorial-only studio surface ships
// when the narrative pipeline is wired into the console).

const CLASSES = [
  {
    n: '01',
    name: 'Cinematic film',
    body: 'Scripts → scene plan → assembly → rendered video. Runway + image + narration, stitched by FFmpeg.',
    available: true,
  },
  {
    n: '02',
    name: 'Image',
    body: 'Editorial, campaign and product imagery on demand. Composable with film and editorial outputs.',
    available: true,
  },
  {
    n: '03',
    name: 'Narration',
    body: 'Voiceover synthesis for film, briefings, announcements and audio dispatches.',
    available: true,
  },
  {
    n: '04',
    name: 'Editorial',
    body: 'Dispatches, campaigns, scenarios and long-form copy — institutional voice, cinematic register.',
    available: true,
  },
];

export function MediaClasses() {
  return (
    <section id="media-classes" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">FOUR MEDIA CLASSES</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            Cinematic <span className="wordmark-cream italic">across every form.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-emrg-mute">
            One pipeline produces film, image, narration and editorial — composable across every output, identical sovereign voice end to end.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CLASSES.map((c) => (
            <div key={c.n} className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-[0.28em] text-emrg-gold">CLASS {c.n}</span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-300/70">Live</span>
              </div>
              <h3 className="mt-4 font-serif text-xl text-emrg-ink">{c.name}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-emrg-mute">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
