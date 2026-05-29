'use client';
import { useEffect, useState } from 'react';
import { Film, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { ConsoleShell } from '../../../components/ConsoleShell';

interface PipelineJob {
  id: string; kind: string; status: string; provider: string | null;
  title: string | null; result_url: string | null; error: string | null;
  created_at: string;
}

export default function StudioPage() {
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [filmBrief, setFilmBrief] = useState('');
  const [filmScenes, setFilmScenes] = useState(4);
  const [sceneSeeds, setSceneSeeds] = useState<string[]>([]);
  const [sceneUploading, setSceneUploading] = useState<number | null>(null);

  const [filmTitle, setFilmTitle] = useState('');
  const [filmScript, setFilmScript] = useState('');
  const [filmSeed, setFilmSeed] = useState('');

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
    } catch (e) {
      toast.error(`Upload failed: ${(e as Error).message}`);
    }
    setBusy(null);
  }

  async function uploadSceneSeed(i: number, file: File) {
    setSceneUploading(i);
    try {
      const url = await uploadSeed(`scene-${i}`, file);
      setSceneSeeds((prev) => { const next = [...prev]; next[i] = url; return next; });
      toast.success(`Scene ${i + 1} image set`);
    } catch (e) {
      toast.error(`Upload failed: ${(e as Error).message}`);
    }
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
    } catch (e) {
      toast.error(`Production failed: ${(e as Error).message}`);
    }
    setBusy(null);
  }

  async function renderFilm() {
    if (!filmScript.trim()) { toast.error('Add a script for the film'); return; }
    setBusy('film');
    try {
      const { data, error } = await supabase.functions.invoke('render-video', { body: { script: filmScript.trim(), title: filmTitle.trim() || 'Untitled film', mediaClass: 'cinematic', promptImage: filmSeed.trim() || undefined } });
      if (error) throw error;
      if (data?.error) toast(data.error + (data.detail ? ` — ${data.detail}` : ''));
      else toast.success('Render submitted — poller will finalize');
      setFilmTitle(''); setFilmScript(''); setFilmSeed('');
      refreshJobs();
    } catch (e) {
      toast.error(`Render failed: ${(e as Error).message}`);
    }
    setBusy(null);
  }

  return (
    <ConsoleShell>
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.32em] text-emrg-gold">STUDIO</div>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-emrg-ink sm:text-5xl">
          Production pipeline.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emrg-mute">
          Media & automation pipelines. Narration via OpenAI TTS, video via Runway. Every run is recorded below.
        </p>
      </div>

      {/* Produce long film */}
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

      {/* Render + triggers */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/60 p-6">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-emrg-gold">
            <Film className="h-3.5 w-3.5" /> Render film
          </div>
          <input
            value={filmTitle}
            onChange={(e) => setFilmTitle(e.target.value)}
            placeholder="Film title"
            className="w-full rounded-md border border-emrg-edge bg-emrg-surface px-3 py-2 text-sm text-emrg-ink placeholder:text-emrg-mute outline-none focus:border-emrg-dim"
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
            onClick={renderFilm}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-emrg-edgeStrong bg-emrg-surface px-4 py-2 text-[12px] text-emrg-cream transition hover:border-emrg-dim disabled:opacity-50"
          >
            <Film className="h-3.5 w-3.5" /> {busy === 'film' ? 'Submitting…' : 'Submit render'}
          </button>
        </div>

        <div className="rounded-2xl border border-emrg-edge bg-emrg-panel/30 p-6 text-xs leading-relaxed text-emrg-mute">
          <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-emrg-mute">Triggers</div>
          <p className="mb-1.5"><span className="text-emrg-cream">Voice</span> — generate narration for any dispatch from the campaigns layer.</p>
          <p className="mb-1.5"><span className="text-emrg-gold">Publish</span> — share icon on any campaign posts to its channel.</p>
          <p>Provider keys needed: <span className="font-mono text-emrg-ink">VIDEO_PROVIDER_URL</span>, <span className="font-mono text-emrg-ink">VIDEO_PROVIDER_KEY</span> for video; <span className="font-mono text-emrg-ink">LINKEDIN_ACCESS_TOKEN</span>, <span className="font-mono text-emrg-ink">YOUTUBE_ACCESS_TOKEN</span> for social.</p>
        </div>
      </div>

      {/* Recent jobs */}
      <div className="mt-10 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.24em] text-emrg-mute">Recent jobs</div>
        <button
          onClick={refreshJobs}
          className="inline-flex items-center gap-1.5 rounded border border-emrg-edge px-2.5 py-1 text-[10px] uppercase tracking-wider text-emrg-mute transition hover:border-emrg-dim hover:text-emrg-cream"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      <div className="mt-3 divide-y divide-emrg-edge/50 overflow-hidden rounded-2xl border border-emrg-edge bg-emrg-panel/40">
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center gap-4 px-5 py-3">
            <span className="w-20 shrink-0 rounded bg-emrg-surface px-2 py-0.5 text-center text-[9px] uppercase tracking-wider text-emrg-mute">{j.kind}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-emrg-ink">
                {j.title || '—'}
                {j.provider ? <span className="ml-2 font-mono text-xs text-emrg-mute">· {j.provider}</span> : null}
              </div>
              {j.error && <div className="truncate text-[10px] text-red-300/70">{j.error}</div>}
            </div>
            {j.result_url && <a href={j.result_url} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] uppercase tracking-wider text-emrg-gold hover:text-emrg-cream">Open</a>}
            <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase ${j.status === 'done' ? 'bg-emerald-500/15 text-emerald-300' : j.status === 'processing' ? 'bg-cyan-500/15 text-cyan-300' : j.status === 'failed' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{j.status}</span>
            <span className="shrink-0 whitespace-nowrap font-mono text-xs text-emrg-mute">{new Date(j.created_at).toLocaleDateString()}</span>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-emrg-mute">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> No pipeline runs yet.
          </div>
        )}
      </div>
    </ConsoleShell>
  );
}
