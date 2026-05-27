'use client';

import { useEffect, useState } from 'react';
import { browserClient } from '../app/lib/supabase';

const PROVIDERS = ['x', 'linkedin', 'facebook', 'pinterest', 'threads'] as const;

interface Connection {
  id: string;
  platform: string;
  external_account_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export function SocialConnections({ clientId }: { clientId: string }) {
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    const db = browserClient();
    if (!db || !clientId) return setConnections([]);
    db.from('social_connections')
      .select('id, platform, external_account_id, expires_at, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setConnections((data as Connection[]) ?? []));
  };
  useEffect(load, [clientId]);

  const connect = async (platform: string) => {
    setBusy(platform);
    setError('');
    try {
      const r = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, platform }),
      });
      const body = await r.json();
      if (!r.ok || !body.authorize_url) throw new Error(body.error ?? `HTTP ${r.status}`);
      window.open(body.authorize_url, '_blank', 'noopener');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const connected = new Set((connections ?? []).map((c) => c.platform));

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-sov-edge bg-sov-panel/50 p-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">CONNECT ACCOUNTS</h2>
        <p className="mt-1 text-[11px] text-sov-mute">
          Authorize a platform on this client&apos;s behalf. Tokens are encrypted at rest and never shown.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button key={p} onClick={() => connect(p)} disabled={!clientId || busy === p} type="button"
              className="flex items-center justify-between rounded border border-sov-edge bg-sov-bg/40 px-3 py-2 text-xs hover:border-sov-cyan disabled:opacity-40">
              <span>{p}</span>
              <span className={connected.has(p) ? 'text-sov-teal' : 'text-sov-mute'}>
                {busy === p ? '…' : connected.has(p) ? 'connected' : 'connect'}
              </span>
            </button>
          ))}
        </div>
        {!clientId ? <p className="mt-3 text-[11px] text-sov-mute">Provide a client id below to connect.</p> : null}
        {error ? <p className="mt-3 text-xs text-sov-rose">{error}</p> : null}
      </section>

      <section className="rounded-lg border border-sov-edge bg-sov-panel/50 p-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">CONNECTED</h2>
        {connections === null ? (
          <p className="py-4 text-xs text-sov-mute">loading…</p>
        ) : connections.length === 0 ? (
          <p className="py-4 text-xs text-sov-mute">no connected accounts</p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {connections.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded border border-sov-edge bg-sov-bg/40 px-3 py-2 text-xs">
                <span className="text-sov-cyan">{c.platform}</span>
                <span className="text-sov-mute">{c.external_account_id ?? '—'}</span>
                <span className="text-sov-mute">{c.expires_at ? `exp ${c.expires_at.slice(0, 10)}` : 'no expiry'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
