import Link from 'next/link';
import { AuthMenu } from './AuthMenu';

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
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="leading-tight">
            <span className="block text-[15px] font-medium tracking-[0.18em] text-emrg-ink">EMERGENCY AI</span>
            <span className="block text-[10px] tracking-[0.32em] text-emrg-mute">BY SOVEREIGN</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-9 text-[13px] text-emrg-mute md:flex">
          {NAV.map((l) => (
            <a key={l.label} href={l.href} className="transition hover:text-emrg-cream">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
