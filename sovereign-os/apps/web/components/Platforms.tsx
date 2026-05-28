const PLATFORMS = [
  'LinkedIn', 'X / Twitter', 'Instagram', 'Facebook', 'TikTok', 'YouTube',
  'Threads', 'Telegram', 'WhatsApp', 'Pinterest', 'Bluesky',
];

export function Platforms() {
  return (
    <section id="distribution" className="border-t border-sov-edge/40 bg-sov-bg/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">ELEVEN PLATFORMS</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">One command. Every surface.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-sov-mute">
            Schedule, post and orchestrate from a single sovereign API. Provenance preserved across every output.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {PLATFORMS.map((p, i) => (
            <div key={p} className="flex items-center gap-3 rounded-lg border border-sov-edge bg-sov-panel/40 px-4 py-3 transition hover:-translate-y-0.5 hover:border-sov-cyan/40">
              <span className="font-mono text-[10px] text-sov-teal">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm text-[#cfe3ee]">{p}</span>
              <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-sov-teal/70" />
            </div>
          ))}
        </div>
        <div className="mt-8 text-center text-[10px] tracking-[0.2em] text-sov-mute">
          PER-CLIENT TOKEN VAULT · AI SCHEDULING · CONTINUOUS REPOSTING · PROVENANCE PRESERVED
        </div>
      </div>
    </section>
  );
}
