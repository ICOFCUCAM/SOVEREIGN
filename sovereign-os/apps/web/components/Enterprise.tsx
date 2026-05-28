function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" />
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
function IconStack() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3l9 5-9 5-9-5 9-5z" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5M3 17l9 5 9-5" strokeLinejoin="round" />
    </svg>
  );
}

const PILLARS = [
  { Icon: IconShield, t: 'Secure by design',    d: 'Enterprise-grade security at every layer.' },
  { Icon: IconLock,   t: 'Audit ready',         d: 'Full visibility and controlled access.' },
  { Icon: IconGlobe,  t: 'Sovereign by choice', d: 'Deploy in your region. Run under your rules.' },
  { Icon: IconStack,  t: 'Always on',           d: 'Reliable, resilient and built for continuity.' },
];

export function Enterprise() {
  return (
    <section id="enterprise" className="relative">
      <div className="mx-auto max-w-7xl px-6 pb-28 sm:pb-32">
        <div
          className="relative overflow-hidden rounded-2xl border border-emrg-edge bg-emrg-panel/70 p-10 sm:p-14"
          style={{ boxShadow: '0 30px 80px -40px rgba(0,0,0,0.7)' }}
        >
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:items-center lg:gap-16">
            <div>
              <div className="text-[10px] tracking-[0.32em] text-emrg-gold">ENTERPRISE GRADE</div>
              <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.0] text-emrg-ink sm:text-5xl">
                Built for trust.<br />Designed for scale.
              </h2>
            </div>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map(({ Icon, t, d }) => (
                <div key={t}>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emrg-edgeStrong bg-emrg-surface text-emrg-cream">
                    <Icon />
                  </div>
                  <h3 className="mt-4 text-[15px] font-medium text-emrg-ink">{t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
