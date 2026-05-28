const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';
const SOVEREIGN_URL = process.env.NEXT_PUBLIC_SOVEREIGN_URL ?? 'https://sovereign.so';
const REGISTRAR_URL = process.env.NEXT_PUBLIC_REGISTRAR_URL ?? 'https://domain.sovereign.so';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: 'Platform',
    links: [
      { label: 'Capabilities', href: '#platform' },
      { label: 'Operating layer', href: '#operating-layer' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Enterprise', href: '#trust' },
      { label: 'Questions', href: '#faq' },
    ],
  },
  {
    title: 'Access',
    links: [
      { label: 'Developer Console', href: PORTAL, external: true },
      { label: 'Docs', href: `${PORTAL}/docs`, external: true },
      { label: 'Contact sales', href: 'mailto:sales@sovereign.example?subject=Enterprise%20plan' },
    ],
  },
  {
    title: 'Sovereign',
    links: [
      { label: 'Sovereign Platform ↗', href: SOVEREIGN_URL, external: true },
      { label: 'Sovereign Domains ↗', href: REGISTRAR_URL, external: true },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-sov-edge/40 bg-sov-bg/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2">
            <div className="wordmark text-base font-semibold tracking-tight">EMERGENCY AI</div>
            <div className="mt-1 text-[10px] tracking-[0.3em] text-sov-mute">SOVEREIGN · MEDIA · INTELLIGENCE</div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-sov-mute">
              Cinematic media infrastructure for institutions, brands and sovereign systems.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] tracking-[0.3em] text-sov-mute">{col.title.toUpperCase()}</div>
              <ul className="mt-4 space-y-2 text-sm text-sov-mute">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.external ? '_blank' : undefined}
                      rel={l.external ? 'noreferrer' : undefined}
                      className="inline-flex items-center gap-1.5 transition hover:translate-x-0.5 hover:text-sov-cyan"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-sov-edge/40 pt-6 text-[11px] text-sov-mute sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Emergency AI · Sovereign media, distribution and intelligence — owned infrastructure.</span>
          <span className="inline-flex items-center gap-2 tracking-[0.2em]">
            <span className="inline-block h-1.5 w-1.5 animate-pulseline rounded-full bg-sov-teal" />
            OPERATIONAL
          </span>
        </div>
      </div>
    </footer>
  );
}
