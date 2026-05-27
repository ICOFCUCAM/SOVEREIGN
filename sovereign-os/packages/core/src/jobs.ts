import type { SupabaseClient } from '@supabase/supabase-js';
import type { JobKind, JobStatus, PipelineJob } from './types.js';

// Thin orchestration seam over the `pipeline_jobs` queue table.
// Every layer (media render, distribution publish, intelligence run) enqueues
// and transitions work through this single helper so the job model stays uniform.

const TABLE = 'pipeline_jobs';

export async function enqueue(
  db: SupabaseClient,
  job: { kind: JobKind; title?: string; provider?: string; input?: Record<string, unknown> },
): Promise<PipelineJob> {
  const { data, error } = await db
    .from(TABLE)
    .insert({ ...job, status: 'queued' as JobStatus })
    .select('*')
    .single();
  if (error) throw new Error(`enqueue failed: ${error.message}`);
  return data as PipelineJob;
}

export async function transition(
  db: SupabaseClient,
  id: string,
  patch: { status: JobStatus; result_url?: string; result?: Record<string, unknown>; error?: string },
): Promise<void> {
  const { error } = await db
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`transition failed: ${error.message}`);
}

export async function claimNext(
  db: SupabaseClient,
  kind: JobKind,
  limit = 1,
): Promise<PipelineJob[]> {
  const { data, error } = await db
    .from(TABLE)
    .select('*')
    .eq('kind', kind)
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`claimNext failed: ${error.message}`);
  return (data ?? []) as PipelineJob[];
}
