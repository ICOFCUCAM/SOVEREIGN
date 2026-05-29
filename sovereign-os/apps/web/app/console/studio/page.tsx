'use client';
import { useEffect, useState } from 'react';
import { useMemo } from 'react';
import { Film, Sparkles, Loader2, RefreshCw, Megaphone, Smartphone, Square, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { ConsoleShell } from '../../../components/ConsoleShell';
import { JobRow } from '../../../components/JobRow';

interface JobLikeProps { id: string; kind: string; status: string; provider: string | null; title: string | null; result_url: string | null; error: string | null; created_at: string }

const FILTERS: Array<{ id: string; label: string; match: (j: JobLikeProps) => boolean }> = [
  { id: 'all',       label: 'All',       match: () => true },
  { id: 'film',      label: 'Films',     match: (j) => j.kind === 'film' },
  { id: 'video',     label: 'Videos',    match: (j) => j.kind === 'video' },
  { id: 'social',    label: 'Posts',     match: (j) => j.kind === 'social' },
  { id: 'narration', label: 'Narration', match: (j) => j.kind === 'narration' },
];

function RecentJobs({ jobs, onRefresh }: { jobs: JobLikeProps[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    return jobs.filter(f.match);
  }, [filter, jobs]);
  return (
    <>
      <div className="mt-10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-[0.24em] text-emrg-mute">Recent jobs</div>
          <div className="ml-2 flex flex-wrap gap-1">
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider transition ${active ? 'border-emrg-dim bg-emrg-surface text-emrg-cream' : 'border-emrg-edge text-emrg-mute hover:border-emrg-edgeStrong hover:text-emrg-ink'}`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded border border-emrg-edge px-2.5 py-1 text-[10px] uppercase tracking-wider text-emrg-mute transition hover:border-emrg-dim hover:text-emrg-cream"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-emrg-edge bg-emrg-panel/40">
        {filtered.map((j) => <JobRow key={j.id} job={j} />)}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-emrg-mute">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {jobs.length === 0 ? 'No pipeline runs yet.' : 'No jobs match this filter.'}
          </div>
        )}
      </div>
    </>
  );
}

interface PipelineJob {
  id: string; kind: string; status: string; provider: string | null;
  title: string | null; result_url: string | null; error: string | null;
  created_at: string;
}

type Format = 'short_ad' | 'long_film' | 'social_vertical' | 'social_square' | 'custom';

const FORMATS: Array<{ id: Format; label: string; sub: string; aspect: string; duration: number; icon: any }> = [
  { id: 'short_ad',        label: 'Short ad',          sub: '5–10s · 16:9 widescreen',   aspect: '1280:720', duration: 10, icon: Megaphone },
  { id: 'social_vertical', label: 'Reels / Shorts',    sub: '10s · 9:16 vertical',       aspect: '720:1280', duration: 10, icon: Smartphone },
  { id: 'social_square',   label: 'Square post',       sub: '10s · 1:1 feed',            aspect: '960:960',  duration: 10, icon: Square },
  { id: 'long_film',       label: 'Long film',         sub: 'Multi-scene · narration',   aspect: '1280:720', duration: 10, icon: Film },
  { id: 'custom',          label: 'Custom',            sub: 'Operator-defined',          aspect: '1280:720', duration: 10, icon: Sliders },
];

const CHANNELS: Array<{ id: string; label: string; live: boolean }> = [
  { id: 'linkedin',  label: 'LinkedIn',  live: true },
  { id: 'youtube',   label: 'YouTube',   live: true },
  { id: 'x',         label: 'X',         live: true },
  { id: 'instagram', label: 'Instagram', live: false },
  { id: 'tiktok',    label: 'TikTok',    live: false },
];

export default function StudioPage() {
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  // Long-film orchestration state.
  const [filmBrief, setFilmBrief] = useState('');
  const [filmScenes, setFilmScenes] = useState(4);
  const [sceneSeeds, setSceneSeeds] = useState<string[]>([]);
  const [sceneUploading, setSceneUploading] = useState<number | null>(null);

  // Single render state.
  const [format, setFormat] = useState<Format>('short_ad');
  const [customAspect, setCustomAspect] = useState('1280:720');
  const [customDuration, setCustomDuration] = useState(10);
  const [filmTitle, setFilmTitle] = useState('');
  const [filmScript, setFilmScript] = useState('');
  const [filmSeed, setFilmSeed] = useState('');

  // Multi-channel publish state.
  const [publishChannels, setPublishChannels] = useState<string[]>(['linkedin']);
  const [pubTitle, setPubTitle] = useState('');
  const [pubBody, setPubBody] = useState('');
  const [pubMediaUrl, setPubMediaUrl] = useState('');

  const refreshJobs = async () => {
    const { data } = await supabase
      .from('pipeline_jobs')
      .select('id, kind, status, provider, title, result_url, error, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setJobs((data || []) as PipelineJob[]);
  };

  useEffect(() => { refreshJobs(); }, []);

  async function uploadSeed(prefix: string, file: File) {
    const ext = file.name.split('.').pop() || 'png';
    const path = `video-seed/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('ecosystem').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (error) throw error;
    return supabase.storage.from('ecosystem').getPublicUrl(path).data.publicUrl;
  }

  async function uploadFilmSeed(file: File) {
    setBusy('seed-upload');
    try {
      const url = await uploadSeed('upload', file);
      setFilmSeed(url);
      toast.success('Seed image uploaded — it will drive the render');
    } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); }
    setBusy(null);
  }

  async function uploadSceneSeed(i: number, file: File) {
    setSceneUploading(i);
    try {
      const url = await uploadSeed(`scene-${i}`, file);
      setSceneSeeds((prev) => { const next = [...prev]; next[i] = url; return next; });
      toast.success(`Scene ${i + 1} image set`);
    } catch (e) { toast.error(`Upload failed: ${(e as Error).message}`); }
    setSceneUploading(null);
  }

  async function produceFilm() {
    if (!filmBrief.trim()) { toast.error('Describe the film to produce'); return; }
    setBusy('produce');
    try {
      const seedImages = Array.from({ length: filmScenes }, (_, i) => sceneSeeds[i] || '');
      const { data, error } = await supabase.functions.invoke('orchestrate-film', { body: { brief: filmBrief.trim(), scenes: filmScenes, seedImages } });
      if (error) throw error;
      if (data?.error) toast(data.error);
      else toast.success(`Producing "${data.title}" — ${data.scene_count} scenes rendering, narration ready`);
      setFilmBrief(''); setSceneSeeds([]);
      refreshJobs();
    } catch (e) { toast.error(`Production failed: ${(e as Error).message}`); }
    setBusy(null);
  }

  async function renderClip() {
    if (!filmScript.trim()) { toast.error('Add a script / motion description'); return; }
    setBusy('render');
    try {
      const fmt = FORMATS.find((f) => f.id === format)!;
      const aspectRatio = format === 'custom' ? customAspect : fmt.aspect;
      const duration = format === 'custom' ? customDuration : fmt.duration;
      const { data, error } = await supabase.functions.invoke('render-video', {
        body: {
          script: filmScript.trim(),
          title: filmTitle.trim() || `Untitled ${fmt.label.toLowerCase()}`,
          mediaClass: format,
          format,
          aspectRatio,
          duration,
          promptImage: filmSeed.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) toast(data.error + (data.detail ? ` — ${data.detail}` : ''));
      else toast.success(`Render submitted — ${fmt.label} (${aspectRatio}, ${duration}s)`);
      setFilmTitle(''); setFilmScript(''); setFilmSeed('');
      refreshJobs();
    } catch (e) { toast.error(`Render failed: ${(e as Error).message}`); }
    setBusy(null);
  }

  async function publishMulti() {
    if (!pubTitle.trim() && !pubBody.trim()) { toast.error('Title or body required'); return; }
    if (publishChannels.length === 0) { toast.error('Pick at least one channel'); return; }
    setBusy('publish');
    try {
      const { data: campaign, error: cErr } = await supabase
        .from('campaigns')
        .insert({
          title: pubTitle.trim() || null,
          name: pubTitle.trim() || null,
          body: pubBody.trim() || null,
          media_url: pubMediaUrl.trim() || null,
          channel: publishChannels[0],
          channels: publishChannels,
          status: 'publishing',
        })
        .select('id')
        .single();
      if (cErr) throw cErr;

      const { data, error } = await supabase.functions.invoke('post-campaign', {
        body: { campaign_id: campaign!.id, channels: publishChannels },
      });
      if (error) throw error;
      const results = (data?.results || []) as Array<{ channel: string; status: string; error?: string }>;
      const ok = results.filter((r) => r.status === 'done').map((r) => r.channel);
      const failed = results.filter((r) => r.status === 'failed');
      if (ok.length) toast.success(`Published to ${ok.join(', ')}`);
      failed.forEach((r) => toast.error(`${r.channel}: ${r.error || 'failed'}`));
      setPubTitle(''); setPubBody(''); setPubMediaUrl('');
      refreshJobs();
    } catch (e) { toast.error(`Publish failed: ${(e as Error).message}`); }
    setBusy(null);
  }

  function toggleChannel(id: string) {
    setPublishChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  const activeFormat = FORMATS.find((f) => f.id === format)!;

  return (
    <ConsoleShell>
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">STUDIO</div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
          Production pipeline.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emrg-mute">
          Produce any kind of video — short ads, social cuts, long films — and publish across LinkedIn, YouTube, and X from one queue.
        </p>
      </div>

      {/* Long film orchestrator */}
      <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-emrg-gold">
          <Film className="h-3.5 w-3.5" /> Produce long film — script → N scenes → per-scene image → Runway clips → stitched
        </div>
        <textarea
          rows={3}
          value={filmBrief}
          onChange={(e) => setFilmBrief(e.target.value)}
          placeholder="The story / script. Claude breaks it into scenes, gpt-image-1 frames each (or use your own per scene), Runway animates each, TTS narrates, and the ffmpeg worker stitches them into one long film."
          className="w-full resize-none rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
        />
        <div className="mt-3 flex items-center gap-3">
          <label className="text-[11px] uppercase tracking-[0.22em] text-emrg-mute">Scenes</label>
          <select
            value={filmScenes}
            onChange={(e) => setFilmScenes(Number(e.target.value))}
            className="rounded-md border border-emrg-edge bg-emrg-surface px-2.5 py-1.5 text-sm text-emrg-ink outline-none focus:border-emrg-dim"
          >
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} scenes · ~{n * 5}s</option>)}
          </select>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: filmScenes }, (_, i) => (
            <div key={i} className="rounded-md border border-emrg-edge bg-emrg-surface p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-emrg-mute">Scene {i + 1}</span>
                <label className={`cursor-pointer text-[9px] uppercase tracking-wider ${sceneUploading === i ? 'text-emrg-mute' : 'text-emrg-cream hover:text-emrg-gold'}`}>
                  {sceneUploading === i ? '…' : sceneSeeds[i] ? 'replace' : 'add image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSceneSeed(i, f); }} />
                </label>
              </div>
              {sceneSeeds[i]
                ? <img src={sceneSeeds[i]} alt="" loading="lazy" className="h-14 w-full rounded object-cover" />
                : <div className="flex h-14 w-full items-center justify-center rounded bg-emrg-bg/60 px-1 text-center text-[8px] text-emrg-mute">auto-generated</div>}
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={produceFilm}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-emrg-gold px-4 py-2 text-[12px] font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream disabled:opacity-50"
          style={{ boxShadow: '0 10px 30px -10px rgba(212,168,106,0.5)' }}
        >
          <Sparkles className="h-3.5 w-3.5" /> {busy === 'produce' ? 'Producing…' : 'Produce film'}
        </button>
        <p className="mt-2 text-[10px] text-emrg-mute">Clips render async; once all scenes finish, the film auto-stitches if the ffmpeg worker is configured.</p>
      </div>

      {/* Single-clip render with format selector */}
      <div className="mt-6 rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-emrg-gold">
          <Film className="h-3.5 w-3.5" /> Render a single clip — pick a format
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            const active = format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={`rounded-lg border px-3 py-3 text-left transition ${active ? 'border-emrg-dim bg-emrg-surface' : 'border-emrg-edge bg-emrg-surface/50 hover:border-emrg-edgeStrong'}`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-emrg-cream' : 'text-emrg-mute'}`} />
                <div className={`mt-2 text-[12px] font-medium ${active ? 'text-emrg-cream' : 'text-emrg-ink'}`}>{f.label}</div>
                <div className="mt-0.5 text-[10px] text-emrg-mute">{f.sub}</div>
              </button>
            );
          })}
        </div>

        {format === 'custom' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-emrg-mute">Aspect ratio</span>
              <input
                value={customAspect}
                onChange={(e) => setCustomAspect(e.target.value)}
                placeholder="1280:720"
                className="mt-1.5 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 font-mono text-xs text-emrg-ink outline-none focus:border-emrg-dim"
              />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.22em] text-emrg-mute">Duration (seconds)</span>
              <select
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                className="mt-1.5 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink outline-none focus:border-emrg-dim"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </label>
          </div>
        )}

        <input
          value={filmTitle}
          onChange={(e) => setFilmTitle(e.target.value)}
          placeholder={`${activeFormat.label} title`}
          className="mt-4 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
        />
        <textarea
          rows={3}
          value={filmScript}
          onChange={(e) => setFilmScript(e.target.value)}
          placeholder="Script / motion description for the render…"
          className="mt-2 w-full resize-none rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
        />
        <div className="mt-2 flex gap-2">
          <input
            value={filmSeed}
            onChange={(e) => setFilmSeed(e.target.value)}
            placeholder="Seed image URL — paste, upload, or leave blank to auto-generate"
            className="min-w-0 flex-1 rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 font-mono text-xs text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
          />
          <label className={`shrink-0 cursor-pointer rounded-md border border-emrg-edgeStrong px-3 py-2 text-xs font-medium text-emrg-ink ${busy === 'seed-upload' ? 'opacity-50' : 'hover:border-emrg-dim hover:text-emrg-cream'}`}>
            {busy === 'seed-upload' ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFilmSeed(f); }} />
          </label>
        </div>
        {filmSeed && <img src={filmSeed} alt="" loading="lazy" decoding="async" className="mt-2 h-24 w-full rounded-md border border-emrg-edge object-cover" />}
        <button
          type="button"
          disabled={busy !== null}
          onClick={renderClip}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-emrg-gold px-4 py-2 text-[12px] font-medium text-emrg-bg transition hover:-translate-y-0.5 hover:bg-emrg-cream disabled:opacity-50"
          style={{ boxShadow: '0 10px 30px -10px rgba(212,168,106,0.5)' }}
        >
          <Film className="h-3.5 w-3.5" /> {busy === 'render' ? 'Submitting…' : `Render ${activeFormat.label.toLowerCase()}`}
        </button>
      </div>

      {/* Multi-channel publish */}
      <div className="mt-6 rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-emrg-gold">
          <Megaphone className="h-3.5 w-3.5" /> Publish to multiple channels — one campaign, parallel fan-out
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CHANNELS.map((c) => {
            const active = publishChannels.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleChannel(c.id)}
                className={`relative rounded-lg border px-3 py-3 text-left transition ${active ? 'border-emrg-dim bg-emrg-surface' : 'border-emrg-edge bg-emrg-surface/50 hover:border-emrg-edgeStrong'}`}
              >
                <div className={`text-[12px] font-medium ${active ? 'text-emrg-cream' : 'text-emrg-ink'}`}>{c.label}</div>
                <div className={`mt-1 text-[10px] ${c.live ? 'text-emerald-300/70' : 'text-amber-300/60'}`}>
                  {c.live ? '● live publisher' : '○ token-gated'}
                </div>
              </button>
            );
          })}
        </div>
        <input
          value={pubTitle}
          onChange={(e) => setPubTitle(e.target.value)}
          placeholder="Post title"
          className="mt-4 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
        />
        <textarea
          rows={3}
          value={pubBody}
          onChange={(e) => setPubBody(e.target.value)}
          placeholder="Post body (LinkedIn full text · X auto-trimmed to 280 chars)"
          className="mt-2 w-full resize-none rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
        />
        <input
          value={pubMediaUrl}
          onChange={(e) => setPubMediaUrl(e.target.value)}
          placeholder="Media URL (required for YouTube — the rendered MP4 url from Recent jobs)"
          className="mt-2 w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 font-mono text-xs text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={publishMulti}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-emrg-edgeStrong bg-emrg-surface px-4 py-2 text-[12px] text-emrg-cream transition hover:border-emrg-dim disabled:opacity-50"
        >
          <Megaphone className="h-3.5 w-3.5" /> {busy === 'publish' ? 'Publishing…' : `Publish to ${publishChannels.length} channel${publishChannels.length === 1 ? '' : 's'}`}
        </button>
        <p className="mt-2 text-[10px] text-emrg-mute">
          Each channel runs in parallel as its own job. Required secrets: LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN, YOUTUBE_ACCESS_TOKEN, X_ACCESS_TOKEN. Instagram & TikTok require business-account credentials before they go live.
        </p>
      </div>

      {/* Recent jobs */}
      <RecentJobs jobs={jobs} onRefresh={refreshJobs} />
    </ConsoleShell>
  );
}
