// Deno runtime mirror of @sovereign/core/jobs — uniform pipeline_jobs access for edge
// functions. Canonical typed source: packages/core/src/jobs.ts. Keep in sync.
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const TABLE = 'pipeline_jobs';

export type JobKind =
  | 'film' | 'video' | 'narration' | 'image' | 'content' | 'scenario' | 'campaign' | 'intelligence';
export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface NewJob {
  kind: JobKind;
  status?: JobStatus;
  title?: string;
  provider?: string;
  media_class?: string;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  result_url?: string;
  error?: string | null;
}

export async function insertJob(db: SupabaseClient, job: NewJob): Promise<string | undefined> {
  const { data } = await db
    .from(TABLE)
    .insert({ status: 'queued', ...job })
    .select('id')
    .single();
  return data?.id as string | undefined;
}

export async function transition(
  db: SupabaseClient,
  id: string,
  patch: { status: JobStatus; result_url?: string; result?: Record<string, unknown>; error?: string | null },
): Promise<void> {
  await db.from(TABLE).update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
}
