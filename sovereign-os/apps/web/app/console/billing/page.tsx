'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth-context';
import { ConsoleShell } from '../../../components/ConsoleShell';
import { PLANS, planById, PlanId } from '../../../lib/plans';

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean;
}

function BillingInner() {
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const preselect = (search?.get('plan') || '') as PlanId | '';

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSub(data as Subscription | null);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (search?.get('success')) {
      toast.success('Subscription active. Welcome aboard.');
      router.replace('/console/billing');
    } else if (search?.get('canceled')) {
      toast('Checkout canceled. No changes were made.');
      router.replace('/console/billing');
    }
  }, [search, router]);

  async function startCheckout(planId: PlanId) {
    if (!user) { router.push('/sign-in'); return; }
    setBusy(planId);
    try {
      const { data, error } = await supabase.functions.invoke('subscription-checkout', {
        body: {
          plan: planId,
          user_id: user.id,
          email: user.email,
          return_url: typeof window !== 'undefined' ? window.location.origin + '/console/billing' : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error('Checkout did not return a URL');
    } catch (e) {
      toast.error(`Could not start checkout: ${(e as Error).message}`);
    }
    setBusy(null);
  }

  async function openPortal() {
    if (!user) return;
    setBusy('portal');
    try {
      const { data, error } = await supabase.functions.invoke('subscription-portal', {
        body: {
          user_id: user.id,
          return_url: typeof window !== 'undefined' ? window.location.origin + '/console/billing' : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) { window.location.href = data.url as string; return; }
      throw new Error('Portal did not return a URL');
    } catch (e) {
      toast.error(`Could not open billing portal: ${(e as Error).message}`);
    }
    setBusy(null);
  }

  const currentPlan = sub ? planById(sub.plan) : null;

  return (
    <>
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">BILLING</div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
          Subscription.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emrg-mute">
          Change tiers, update payment details, or cancel at any time.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-emrg-mute">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
        </div>
      ) : sub && sub.status !== 'canceled' ? (
        <div className="mb-12 rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-emrg-mute">Current plan</div>
              <div className="mt-2 flex items-center gap-3">
                <h2 className="font-serif text-3xl text-emrg-ink">{currentPlan?.name || sub.plan}</h2>
                <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${sub.status === 'active' || sub.status === 'trialing' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{sub.status}</span>
              </div>
              {sub.current_period_end && (
                <p className="mt-2 text-[12px] text-emrg-mute">
                  {sub.cancel_at_period_end ? 'Ends' : 'Renews'} {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={openPortal}
              disabled={busy !== null}
              className="rounded-md border border-emrg-edgeStrong px-5 py-2.5 text-sm text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream disabled:opacity-50"
            >
              {busy === 'portal' ? 'Opening portal…' : 'Manage billing'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = sub && sub.plan === p.id && sub.status !== 'canceled';
          const isPreselected = preselect === p.id;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-emrg-panel/60 p-6 ${isCurrent ? 'border-emrg-dim shadow-[0_30px_70px_-30px_rgba(212,168,106,0.4)]' : isPreselected ? 'border-emrg-edgeStrong' : 'border-emrg-edge'}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-emrg-gold px-3 py-1 text-[10px] tracking-[0.22em] text-emrg-bg">
                  <CheckCircle2 className="h-3 w-3" /> CURRENT
                </span>
              )}
              <div className="text-[10px] tracking-[0.32em] text-emrg-gold">{p.name.toUpperCase()}</div>
              <h3 className="mt-3 font-serif text-2xl text-emrg-ink">{p.name}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-emrg-mute">{p.tagline}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-serif text-4xl text-emrg-ink">${p.monthlyPrice.toLocaleString()}</span>
                <span className="text-xs text-emrg-mute">/ mo</span>
              </div>
              {p.monthlyPrice === 0 ? (
                <div className="mt-6 text-[12px] text-emrg-mute">Included with your account.</div>
              ) : isCurrent ? (
                <button
                  onClick={openPortal}
                  disabled={busy !== null}
                  className="mt-6 rounded-md border border-emrg-edgeStrong px-4 py-2 text-[12px] text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream"
                >
                  Manage
                </button>
              ) : (
                <button
                  onClick={() => startCheckout(p.id)}
                  disabled={busy !== null}
                  className={`mt-6 rounded-md px-4 py-2 text-[12px] font-medium transition ${p.highlight ? 'bg-emrg-gold text-emrg-bg hover:-translate-y-0.5 hover:bg-emrg-cream' : 'border border-emrg-edgeStrong text-emrg-ink hover:border-emrg-dim hover:text-emrg-cream'} disabled:opacity-50`}
                >
                  {busy === p.id ? 'Redirecting…' : sub && sub.status !== 'canceled' ? `Switch to ${p.name}` : `Choose ${p.name}`}
                </button>
              )}
              <ul className="mt-6 space-y-2 border-t border-emrg-edge pt-5 text-[12px] text-emrg-ink">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emrg-gold" />{f}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-[11px] text-emrg-mute">
        Payments processed by Stripe. <Link href="/legal/terms" className="text-emrg-ink hover:text-emrg-cream">Terms</Link> · <Link href="/legal/privacy" className="text-emrg-ink hover:text-emrg-cream">Privacy</Link>
      </p>
    </>
  );
}

export default function BillingPage() {
  return (
    <ConsoleShell>
      <Suspense fallback={<div className="text-sm text-emrg-mute">Loading…</div>}>
        <BillingInner />
      </Suspense>
    </ConsoleShell>
  );
}
