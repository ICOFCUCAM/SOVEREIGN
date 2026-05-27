import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  WORKER_SECRET,
  PORT = 8080,
  BUCKET = 'ecosystem',
} = process.env;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

async function fetchToFile(url, path) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download failed ${r.status} for ${url}`);
  await writeFile(path, Buffer.from(await r.arrayBuffer()));
}

// POST /assemble { film_job_id?, clip_urls: string[], audio_url?, ratio? }
// Concatenates clips (normalized to 1280x720/30fps), mixes narration audio, uploads final MP4.
app.post('/assemble', async (req, res) => {
  if (WORKER_SECRET && req.get('x-worker-secret') !== WORKER_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { film_job_id, clip_urls = [], audio_url } = req.body || {};
  if (!Array.isArray(clip_urls) || clip_urls.length === 0) {
    return res.status(400).json({ error: 'clip_urls (non-empty array) is required' });
  }

  const dir = await mkdtemp(join(tmpdir(), 'film-'));
  const markFailed = async (msg) => {
    if (film_job_id) await admin.from('pipeline_jobs').update({ status: 'failed', error: String(msg).slice(0, 500), updated_at: new Date().toISOString() }).eq('id', film_job_id);
  };

  try {
    // Download clips + optional audio.
    const clipPaths = [];
    for (let i = 0; i < clip_urls.length; i++) {
      const p = join(dir, `clip${i}.mp4`);
      await fetchToFile(clip_urls[i], p);
      clipPaths.push(p);
    }
    let audioPath;
    if (audio_url) {
      audioPath = join(dir, 'narration.mp3');
      await fetchToFile(audio_url, audioPath);
    }

    // Build filter_complex: normalize each clip, concat video; mix audio if present.
    const inputs = clipPaths.flatMap((p) => ['-i', p]);
    if (audioPath) inputs.push('-i', audioPath);

    const n = clipPaths.length;
    const norm = clipPaths.map((_, i) => `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1,setsar=1,fps=30[v${i}]`).join(';');
    const concat = clipPaths.map((_, i) => `[v${i}]`).join('') + `concat=n=${n}:v=1:a=0[outv]`;
    const filter = `${norm};${concat}`;

    const out = join(dir, 'final.mp4');
    const args = [...inputs, '-filter_complex', filter, '-map', '[outv]'];
    if (audioPath) {
      args.push('-map', `${n}:a`, '-c:a', 'aac', '-shortest');
    }
    args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', out);

    await run('ffmpeg', args, { maxBuffer: 1024 * 1024 * 64 });

    const bytes = await readFile(out);
    const path = `film/${film_job_id || Date.now()}.mp4`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: 'video/mp4', upsert: true, cacheControl: '3600' });
    if (upErr) throw upErr;
    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    if (film_job_id) {
      await admin.from('pipeline_jobs').update({ status: 'done', result_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', film_job_id);
    }
    res.json({ url: publicUrl, clips: n });
  } catch (e) {
    await markFailed(e.message || String(e));
    res.status(500).json({ error: e.message || String(e) });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

app.listen(PORT, () => console.log(`ffmpeg worker listening on :${PORT}`));
