export function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-sov-edge bg-sov-panel/50 shadow-hud">
      <div className="flex items-center justify-between border-b border-sov-edge px-4 py-2.5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">{title}</h2>
        {hint ? <span className="text-[10px] text-sov-mute">{hint}</span> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
