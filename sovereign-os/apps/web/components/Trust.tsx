const PILLARS = [
  { t: 'Audited workflows',       d: 'A verifiable record of every creative operation.' },
  { t: 'Enterprise controls',     d: 'Access, governance and policy controls built in.' },
  { t: 'Deployment flexibility',  d: 'Public, private and sovereign environments.' },
  { t: 'Infrastructure ownership',d: 'Your media, your accounts, your distribution rights.' },
  { t: 'Operational continuity',  d: 'A sustained operating layer, not a per-call surface.' },
];

export function Trust() {
  return (
    <section id="trust" className="border-t border-sov-edge/30">
      <div className="mx-auto max-w-6xl px-6 py-36">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-[10px] tracking-[0.4em] text-sov-mute">ENTERPRISE</div>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.05] sm:text-5xl">
            Engineered for <span className="wordmark">institutional scale.</span>
          </h2>
        </div>
        <div className="mt-20 grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.t}>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-sov-teal">
                <span className="inline-block h-px w-6 bg-sov-teal/60" />
                ENTERPRISE
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[#e8f6fb]">{p.t}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-sov-mute">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
