const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

const NAV = [
  { label: 'Platform', href: '#platform' },
  { label: 'Distribution', href: '#distribution' },
  { label: 'Intelligence', href: '#intelligence' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: `${PORTAL}/docs`, external: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-sov-edge/60 bg-sov-bg/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="leading-tight">
          <span className="block text-[10px] tracking-[0.35em] text-sov-mute">SOVEREIGN</span>
          <span className="wordmark block text-sm font-semibold">AI MEDIA &amp; ACQUISITION</span>
        </a>
        <nav className="hidden items-center gap-6 text-xs text-sov-mute md:flex">
          {NAV.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noreferrer' : undefined}
              className="transition hover:text-sov-cyan"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href={PORTAL}
          className="rounded border border-sov-cyan/50 px-3 py-1.5 text-xs text-sov-cyan transition hover:bg-sov-cyan/10"
        >
          Developer Console
        </a>
      </div>
    </header>
  );
}
