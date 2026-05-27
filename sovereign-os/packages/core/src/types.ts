// Shared domain types for the Sovereign platform.
// Extracted from the migrated Media Acquisition Ecosystem pipeline schema.

/** The unit of work flowing through every layer's pipeline. */
export type JobKind =
  | 'film'
  | 'video'
  | 'narration'
  | 'image'
  | 'content'
  | 'scenario'
  | 'campaign'
  | 'intelligence';

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

/** Mirrors the `pipeline_jobs` table that the media pipeline already writes to. */
export interface PipelineJob {
  id: string;
  kind: JobKind;
  status: JobStatus;
  provider?: string | null;
  title?: string | null;
  input?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  result_url?: string | null;
  error?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** The four content classes Layer 1 produces. */
export type MediaClass = 'cinematic' | 'operational' | 'strategic' | 'crisis';

/** Supported destinations for the Layer 2 Sovereign Distribution Grid. */
export type DistributionPlatform =
  | 'linkedin'
  | 'x'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'threads'
  | 'telegram'
  | 'whatsapp'
  | 'pinterest'
  | 'bluesky';

export interface Campaign {
  id: string;
  channel: DistributionPlatform | string;
  title?: string | null;
  body?: string | null;
  media_url?: string | null;
  status?: string | null;
  scheduled_at?: string | null;
  created_at?: string;
}
