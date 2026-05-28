const PILLARS = [
  { t: 'Auditability', d: 'A verifiable record of every creative operation.' },
  { t: 'Ownership', d: 'Your media, your accounts, your distribution rights.' },
  { t: 'Deployment flexibility', d: 'Public, private and sovereign environments.' },
  { t: 'Enterprise controls', d: 'Access, governance and policy controls built in.' },
];

export function Trust() {
  return (
    <section id="trust" className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">ENTERPRISE</div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
            Engineered for <span className="wordmark">institutional scale.</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.t} className="rounded-xl border border-sov-edge bg-sov-panel/50 p-6">
              <div className="text-sm font-semibold text-sov-cyan">{p.t}</div>
              <p className="mt-3 text-sm leading-relaxed text-sov-mute">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
