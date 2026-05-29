'use client';
import { useState } from 'react';
import { ExternalLink, ChevronRight } from 'lucide-react';

export interface JobLike {
  id: string;
  kind: string;
  status: string;
  provider: string | null;
  title: string | null;
  result_url: string | null;
  error: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  done:       'bg-emerald-500/15 text-emerald-300',
  processing: 'bg-cyan-500/15 text-cyan-300',
  failed:     'bg-rose-500/15 text-rose-300',
  queued:     'bg-amber-500/15 text-amber-300',
};

export function JobRow({ job }: { job: JobLike }) {
  const [open, setOpen] = useState(false);
  const isVideo = (job.result_url || '').match(/\.(mp4|webm|mov)$/i);
  const styles = STATUS_STYLES[job.status] || 'bg-amber-500/15 text-amber-300';
  return (
    <div className="border-b border-emrg-edge/40 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-emrg-surface/40"
      >
        <span className="w-20 shrink-0 rounded bg-emrg-surface px-2 py-0.5 text-center text-[9px] uppercase tracking-wider text-emrg-mute">{job.kind}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-emrg-ink">
            {job.title || '—'}
            {job.provider ? <span className="ml-2 font-mono text-xs text-emrg-mute">· {job.provider}</span> : null}
          </div>
          {job.error && <div className="truncate text-[10px] text-rose-300/70">{job.error}</div>}
        </div>
        {job.result_url && (
          <a
            href={job.result_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-wider text-emrg-gold hover:text-emrg-cream"
          >
            <ExternalLink className="h-3 w-3" /> Open
          </a>
        )}
        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase ${styles}`}>{job.status}</span>
        <span className="shrink-0 whitespace-nowrap font-mono text-xs text-emrg-mute">{new Date(job.created_at).toLocaleDateString()}</span>
        <ChevronRight className={`h-4 w-4 shrink-0 text-emrg-mute transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-emrg-edge/40 bg-emrg-bg/40 px-5 py-4">
          {isVideo && job.result_url ? (
            <video src={job.result_url} controls className="w-full max-w-2xl rounded-md border border-emrg-edge" />
          ) : job.result_url ? (
            <a href={job.result_url} target="_blank" rel="noreferrer" className="text-sm text-emrg-cream underline-offset-4 hover:underline">
              {job.result_url}
            </a>
          ) : (
            <div className="text-[12px] text-emrg-mute">No artefact attached yet.</div>
          )}
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-[12px] sm:grid-cols-[120px_1fr]">
            <dt className="text-emrg-mute">Job id</dt>
            <dd className="font-mono text-emrg-ink">{job.id}</dd>
            <dt className="text-emrg-mute">Created</dt>
            <dd className="text-emrg-ink">{new Date(job.created_at).toLocaleString()}</dd>
            {job.error && (
              <>
                <dt className="text-emrg-mute">Error</dt>
                <dd className="text-rose-300">{job.error}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
