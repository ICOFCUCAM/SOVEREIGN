'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AuthMenu } from './AuthMenu';

const NAV = [
  { label: 'Capabilities', href: '/#capabilities' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
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
  const [open, setOpen] = useState(false);
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
            <Link key={l.label} href={l.href} className="transition hover:text-emrg-cream">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <AuthMenu />
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="rounded-md border border-emrg-edgeStrong p-2 text-emrg-ink transition hover:border-emrg-dim md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-emrg-edge/60 bg-emrg-bg/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <nav className="space-y-1">
              {NAV.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-emrg-ink transition hover:bg-emrg-surface hover:text-emrg-cream"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-emrg-edge pt-3">
              <AuthMenu />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
