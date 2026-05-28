const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

// ─ Tiny iconic squircles for each card ──────────────────────────────────────
function IconFilm() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
    </svg>
  );
}
function IconRadar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

// ─ Visual flourishes underneath each card ──────────────────────────────────
function Viz({ kind }: { kind: 'wave' | 'burst' | 'arc' | 'bars' }) {
  if (kind === 'wave') {
    return (
      <svg viewBox="0 0 240 60" className="h-16 w-full" preserveAspectRatio="none">
        <defs><linearGradient id="vw" x1="0" x2="1"><stop offset="0%" stopColor="#9ad1ff" stopOpacity="0" /><stop offset="50%" stopColor="#9ad1ff" stopOpacity="0.9" /><stop offset="100%" stopColor="#9ad1ff" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 32 Q60 4 120 32 T240 32" fill="none" stroke="url(#vw)" strokeWidth="1.2" />
        <g fill="#9ad1ff">
          {Array.from({ length: 48 }).map((_, i) => {
            const x = (i / 47) * 240; const y = 32 + Math.sin((i / 47) * Math.PI * 2) * 18;
            return <circle key={i} cx={x} cy={y} r="0.9" opacity={0.3 + Math.random() * 0.5} />;
          })}
        </g>
      </svg>
    );
  }
  if (kind === 'burst') {
    return (
      <svg viewBox="0 0 240 60" className="h-16 w-full" preserveAspectRatio="none">
        <defs><radialGradient id="vb" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f6c074" stopOpacity="0.95" /><stop offset="100%" stopColor="#f6c074" stopOpacity="0" /></radialGradient></defs>
        <ellipse cx="120" cy="30" rx="100" ry="22" fill="url(#vb)" />
        <g fill="#f6c074">
          {Array.from({ length: 36 }).map((_, i) => {
            const x = 30 + (i / 35) * 180; const y = 30 + Math.sin((i / 35) * Math.PI * 4) * (8 + Math.random() * 6);
            return <circle key={i} cx={x} cy={y} r={0.8 + Math.random() * 0.6} opacity={0.4 + Math.random() * 0.5} />;
          })}
        </g>
      </svg>
    );
  }
  if (kind === 'arc') {
    return (
      <svg viewBox="0 0 240 60" className="h-16 w-full" preserveAspectRatio="none">
        <defs><linearGradient id="va" x1="0" x2="1"><stop offset="0%" stopColor="#b59cff" stopOpacity="0" /><stop offset="50%" stopColor="#b59cff" stopOpacity="0.9" /><stop offset="100%" stopColor="#b59cff" stopOpacity="0" /></linearGradient></defs>
        <path d="M10 50 Q120 -6 230 50" fill="none" stroke="url(#va)" strokeWidth="1.5" strokeDasharray="2 5" />
        <circle cx="230" cy="50" r="3" fill="#b59cff" />
      </svg>
    );
  }
  // bars
  return (
    <svg viewBox="0 0 240 60" className="h-16 w-full" preserveAspectRatio="none">
      <defs><linearGradient id="vbar" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7bd9c2" /><stop offset="100%" stopColor="#7bd9c2" stopOpacity="0.1" /></linearGradient></defs>
      {Array.from({ length: 18 }).map((_, i) => {
        const h = 8 + Math.abs(Math.sin(i * 0.45)) * 42 + (i / 18) * 10;
        return <rect key={i} x={6 + i * 13} y={60 - h} width="6" height={h} rx="1" fill="url(#vbar)" />;
      })}
    </svg>
  );
}

const PILLARS = [
  { Icon: IconFilm,  viz: 'wave'  as const, name: 'Cinematic Generation',     body: 'Produce film, image, audio and editorial content with cinematic precision.' },
  { Icon: IconGlobe, viz: 'burst' as const, name: 'Intelligent Orchestration', body: 'Coordinate campaigns across channels with AI-driven intelligence.' },
  { Icon: IconSend,  viz: 'arc'   as const, name: 'Strategic Distribution',    body: 'Reach every major platform through a unified sovereign distribution layer.' },
  { Icon: IconRadar, viz: 'bars'  as const, name: 'Operational Intelligence',  body: 'Gain real-time insight, predict trends and drive strategic outcomes.' },
];

export function Capabilities() {
  return (
    <section id="platform" className="relative">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-16">
          {/* Left intro */}
          <div className="max-w-xs">
            <div className="text-[10px] tracking-[0.32em] text-emrg-gold">CAPABILITIES</div>
            <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.0] text-emrg-ink sm:text-5xl">
              Four pillars.<br />One platform.
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-emrg-mute">
              Create, orchestrate, distribute and analyze with a unified intelligence layer built for the modern world.
            </p>
            <a href={`${PORTAL}/docs`} className="mt-7 inline-flex items-center gap-2 border-b border-emrg-dim/60 pb-1 text-[13px] text-emrg-ink transition hover:text-emrg-cream">
              Learn more about our platform
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Right: card grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ Icon, viz, name, body }) => (
              <div
                key={name}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6 pb-0 transition hover:-translate-y-1 hover:border-emrg-dim/60"
                style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.6)' }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emrg-edgeStrong bg-emrg-surface text-emrg-cream">
                  <Icon />
                </div>
                <h3 className="mt-5 font-serif text-[22px] font-medium leading-tight text-emrg-ink">{name}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-emrg-mute">{body}</p>
                <div className="mt-7 -mx-6 mt-auto pt-6">
                  <Viz kind={viz} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
