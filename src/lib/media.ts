import { supabase } from '@/lib/supabase';

// ── Channel media access layer ─────────────────────────────────────────
// One typed surface for every page that shows films: the public Channel,
// the homepage teasers and the admin publisher. Rows come from
// public.media; generated renders land here via publishJobToChannel.

export type MediaClass = 'cinematic' | 'operational' | 'strategic' | 'crisis';
export type MediaKind = 'feature' | 'episode';

export interface MediaRow {
  id: string;
  media_class: MediaClass | string;
  kind: MediaKind | string;
  title: string;
  meta: string | null;
  length: string | null;
  youtube_id: string | null;
  video_url: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
  source_job_id: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
}

export interface PlayableMedia {
  title: string;
  meta: string;
  len: string;
  youtubeId?: string;
  videoUrl?: string;
  posterUrl?: string;
}

export interface ChannelMedia {
  feature?: PlayableMedia;
  episodes: PlayableMedia[];
}

/** True when the row carries a real playable asset (file or YouTube). */
export const hasAsset = (m: Pick<MediaRow, 'video_url' | 'youtube_id'>): boolean =>
  Boolean(m.video_url || m.youtube_id);

/** "165" → "2:45"; null-safe for rows that only carry a display length. */
export const formatDuration = (seconds: number | null | undefined, fallback?: string | null): string => {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return fallback || '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const toPlayable = (r: MediaRow): PlayableMedia => ({
  title: r.title,
  meta: r.meta || '',
  len: formatDuration(r.duration_seconds, r.length),
  youtubeId: r.youtube_id || undefined,
  videoUrl: r.video_url || undefined,
  posterUrl: r.poster_url || undefined,
});

/** Published media grouped by class — the shape the Channel renders. */
export async function fetchChannelMedia(): Promise<Record<string, ChannelMedia>> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error || !data) return {};
  const map: Record<string, ChannelMedia> = {};
  for (const r of data as MediaRow[]) {
    if (r.published === false) continue;
    const bucket = (map[r.media_class] ||= { episodes: [] });
    if (r.kind === 'feature' && !bucket.feature) bucket.feature = toPlayable(r);
    else if (r.kind !== 'feature') bucket.episodes.push(toPlayable(r));
  }
  return map;
}

/** Newest published row with a real video file — the homepage feature. */
export async function fetchLatestFilm(mediaClass?: MediaClass): Promise<MediaRow | null> {
  let q = supabase
    .from('media')
    .select('*')
    .not('video_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (mediaClass) q = q.eq('media_class', mediaClass);
  const { data } = await q.maybeSingle();
  return (data as MediaRow | null) ?? null;
}

/** Every published row with a playable asset, newest first — the film library. */
export async function fetchFilmLibrary(): Promise<MediaRow[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as MediaRow[]).filter((r) => r.published !== false && hasAsset(r));
}

export interface RenderingJob {
  id: string;
  kind: string;
  title: string | null;
  media_class: string | null;
  created_at: string;
}

/** Films currently moving through the render pipeline — the production feed. */
export async function fetchRenderingJobs(): Promise<RenderingJob[]> {
  const { data, error } = await supabase
    .from('pipeline_jobs')
    .select('id, kind, title, media_class, created_at')
    .in('kind', ['video', 'film'])
    .eq('status', 'processing')
    .order('created_at', { ascending: false })
    .limit(12);
  if (error || !data) return [];
  return data as RenderingJob[];
}

export interface PublishInput {
  jobId: string;
  title: string;
  videoUrl: string;
  mediaClass: MediaClass | string;
  kind?: MediaKind;
  meta?: string;
  posterUrl?: string;
  durationSeconds?: number;
}

/** Promote a finished pipeline render onto the public Channel. */
export async function publishJobToChannel(input: PublishInput): Promise<{ error?: string }> {
  // Re-publishing the same job updates the existing row instead of duplicating it.
  const { data: existing } = await supabase
    .from('media').select('id').eq('source_job_id', input.jobId).maybeSingle();
  const row = {
    media_class: input.mediaClass,
    kind: input.kind ?? 'episode',
    title: input.title,
    meta: input.meta ?? 'Generated production',
    video_url: input.videoUrl,
    poster_url: input.posterUrl ?? null,
    duration_seconds: input.durationSeconds ?? null,
    source_job_id: input.jobId,
    published: true,
  };
  const { error } = existing
    ? await supabase.from('media').update(row).eq('id', existing.id)
    : await supabase.from('media').insert(row);
  return error ? { error: error.message } : {};
}
