'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Film, CreditCard, ArrowRight, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { ConsoleShell } from '../../components/ConsoleShell';
import { UsageMeter } from '../../components/UsageMeter';
import { JobRow } from '../../components/JobRow';
import { planById } from '../../lib/plans';

interface JobSummary { id: string; kind: string; status: string; provider: string | null; title: string | null; created_at: string; result_url: string | null; error: string | null }
interface SubSummary { plan: string; status: string; current_period_end: string | null }

export default function ConsolePage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [sub, setSub] = useState<SubSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const [{ data: jobData }, { data: subData }, { count }] = await Promise.all([
        supabase.from('pipeline_jobs').select('id, kind, status, provider, title, created_at, result_url, error').order('created_at', { ascending: false }).limit(6),
        supabase.from('subscriptions').select('plan, status, current_period_end').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('pipeline_jobs').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
      ]);
      setJobs((jobData || []) as JobSummary[]);
      setSub((subData as SubSummary | null) || null);
      setMonthlyCount(count || 0);
    })();
  }, [user]);

  const stats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === 'processing' || j.status === 'queued').length,
    done: jobs.filter((j) => j.status === 'done').length,
  };

  const currentPlan = sub ? planById(sub.plan) : planById('evaluator')!;
  const planName = currentPlan?.name || sub?.plan || 'Evaluator';
  const quota = currentPlan?.monthlyJobQuota ?? null;

  return (
    <ConsoleShell>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[10px] tracking-[0.32em] text-emrg-gold">CONSOLE</div>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
            Operator workspace.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-emrg-mute">
            One platform: produce, distribute, analyze. Pick an action below to begin.
          </p>
        </div>
        <div className="rounded-md border border-emrg-edge bg-emrg-surface/60 px-4 py-3">
          <div className="text-[9px] tracking-[0.24em] text-emrg-mute">PLAN</div>
          <div className="mt-1 text-sm text-emrg-cream">{planName}</div>
          {sub?.current_period_end && (
            <div className="mt-0.5 text-[10px] text-emrg-mute">renews {new Date(sub.current_period_end).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Last 6 jobs', value: stats.total },
          { label: 'Active', value: stats.running },
          { label: 'Finished', value: stats.done },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-emrg-edge bg-emrg-panel/40 p-5">
            <div className="text-[9px] uppercase tracking-[0.24em] text-emrg-mute">{m.label}</div>
            <div className="mt-2 font-serif text-3xl text-emrg-ink">{m.value}</div>
          </div>
        ))}
        <UsageMeter used={monthlyCount} limit={quota} label="Jobs this month" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Link href="/console/studio" className="group rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-7 transition hover:-translate-y-0.5 hover:border-emrg-dim">
          <Film className="h-6 w-6 text-emrg-gold" />
          <h2 className="mt-5 font-serif text-2xl text-emrg-ink">Studio</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">
            Compose long films, render single scenes, and watch the queue in real time.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-emrg-cream transition group-hover:gap-2.5">
            Open studio <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
        <Link href="/console/billing" className="group rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-7 transition hover:-translate-y-0.5 hover:border-emrg-dim">
          <CreditCard className="h-6 w-6 text-emrg-gold" />
          <h2 className="mt-5 font-serif text-2xl text-emrg-ink">Billing</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-emrg-mute">
            Change tier, update payment details, or download invoices.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-emrg-cream transition group-hover:gap-2.5">
            Manage billing <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-emrg-mute">
          <Activity className="h-3.5 w-3.5" /> Recent activity
        </div>
        <div className="divide-y divide-emrg-edge/50 overflow-hidden rounded-2xl border border-emrg-edge bg-emrg-panel/40">
          {jobs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-emrg-mute">
              No activity yet. <Link href="/console/studio" className="text-emrg-cream underline-offset-4 hover:underline">Run your first production</Link>.
            </div>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-20 shrink-0 rounded bg-emrg-surface px-2 py-0.5 text-center text-[9px] uppercase tracking-wider text-emrg-mute">{j.kind}</span>
                <div className="min-w-0 flex-1 truncate text-sm text-emrg-ink">{j.title || '—'}</div>
                {j.result_url && <a href={j.result_url} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] uppercase tracking-wider text-emrg-gold hover:text-emrg-cream">Open</a>}
                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase ${j.status === 'done' ? 'bg-emerald-500/15 text-emerald-300' : j.status === 'processing' ? 'bg-cyan-500/15 text-cyan-300' : j.status === 'failed' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{j.status}</span>
                <span className="shrink-0 whitespace-nowrap font-mono text-xs text-emrg-mute">{new Date(j.created_at).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}
