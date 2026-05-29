// Eleven distribution surfaces — the operational grid. Live publishers ship
// against real platform APIs; ACTIVATING surfaces are wired into the studio
// chip selector but token-gated until institutional credentials land.
// Nothing here exposes fake functionality — every "ACTIVATING" channel
// returns a clean dormant error if invoked.

const SURFACES = [
  { n: '01', name: 'LinkedIn',  status: 'live' },
  { n: '02', name: 'X / Twitter', status: 'live' },
  { n: '03', name: 'YouTube',  status: 'live' },
  { n: '04', name: 'Instagram', status: 'activating' },
  { n: '05', name: 'Facebook',  status: 'activating' },
  { n: '06', name: 'TikTok',    status: 'activating' },
  { n: '07', name: 'Threads',   status: 'coming-online' },
  { n: '08', name: 'Telegram',  status: 'coming-online' },
  { n: '09', name: 'WhatsApp',  status: 'rolling-out' },
  { n: '10', name: 'Pinterest', status: 'rolling-out' },
  { n: '11', name: 'Bluesky',   status: 'rolling-out' },
] as const;

const STATUS_STYLES: Record<typeof SURFACES[number]['status'], { label: string; cls: string }> = {
  'live':           { label: 'LIVE',           cls: 'bg-emerald-500/15 text-emerald-300' },
  'activating':     { label: 'ACTIVATING',     cls: 'bg-amber-500/15 text-amber-300' },
  'coming-online':  { label: 'COMING ONLINE',  cls: 'bg-amber-500/10 text-amber-300/85' },
  'rolling-out':    { label: 'ROLLING OUT',    cls: 'bg-emrg-surface text-emrg-cream/80' },
};

export function DistributionGrid() {
  return (
    <section id="distribution" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">ELEVEN DISTRIBUTION SURFACES</div>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            One command. <span className="wordmark-cream italic">Every surface.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-emrg-mute">
            Schedule, post and orchestrate from a single sovereign API. Provenance preserved across every output.
          </p>
        </div>

        <div className="mt-12 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => {
            const style = STATUS_STYLES[s.status];
            return (
              <div key={s.n} className="flex items-center gap-4 rounded-xl border border-emrg-edge bg-emrg-panel/40 px-4 py-3">
                <span className="font-mono text-[11px] tracking-wider text-emrg-mute">{s.n}</span>
                <span className="flex-1 text-[14px] text-emrg-ink">{s.name}</span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${style.cls}`}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-[10px] uppercase tracking-[0.28em] text-emrg-mute">
          PER-CLIENT TOKEN VAULT · AI SCHEDULING · CONTINUOUS REPOSTING · PROVENANCE PRESERVED
        </div>
      </div>
    </section>
  );
}
