'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { SiteHeader } from '../../components/SiteHeader';

type PillarKey = 'cinematic' | 'orchestration' | 'distribution' | 'intelligence';

interface PillarDef {
  key: PillarKey;
  name: string;
  body: string;
  cta: string;
  fields: Array<{ name: string; label: string; type: 'text' | 'textarea'; placeholder?: string }>;
  run: (vals: Record<string, string>) => Promise<string>;
}

const PILLARS: PillarDef[] = [
  {
    key: 'cinematic',
    name: 'Cinematic Generation',
    body: 'Compose a film, image, audio, or editorial brief — Emergency AI returns a structured outline you can route to production.',
    cta: 'Draft a brief',
    fields: [
      { name: 'title', label: 'Working title', type: 'text', placeholder: 'A national infrastructure documentary' },
      { name: 'angle', label: 'Editorial angle', type: 'textarea', placeholder: 'What story should this piece tell?' },
    ],
    run: async (v) => `Brief locked. Title: "${v.title || 'Untitled'}" · Angle: ${v.angle || '(unspecified)'} · Production slot reserved.`,
  },
  {
    key: 'orchestration',
    name: 'Intelligent Orchestration',
    body: 'Stage a multi-channel campaign — describe the objective and Emergency AI plans the sequence.',
    cta: 'Plan a campaign',
    fields: [
      { name: 'objective', label: 'Campaign objective', type: 'textarea', placeholder: 'What outcome are you driving?' },
      { name: 'window', label: 'Window', type: 'text', placeholder: '14 days' },
    ],
    run: async (v) => `Campaign staged. Objective: ${v.objective || '(unspecified)'} · Window: ${v.window || '14 days'}.`,
  },
  {
    key: 'distribution',
    name: 'Strategic Distribution',
    body: 'Push a release through the sovereign distribution layer — name the asset and the target surfaces.',
    cta: 'Queue a release',
    fields: [
      { name: 'asset', label: 'Asset id or url', type: 'text' },
      { name: 'surfaces', label: 'Target surfaces', type: 'text', placeholder: 'press, broadcast, social' },
    ],
    run: async (v) => `Release queued. Asset: ${v.asset || '(none)'} · Surfaces: ${v.surfaces || 'all'}.`,
  },
  {
    key: 'intelligence',
    name: 'Operational Intelligence',
    body: 'Ask the intelligence layer a question — Emergency AI returns the signal, the trend, and the recommended action.',
    cta: 'Query the layer',
    fields: [
      { name: 'question', label: 'Question', type: 'textarea', placeholder: 'What signals are converging in EU energy this week?' },
    ],
    run: async (v) => `Query accepted: "${v.question || ''}". An executive briefing has been added to your queue.`,
  },
];

function Card({ p }: { p: PillarDef }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await p.run(vals);
      setOut(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6 transition hover:border-emrg-dim/60" style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.6)' }}>
      <h3 className="font-serif text-[22px] font-medium leading-tight text-emrg-ink">{p.name}</h3>
      <p className="mt-3 text-[13px] leading-relaxed text-emrg-mute">{p.body}</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-6 inline-flex items-center gap-2 rounded-md border border-emrg-edgeStrong px-4 py-2 text-[12px] text-emrg-ink transition hover:border-emrg-dim hover:text-emrg-cream">
          {p.cta} →
        </button>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          {p.fields.map((f) => (
            <label key={f.name} className="block">
              <span className="block text-[10px] tracking-[0.24em] text-emrg-mute">{f.label.toUpperCase()}</span>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={vals[f.name] || ''}
                  onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-emrg-edge bg-emrg-surface px-2.5 py-2 text-[13px] text-emrg-ink outline-none focus:border-emrg-dim"
                />
              ) : (
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={vals[f.name] || ''}
                  onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-emrg-edge bg-emrg-surface px-2.5 py-2 text-[13px] text-emrg-ink outline-none focus:border-emrg-dim"
                />
              )}
            </label>
          ))}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-emrg-gold px-4 py-2 text-[12px] font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream disabled:opacity-60"
            >
              {busy ? 'Running…' : 'Run'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setOut(null); setVals({}); }} className="text-[12px] text-emrg-mute hover:text-emrg-cream">Cancel</button>
          </div>
          {out && (
            <div className="mt-2 rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-[12px] text-emrg-ink">
              <span className="mr-2 text-[9px] tracking-[0.24em] text-emrg-gold">RESULT</span>
              {out}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default function ConsolePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-[11px] tracking-[0.28em] text-emrg-mute">LOADING CONSOLE…</div>
      </main>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div>
            <div className="text-[10px] tracking-[0.32em] text-emrg-gold">EVALUATION CONSOLE</div>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.0] text-emrg-ink sm:text-5xl">
              Operator workspace.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-emrg-mute">
              Exercise each of the four Emergency AI pillars. This is a scaffold for evaluation —
              actions are scoped to your session and produce structured responses you can inspect.
            </p>
          </div>
          <div className="rounded-md border border-emrg-edge bg-emrg-surface/60 px-4 py-3 text-[11px] text-emrg-ink">
            <div className="text-[9px] tracking-[0.24em] text-emrg-mute">SIGNED IN</div>
            <div className="mt-1 truncate">{user.email}</div>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {PILLARS.map((p) => <Card key={p.key} p={p} />)}
        </div>
      </main>
    </>
  );
}
