const LAYERS = [
  {
    tag: 'LAYER 1',
    title: 'Media Acquisition',
    body: 'Cinematic, operational, strategic and crisis media — directed by AI, rendered through a Runway + image + narration pipeline, stitched by FFmpeg.',
    points: ['4 media classes', 'Film orchestration', 'FFmpeg assembly worker'],
  },
  {
    tag: 'LAYER 2',
    title: 'Sovereign Distribution Grid',
    body: 'One publish contract across 11 networks — LinkedIn, X, Instagram, Facebook, TikTok, YouTube, Threads, Telegram, WhatsApp, Pinterest, Bluesky.',
    points: ['11 platform adapters', 'AI scheduling + reposting', 'Per-client token vault'],
  },
  {
    tag: 'LAYER 3',
    title: 'Strategic Intelligence',
    body: 'Seven strategic agents — content, viral, competitor, brand-guardian, revenue, crisis and executive-briefing — running on the same metered API.',
    points: ['7 AI agents', 'Trend + viral forecasting', 'Executive briefings'],
  },
];

export function Layers() {
  return (
    <section id="platform" className="mx-auto max-w-6xl px-6 py-24">
      <div className="text-center">
        <div className="text-[11px] tracking-[0.3em] text-sov-mute">THREE SOVEREIGN LAYERS</div>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">One pipeline, end to end</h2>
      </div>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {LAYERS.map((l) => (
          <div key={l.tag} className="rounded-xl border border-sov-edge bg-sov-panel/50 p-6">
            <div className="text-[10px] tracking-[0.3em] text-sov-teal">{l.tag}</div>
            <h3 className="mt-2 text-xl font-semibold text-sov-cyan">{l.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-sov-mute">{l.body}</p>
            <ul className="mt-4 space-y-1.5 text-xs text-sov-mute">
              {l.points.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="inline-block h-1 w-1 rounded-full bg-sov-teal" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
