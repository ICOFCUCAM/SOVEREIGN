const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';
const SOVEREIGN_URL = process.env.NEXT_PUBLIC_SOVEREIGN_URL ?? 'https://sovereign.so';

const DEVELOPER_PORTAL = process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? 'https://sovereign.so/developer';
const NAV = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Console', href: '/console' },
  { label: 'Developer API', href: DEVELOPER_PORTAL, external: true },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Privacy', href: '/legal/privacy' },
];

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
      <defs>
        <linearGradient id="bm-foot" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#efd9b3" />
          <stop offset="100%" stopColor="#d4a86a" />
        </linearGradient>
      </defs>
      <path d="M16 2 L28 16 L16 30 L4 16 Z" fill="none" stroke="url(#bm-foot)" strokeWidth="1.4" />
      <path d="M16 9 L22 16 L16 23 L10 16 Z" fill="url(#bm-foot)" opacity="0.8" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-emrg-edge/70">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
        <a href="#top" className="flex items-center gap-3">
          <BrandMark />
          <span className="leading-tight">
            <span className="block text-[13px] font-medium tracking-[0.18em] text-emrg-ink">EMERGENCY AI</span>
            <span className="block text-[9px] tracking-[0.32em] text-emrg-mute">BY SOVEREIGN</span>
          </span>
        </a>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[13px] text-emrg-mute">
          {NAV.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={(l as { external?: boolean }).external ? '_blank' : undefined}
              rel={(l as { external?: boolean }).external ? 'noreferrer' : undefined}
              className="transition hover:text-emrg-cream"
            >
              {l.label}
            </a>
          ))}
          <a href={SOVEREIGN_URL} target="_blank" rel="noreferrer" className="transition hover:text-emrg-cream">
            Sovereign ↗
          </a>
        </nav>
        <div className="text-[11px] tracking-[0.18em] text-emrg-mute">
          © {year} Emergency AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
