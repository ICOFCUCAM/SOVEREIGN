'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { ConsoleShell } from '../../components/ConsoleShell';

export default function AccountPage() {
  const { user } = useAuth();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success('Password updated');
      setPw('');
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  }

  async function resendVerification() {
    if (!user?.email) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) throw error;
      toast.success('Verification email sent — check your inbox');
    } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  }

  return (
    <ConsoleShell>
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">ACCOUNT</div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
          Settings.
        </h1>
      </div>

      <section className="rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6">
        <h2 className="font-serif text-2xl text-emrg-ink">Identity</h2>
        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-[160px_1fr]">
          <dt className="text-[10px] uppercase tracking-[0.22em] text-emrg-mute">Email</dt>
          <dd className="text-sm text-emrg-ink">{user?.email}</dd>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-emrg-mute">User id</dt>
          <dd className="font-mono text-xs text-emrg-mute">{user?.id}</dd>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-emrg-mute">Email verified</dt>
          <dd className="text-sm text-emrg-ink">
            {user?.email_confirmed_at ? (
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">verified</span>
            ) : (
              <button onClick={resendVerification} disabled={busy} className="rounded border border-emrg-edgeStrong px-2 py-0.5 text-[11px] text-emrg-cream hover:border-emrg-dim disabled:opacity-50">
                Resend verification
              </button>
            )}
          </dd>
        </dl>
      </section>

      <section className="mt-5 rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6">
        <h2 className="font-serif text-2xl text-emrg-ink">Change password</h2>
        <form onSubmit={changePassword} className="mt-5 flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[240px]">
            <span className="block text-[10px] uppercase tracking-[0.22em] text-emrg-mute">New password</span>
            <input
              type="password"
              minLength={8}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink outline-none focus:border-emrg-dim"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-emrg-gold px-4 py-2 text-[12px] font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </ConsoleShell>
  );
}
