'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

const TABS = [
  { href: '/console', label: 'Overview' },
  { href: '/console/studio', label: 'Studio' },
  { href: '/console/billing', label: 'Billing' },
  { href: '/account', label: 'Account' },
];

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-[11px] tracking-[0.28em] text-emrg-mute">LOADING CONSOLE…</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-emrg-edge/60 bg-emrg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
              <defs>
                <linearGradient id="csm-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#efd9b3" />
                  <stop offset="100%" stopColor="#d4a86a" />
                </linearGradient>
              </defs>
              <path d="M16 2 L28 16 L16 30 L4 16 Z" fill="none" stroke="url(#csm-fill)" strokeWidth="1.4" />
              <path d="M16 9 L22 16 L16 23 L10 16 Z" fill="url(#csm-fill)" opacity="0.85" />
            </svg>
            <span className="text-[12px] tracking-[0.22em] text-emrg-ink">EMERGENCY AI · CONSOLE</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-md px-3 py-1.5 text-[12px] transition ${active ? 'bg-emrg-surface text-emrg-cream' : 'text-emrg-mute hover:text-emrg-cream'}`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden truncate text-[11px] text-emrg-mute sm:inline">{user.email}</span>
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="rounded-md border border-emrg-edgeStrong px-3 py-1.5 text-[11px] text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-14">{children}</main>
    </div>
  );
}
