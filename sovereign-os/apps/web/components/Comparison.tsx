const ROWS: Array<{ feature: string; sovereign: string; others: string }> = [
  { feature: 'API ownership',        sovereign: 'Owned end-to-end',                          others: 'Rented per-call' },
  { feature: 'Distribution',         sovereign: 'Native to 11 platforms',                    others: 'Generation only' },
  { feature: 'Intelligence agents',  sovereign: '7 strategic agents on every output',        others: 'Generic chat' },
  { feature: 'Pipeline integrity',   sovereign: 'Queued · audited · retried · rate-limited', others: 'Stateless calls' },
  { feature: 'Provenance',           sovereign: 'Watermark + chain-of-custody log',          others: 'None' },
  { feature: 'Governance',           sovereign: 'Sovereign jurisdiction, RLS-isolated',      others: 'Provider-side policy' },
  { feature: 'Pricing model',        sovereign: 'Institutional subscription',                others: 'Token-meter unpredictability' },
  { feature: 'Aesthetic intent',     sovereign: 'Cinematic · institutional by design',       others: 'Consumer · generic' },
];

export function Comparison() {
  return (
    <section id="why" className="border-t border-sov-edge/40 bg-sov-bg/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <div className="text-[11px] tracking-[0.3em] text-sov-mute">WHY IT SURPASSES</div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Built to outlast the per-call era.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-sov-mute">
            Generic AI APIs sell tokens. Emergency AI ships an owned, integrated pipeline — generation, distribution and intelligence as one civilizational layer.
          </p>
        </div>
        <div className="mt-12 overflow-hidden rounded-xl border border-sov-edge bg-sov-panel/40">
          <div className="grid grid-cols-[1.2fr_1.4fr_1fr] border-b border-sov-edge px-5 py-3 text-[10px] tracking-[0.3em] text-sov-mute">
            <span>CAPABILITY</span>
            <span className="text-sov-cyan">EMERGENCY AI</span>
            <span>LEADING AI APIs</span>
          </div>
          {ROWS.map((r, i) => (
            <div key={r.feature} className={`grid grid-cols-[1.2fr_1.4fr_1fr] items-center px-5 py-3.5 text-sm ${i % 2 ? 'bg-sov-panel/20' : ''}`}>
              <span className="text-[#cfe3ee]">{r.feature}</span>
              <span className="flex items-center gap-2 text-[#e8f6fb]">
                <span className="text-sov-teal">▸</span>
                {r.sovereign}
              </span>
              <span className="text-sov-mute">{r.others}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
