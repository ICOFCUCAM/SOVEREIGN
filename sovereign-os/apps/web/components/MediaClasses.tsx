const CLASSES = [
  { tag: 'CLASS 01', name: 'Cinematic film', body: 'Scripts → scene plan → assembly → rendered video. Runway + image + narration, stitched by FFmpeg.' },
  { tag: 'CLASS 02', name: 'Image', body: 'Editorial, campaign and product imagery on demand. Composable with film and editorial outputs.' },
  { tag: 'CLASS 03', name: 'Narration', body: 'Voiceover synthesis for film, briefings, announcements and audio dispatches.' },
  { tag: 'CLASS 04', name: 'Editorial', body: 'Dispatches, campaigns, scenarios and long-form copy — institutional voice, cinematic register.' },
];

export function MediaClasses() {
  return (
    <section id="media" className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">FOUR MEDIA CLASSES</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Cinematic across every form.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-sov-mute">
            One pipeline produces film, image, narration and editorial — composable across every output, identical sovereign voice end-to-end.
          </p>
        </div>
        <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {CLASSES.map((c) => (
            <div key={c.tag} className="rounded-xl border border-sov-edge bg-sov-panel/50 p-6 transition hover:-translate-y-0.5 hover:border-sov-cyan/40">
              <div className="text-[10px] tracking-[0.3em] text-sov-teal">{c.tag}</div>
              <h3 className="mt-2 text-lg font-semibold text-sov-cyan">{c.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-sov-mute">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
