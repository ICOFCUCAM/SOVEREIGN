'use client';

import { useEffect, useState } from 'react';
import type { PipelineJob } from '@sovereign/core/types';
import { browserClient } from '../app/lib/supabase';
import { Panel } from './Panel';

const STATUS_COLOR: Record<string, string> = {
  queued: 'text-sov-mute',
  processing: 'text-sov-amber',
  done: 'text-sov-teal',
  failed: 'text-sov-rose',
};

export function PipelineMonitor() {
  const [jobs, setJobs] = useState<PipelineJob[] | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    const db = browserClient();
    if (!db) {
      setConfigured(false);
      setJobs([]);
      return;
    }
    let active = true;
    const load = async () => {
      const { data } = await db
        .from('pipeline_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);
      if (active) setJobs((data as PipelineJob[]) ?? []);
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Panel title="PIPELINE MONITOR" hint={configured ? 'pipeline_jobs · live 5s' : 'set NEXT_PUBLIC_SUPABASE_* to go live'}>
      {jobs === null ? (
        <div className="py-8 text-center text-xs text-sov-mute">querying pipeline…</div>
      ) : jobs.length === 0 ? (
        <div className="py-8 text-center text-xs text-sov-mute">
          {configured ? 'no jobs in the pipeline' : 'dormant — no Supabase project configured'}
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-sov-mute">
            <tr>
              <th className="pb-2">Kind</th>
              <th className="pb-2">Class</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">Provider</th>
              <th className="pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t border-sov-edge/50">
                <td className="py-2 text-sov-cyan">{j.kind}</td>
                <td className="py-2 text-sov-mute">{j.media_class ?? '—'}</td>
                <td className="py-2 max-w-[16rem] truncate">{j.title ?? '—'}</td>
                <td className="py-2 text-sov-mute">{j.provider ?? '—'}</td>
                <td className={`py-2 text-right ${STATUS_COLOR[j.status] ?? ''}`}>{j.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
