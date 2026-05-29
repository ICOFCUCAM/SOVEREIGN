'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';

export function AuthMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <span className="hidden h-[34px] w-[88px] rounded-md border border-emrg-edge bg-emrg-surface/40 sm:inline-block" aria-hidden />;
  }

  if (!user) {
    return (
      <>
        <Link
          href="/sign-in"
          className="hidden rounded-md border border-emrg-edgeStrong px-4 py-2 text-[13px] text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href="/sign-in?mode=signup"
          className="inline-flex items-center gap-2 rounded-md bg-emrg-gold px-4 py-2 text-[13px] font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream"
          style={{ boxShadow: '0 10px 30px -10px rgba(212,168,106,0.5)' }}
        >
          Get Started
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </>
    );
  }

  const initial = (user.email || 'E').slice(0, 1).toUpperCase();
  return (
    <>
      <Link
        href="/console"
        className="hidden rounded-md border border-emrg-edgeStrong px-4 py-2 text-[13px] text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream sm:inline-flex"
      >
        Console
      </Link>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-emrg-edgeStrong bg-emrg-surface text-[12px] font-medium text-emrg-cream transition hover:border-emrg-dim"
        >
          {initial}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-emrg-edge bg-emrg-panel py-2 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.8)]">
              <div className="border-b border-emrg-edge/70 px-3 pb-2">
                <div className="truncate text-xs text-emrg-ink">{user.email}</div>
                <div className="mt-0.5 text-[10px] tracking-[0.22em] text-emrg-mute">EMERGENCY AI · OPERATOR</div>
              </div>
              <Link
                href="/console"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-[13px] text-emrg-ink transition hover:bg-emrg-surface hover:text-emrg-cream"
              >
                Open evaluation console
              </Link>
              <button
                onClick={async () => { await signOut(); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-[13px] text-emrg-mute transition hover:bg-emrg-surface hover:text-emrg-cream"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
