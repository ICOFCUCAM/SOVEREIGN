const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-sov-edge/60 bg-sov-bg/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="leading-tight">
          <span className="block text-[10px] tracking-[0.35em] text-sov-mute">SOVEREIGN</span>
          <span className="wordmark block text-sm font-semibold">AI MEDIA &amp; ACQUISITION</span>
        </a>
        <nav className="flex items-center gap-6 text-xs text-sov-mute">
          <a href="#platform" className="hidden hover:text-sov-cyan sm:inline">Platform</a>
          <a href="#pricing" className="hover:text-sov-cyan">Pricing</a>
          <a href={`${PORTAL}/docs`} className="hidden hover:text-sov-cyan sm:inline">Docs</a>
          <a href={PORTAL} className="rounded border border-sov-cyan/50 px-3 py-1.5 text-sov-cyan hover:bg-sov-cyan/10">
            Developer Console
          </a>
        </nav>
      </div>
    </header>
  );
}
