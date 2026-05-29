'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';

function ResetForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/sign-in` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setSent(true);
      toast.success('Reset link sent — check your inbox');
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-[10px] tracking-[0.32em] text-emrg-mute transition hover:text-emrg-cream">
          ← EMERGENCY AI
        </Link>
        <h1 className="font-serif text-4xl font-medium text-emrg-ink sm:text-5xl">Reset password.</h1>
        <p className="mt-3 text-sm leading-relaxed text-emrg-mute">
          Enter your account email — we'll send a reset link.
        </p>
        {sent ? (
          <div className="mt-8 rounded-md border border-emerald-500/30 bg-emerald-900/15 p-4 text-sm text-emerald-200">
            If an account exists for <span className="font-medium">{email}</span>, the reset link is on its way.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="block text-[10px] tracking-[0.28em] text-emrg-mute">EMAIL</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2.5 text-sm text-emrg-ink outline-none focus:border-emrg-dim"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emrg-gold px-5 py-2.5 text-sm font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-[12px] text-emrg-mute">
          Remembered it? <Link href="/sign-in" className="text-emrg-cream underline-offset-4 hover:underline">Sign in</Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPage() {
  return <Suspense fallback={<main className="min-h-screen" />}><ResetForm /></Suspense>;
}
