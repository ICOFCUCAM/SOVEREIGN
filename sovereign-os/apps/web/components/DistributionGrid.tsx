import { Reveal } from './Reveal';

const SURFACES = [
  { n: '01', name: 'LinkedIn',    status: 'live' },
  { n: '02', name: 'X / Twitter', status: 'live' },
  { n: '03', name: 'YouTube',     status: 'live' },
  { n: '04', name: 'Instagram',   status: 'activating' },
  { n: '05', name: 'Facebook',    status: 'activating' },
  { n: '06', name: 'TikTok',      status: 'activating' },
  { n: '07', name: 'Threads',     status: 'coming-online' },
  { n: '08', name: 'Telegram',    status: 'coming-online' },
  { n: '09', name: 'WhatsApp',    status: 'rolling-out' },
  { n: '10', name: 'Pinterest',   status: 'rolling-out' },
  { n: '11', name: 'Bluesky',     status: 'rolling-out' },
] as const;

const STATUS_STYLES: Record<typeof SURFACES[number]['status'], { label: string; cls: string }> = {
  'live':           { label: 'LIVE',           cls: 'bg-emerald-500/12 text-emerald-300' },
  'activating':     { label: 'ACTIVATING',     cls: 'bg-amber-500/12 text-amber-300' },
  'coming-online':  { label: 'COMING ONLINE',  cls: 'bg-amber-500/08 text-amber-300/80' },
  'rolling-out':    { label: 'ROLLING OUT',    cls: 'bg-emrg-surface text-emrg-cream/75' },
};

export function DistributionGrid() {
  const counts = {
    live: SURFACES.filter((s) => s.status === 'live').length,
    activating: SURFACES.filter((s) => s.status === 'activating').length,
    'coming-online': SURFACES.filter((s) => s.status === 'coming-online').length,
    'rolling-out': SURFACES.filter((s) => s.status === 'rolling-out').length,
  };

  return (
    <section id="distribution" className="relative border-t border-emrg-edge/60">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <Reveal>
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">DISTRIBUTION</div>
            <h2 className="mt-6 font-serif text-[36px] font-medium tracking-[-0.015em] leading-[1.05] text-emrg-ink sm:text-[44px]">
              Multi-channel distribution infrastructure.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-emrg-mute">
              One command. Every surface where your audience already is. The platform orchestrates release across the channels that matter, preserves provenance, and reports back per dispatch.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.28em] text-emrg-cream/70">
              <span>Orchestrated coverage</span>
              <span>Audited dispatch</span>
              <span>Sovereign jurisdiction</span>
            </div>
          </div>
        </Reveal>

        <div className="mb-8 flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.28em] text-emrg-mute">Coverage today</span>
          <span className="h-px flex-1 bg-emrg-edge/70" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => {
            const style = STATUS_STYLES[s.status];
            return (
              <div key={s.n} className="flex items-center gap-4 rounded-xl bg-emrg-panel/40 px-5 py-3.5">
                <span className="font-mono text-[12px] tracking-wider text-emrg-mute">{s.n}</span>
                <span className="flex-1 text-[15px] text-emrg-ink">{s.name}</span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] ${style.cls}`}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.28em] text-emrg-mute">
          <span className="text-emerald-300">{counts.live} LIVE</span>
          <span>·</span>
          <span className="text-amber-300">{counts.activating} ACTIVATING</span>
          <span>·</span>
          <span className="text-amber-300/80">{counts['coming-online']} COMING ONLINE</span>
          <span>·</span>
          <span className="text-emrg-cream/75">{counts['rolling-out']} ROLLING OUT</span>
        </div>
      </div>
    </section>
  );
}
