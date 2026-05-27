'use client';

import { useEffect, useState } from 'react';
import { browserClient } from '../app/lib/supabase';

interface Row { metric: string; at: string }

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function UsageSummary() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    const db = browserClient();
    if (!db) {
      setConfigured(false);
      setRows([]);
      return;
    }
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    db.from('api_usage')
      .select('metric, at')
      .gte('at', since)
      .order('at', { ascending: false })
      .limit(5000)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  const byMetric: Record<string, number> = {};
  for (const r of rows ?? []) byMetric[r.metric] = (byMetric[r.metric] ?? 0) + 1;
  const total = (rows ?? []).length;
  const metrics = ['api_call', 'post', 'media_render', 'intelligence_run', 'comment'];

  return (
    <section className="rounded-lg border border-sov-edge bg-sov-panel/50 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-sov-cyan">USAGE · LAST 30 DAYS</h2>
        <span className="text-[10px] text-sov-mute">{configured ? `${total} calls` : 'dormant — no Supabase configured'}</span>
      </div>
      {rows === null ? (
        <p className="py-6 text-center text-xs text-sov-mute">loading…</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {metrics.map((m) => (
            <div key={m} className="rounded border border-sov-edge bg-sov-bg/40 p-3">
              <div className="text-2xl font-semibold text-sov-teal">{byMetric[m] ?? 0}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-sov-mute">{m.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
