'use client';

import { useEffect, useState } from 'react';
import { ALL_SCOPES } from '@sovereign/api-platform/scopes';
import { PLAN_CATALOG } from '@sovereign/api-platform/billing';
import { browserClient } from '../app/lib/supabase';

const PLANS = Object.entries(PLAN_CATALOG) as [string, { label: string; quotaPerMonth: number }][];

interface KeyRow {
  id: string;
  prefix: string;
  last4: string;
  scopes: string[] | null;
  status: string;
  last_used_at: string | null;
}

export function KeyManager() {
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [scopes, setScopes] = useState<string[]>(['publish']);
  const [plan, setPlan] = useState('free');
  const [issued, setIssued] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    const db = browserClient();
    if (!db) return setKeys([]);
    db.from('api_keys')
      .select('id, prefix, last4, scopes, status, last_used_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setKeys((data as KeyRow[]) ?? []));
  };
  useEffect(load, []);

  const toggle = (s: string) =>
    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const createKey = async () => {
    setBusy(true);
    setError('');
    setIssued(null);
    try {
      const r = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, owner_email: email, scopes, plan }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setIssued(body.key);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-sov-edge bg-sov-panel/50 p-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">CREATE API KEY</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name"
            className="rounded border border-sov-edge bg-sov-bg px-3 py-2 text-sm outline-none focus:border-sov-cyan" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@email.com"
            className="rounded border border-sov-edge bg-sov-bg px-3 py-2 text-sm outline-none focus:border-sov-cyan" />
        </div>
        <div className="mt-3">
          <label className="text-[11px] text-sov-mute">Plan (bounds quota + scopes)</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}
            className="mt-1 block w-full max-w-xs rounded border border-sov-edge bg-sov-bg px-3 py-2 text-sm outline-none focus:border-sov-cyan">
            {PLANS.map(([id, spec]) => (
              <option key={id} value={id}>{spec.label} — {spec.quotaPerMonth.toLocaleString()} calls/mo</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_SCOPES.map((s) => (
            <button key={s} onClick={() => toggle(s)} type="button"
              className={`rounded border px-2.5 py-1 text-[11px] ${scopes.includes(s) ? 'border-sov-teal text-sov-teal' : 'border-sov-edge text-sov-mute'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={createKey} disabled={busy || !name || !email}
          className="mt-4 rounded bg-sov-cyan/90 px-4 py-2 text-sm font-semibold text-sov-bg disabled:opacity-40">
          {busy ? 'Issuing…' : 'Issue key'}
        </button>
        {error ? <p className="mt-3 text-xs text-sov-rose">{error}</p> : null}
        {issued ? (
          <div className="mt-4 rounded border border-sov-teal/40 bg-sov-bg p-3">
            <p className="text-[11px] text-sov-mute">Copy this key now — it is shown only once.</p>
            <code className="mt-1 block break-all text-sm text-sov-teal">{issued}</code>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-sov-edge bg-sov-panel/50 p-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">YOUR KEYS</h2>
        {keys === null ? (
          <p className="py-4 text-xs text-sov-mute">loading…</p>
        ) : keys.length === 0 ? (
          <p className="py-4 text-xs text-sov-mute">no keys yet</p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded border border-sov-edge bg-sov-bg/40 px-3 py-2 text-xs">
                <span className="text-sov-cyan">{k.prefix}…{k.last4}</span>
                <span className="text-sov-mute">{(k.scopes ?? []).join(' ') || '—'}</span>
                <span className={k.status === 'active' ? 'text-sov-teal' : 'text-sov-rose'}>{k.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
