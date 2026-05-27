'use client';

import { useEffect, useState } from 'react';
import { browserClient } from '../app/lib/supabase';
import { Panel } from './Panel';

interface KeyRow {
  id: string;
  prefix: string;
  last4: string;
  scopes: string[] | null;
  status: string;
  rate_limit_per_month: number;
  last_used_at: string | null;
}

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    const db = browserClient();
    if (!db) {
      setConfigured(false);
      setKeys([]);
      return;
    }
    db.from('api_keys')
      .select('id, prefix, last4, scopes, status, rate_limit_per_month, last_used_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setKeys((data as KeyRow[]) ?? []));
  }, []);

  return (
    <Panel title="API KEYS" hint="developer platform · issued to clients">
      {keys === null ? (
        <div className="py-6 text-center text-xs text-sov-mute">loading…</div>
      ) : keys.length === 0 ? (
        <div className="py-6 text-center text-xs text-sov-mute">
          {configured ? 'no keys issued — POST gateway/issue-key to mint one' : 'dormant — no Supabase project configured'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded border border-sov-edge bg-sov-bg/40 px-3 py-2 text-xs">
              <span className="font-mono text-sov-cyan">{k.prefix}…{k.last4}</span>
              <span className="text-sov-mute">{(k.scopes ?? []).join(' ') || '—'}</span>
              <span className={k.status === 'active' ? 'text-sov-teal' : 'text-sov-rose'}>{k.status}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
