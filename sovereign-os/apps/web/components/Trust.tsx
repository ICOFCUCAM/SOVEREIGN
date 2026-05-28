const TRUST = [
  { t: 'Provenance baked in',  d: 'Every artefact watermarked and chain-of-custody logged.' },
  { t: 'Audited operations',   d: 'Generation → distribution → intelligence — all in the audit log.' },
  { t: 'Owned pipeline',       d: 'No per-call middleman, no rented grid, no surprise quotas.' },
  { t: 'Owner-scoped tenancy', d: 'RLS-isolated by default at every layer of the stack.' },
  { t: 'Queued · retried',     d: 'Production-grade async pipeline with exponential backoff.' },
  { t: 'Sovereign jurisdiction', d: 'Routed via your chosen edge mesh and operational region.' },
];

export function Trust() {
  return (
    <section id="trust" className="border-t border-sov-edge/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">TRUST &amp; INTEGRITY</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Sovereign-grade by construction.</h2>
        </div>
        <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.t} className="rounded-xl border border-sov-edge bg-sov-panel/50 p-5">
              <div className="text-sm font-semibold text-sov-cyan">{t.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-sov-mute">{t.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
