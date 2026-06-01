import Link from 'next/link';

const SOVEREIGN_URL = process.env.NEXT_PUBLIC_SOVEREIGN_URL ?? 'https://sovereigndo.com';
const DEVELOPER_PORTAL = process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? 'https://sovereigndo.com/developer';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: 'Platform',
    links: [
      { label: 'Studio', href: '/console/studio' },
      { label: 'Console', href: '/console' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Solutions', href: '/solutions' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Resources hub', href: '/resources' },
      { label: 'Developer API', href: DEVELOPER_PORTAL, external: true },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/company' },
      { label: 'Contact', href: 'mailto:hello@emergency.ai' },
      { label: 'Sovereign ↗', href: SOVEREIGN_URL, external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Security disclosure', href: 'mailto:security@emergency.ai' },
    ],
  },
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
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <BrandMark />
              <span className="leading-tight">
                <span className="block text-[13px] font-medium tracking-[0.18em] text-emrg-ink">EMERGENCY AI</span>
                <span className="block text-[9px] tracking-[0.32em] text-emrg-mute">BY SOVEREIGN</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[13px] leading-[1.7] text-emrg-mute">
              Strategic Intelligence Infrastructure for governments, institutions and enterprises. Publications routed through Sovereign Dispatch.
            </p>
            <p className="mt-4 max-w-sm text-[11px] uppercase tracking-[0.28em] text-emrg-mute/80">
              Sovereign by mandate · Continuously under audit · Engagement-scoped
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="text-[10px] uppercase tracking-[0.22em] text-emrg-gold">{col.title}</div>
                <ul className="mt-4 space-y-2.5 text-[13px]">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target={l.external ? '_blank' : undefined}
                        rel={l.external ? 'noreferrer' : undefined}
                        className="text-emrg-mute transition hover:text-emrg-cream"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-emrg-edge pt-6 text-[11px] tracking-[0.18em] text-emrg-mute">
          <span>© {year} Emergency AI. All rights reserved.</span>
          <span>Built on the SOVEREIGN platform.</span>
        </div>
      </div>
    </footer>
  );
}
