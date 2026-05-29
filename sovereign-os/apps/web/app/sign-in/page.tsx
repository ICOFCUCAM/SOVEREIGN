'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

type Mode = 'signin' | 'signup';

function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>(search?.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace('/console');
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setNotice('Check your inbox to confirm your address, then sign in.');
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/console');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 30%, rgba(212,168,106,0.08), transparent 70%)' }}
      />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-[10px] tracking-[0.32em] text-emrg-mute transition hover:text-emrg-cream">
          ← EMERGENCY AI
        </Link>
        <h1 className="font-serif text-4xl font-medium text-emrg-ink sm:text-5xl">
          {mode === 'signup' ? 'Request access.' : 'Sign in.'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-emrg-mute">
          {mode === 'signup'
            ? 'Create an Emergency AI operator account to evaluate the platform.'
            : 'Enter your operator credentials to open the evaluation console.'}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="block text-[10px] tracking-[0.28em] text-emrg-mute">EMAIL</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2.5 text-sm text-emrg-ink outline-none transition focus:border-emrg-dim"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] tracking-[0.28em] text-emrg-mute">PASSWORD</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2.5 text-sm text-emrg-ink outline-none transition focus:border-emrg-dim"
            />
          </label>

          {error && <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-xs text-red-200">{error}</div>}
          {notice && <div className="rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-xs text-emrg-ink">{notice}</div>}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emrg-gold px-5 py-2.5 text-sm font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream disabled:opacity-60"
            style={{ boxShadow: '0 14px 40px -12px rgba(212,168,106,0.55)' }}
          >
            {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-[12px] text-emrg-mute">
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="text-emrg-cream underline-offset-4 hover:underline">Sign in</button>
            </>
          ) : (
            <>New here?{' '}
              <button onClick={() => setMode('signup')} className="text-emrg-cream underline-offset-4 hover:underline">Request access</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <SignInForm />
    </Suspense>
  );
}
