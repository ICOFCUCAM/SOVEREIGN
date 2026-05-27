const ENDPOINTS = [
  { method: 'POST', path: '/functions/v1/orchestrate-film', scope: 'media:render', desc: 'Generate a multi-scene film from a brief + media class.' },
  { method: 'POST', path: '/functions/v1/render-video', scope: 'media:render', desc: 'Render a single clip (seed frame → Runway).' },
  { method: 'POST', path: '/functions/v1/post-campaign', scope: 'publish', desc: 'Publish a campaign to its channel.' },
  { method: 'POST', path: '/functions/v1/run-agent', scope: 'intelligence:run', desc: 'Run a strategic intelligence agent.' },
];

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-sov-cyan">API Reference</h1>
        <p className="mt-1 text-xs text-sov-mute">Authenticate every request with your key.</p>
      </div>

      <section className="rounded-lg border border-sov-edge bg-sov-panel/50 p-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">AUTHENTICATION</h2>
        <pre className="mt-3 overflow-auto rounded border border-sov-edge bg-sov-bg p-3 text-xs text-sov-teal">{`curl $SUPABASE_URL/functions/v1/run-agent \\
  -H "Authorization: Bearer sov_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "agent": "viral", "prompt": "forecast this launch" }'`}</pre>
        <p className="mt-2 text-[11px] text-sov-mute">
          Requests are validated by key hash, scope-checked, metered, and quota-enforced.
        </p>
      </section>

      <section className="rounded-lg border border-sov-edge bg-sov-panel/50 p-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">ENDPOINTS</h2>
        <div className="mt-3 space-y-1.5">
          {ENDPOINTS.map((e) => (
            <div key={e.path} className="rounded border border-sov-edge bg-sov-bg/40 px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span><span className="text-sov-teal">{e.method}</span> <span className="text-sov-cyan">{e.path}</span></span>
                <span className="text-sov-mute">scope: {e.scope}</span>
              </div>
              <p className="mt-1 text-sov-mute">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
