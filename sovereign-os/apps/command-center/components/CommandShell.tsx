const LAYERS = [
  { id: 'L1', label: 'Media Acquisition', status: 'OPERATIONAL' },
  { id: 'L2', label: 'Distribution Grid', status: 'SEAM' },
  { id: 'L3', label: 'Intelligence Engine', status: 'SEAM' },
];

export function CommandShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-sov-edge bg-sov-panel/60 p-5 lg:block">
        <div className="mb-8">
          <div className="text-xs tracking-[0.3em] text-sov-mute">SOVEREIGN</div>
          <div className="text-lg font-semibold text-sov-cyan">COMMAND CENTER</div>
        </div>
        <nav className="space-y-1 text-sm">
          {LAYERS.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded border border-transparent px-3 py-2 hover:border-sov-edge hover:bg-sov-bg/60">
              <span><span className="text-sov-mute">{l.id}</span> · {l.label}</span>
              <span className={l.status === 'OPERATIONAL' ? 'text-sov-teal' : 'text-sov-mute'}>{l.status === 'OPERATIONAL' ? '●' : '○'}</span>
            </div>
          ))}
        </nav>
        <div className="mt-10 text-[10px] leading-relaxed text-sov-mute">
          Phase 1 foundation. Layer 1 migrated and operational; Layers 2–3 typed seams.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-sov-edge bg-sov-panel/40 px-6 py-3">
          <div className="text-sm tracking-[0.2em] text-sov-mute">EXECUTIVE OPERATIONS</div>
          <div className="flex items-center gap-2 text-xs text-sov-teal">
            <span className="inline-block h-2 w-2 animate-pulseline rounded-full bg-sov-teal" />
            LIVE
          </div>
        </header>
        <main className="hud-grid flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
