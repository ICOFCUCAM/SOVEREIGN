const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL ?? '#';

const NAV = [
  { label: 'Platform', href: '#platform' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Resources', href: '#resources' },
  { label: 'Company', href: '#company' },
];

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <defs>
        <linearGradient id="bm-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#efd9b3" />
          <stop offset="100%" stopColor="#d4a86a" />
        </linearGradient>
      </defs>
      <path d="M16 2 L28 16 L16 30 L4 16 Z" fill="none" stroke="url(#bm-fill)" strokeWidth="1.4" />
      <path d="M16 9 L22 16 L16 23 L10 16 Z" fill="url(#bm-fill)" opacity="0.85" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-emrg-edge/60 bg-emrg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
        <a href="#top" className="flex items-center gap-3">
          <BrandMark />
          <span className="leading-tight">
            <span className="block text-[15px] font-medium tracking-[0.18em] text-emrg-ink">EMERGENCY AI</span>
            <span className="block text-[10px] tracking-[0.32em] text-emrg-mute">BY SOVEREIGN</span>
          </span>
        </a>
        <nav className="hidden items-center gap-9 text-[13px] text-emrg-mute md:flex">
          {NAV.map((l) => (
            <a key={l.label} href={l.href} className="transition hover:text-emrg-cream">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={PORTAL}
            className="hidden rounded-md border border-emrg-edgeStrong px-4 py-2 text-[13px] text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream sm:inline-flex"
          >
            Developer Console
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-md bg-emrg-gold px-4 py-2 text-[13px] font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream"
            style={{ boxShadow: '0 10px 30px -10px rgba(212,168,106,0.5)' }}
          >
            Get Started
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
