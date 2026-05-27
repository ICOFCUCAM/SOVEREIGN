import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['YOUTUBE_ACCESS_TOKEN'];

// YouTube Data API v3 resumable upload: start a session, then PUT the video bytes.
// Requires a video media_url. https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
export const youtube: PlatformAdapter = {
  platform: 'youtube',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.YOUTUBE_ACCESS_TOKEN),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('youtube', REQUIRES);
    if (!campaign.media_url) return { ok: false, platform: 'youtube', error: 'YouTube requires a video media_url.' };
    const token = env.YOUTUBE_ACCESS_TOKEN!;

    const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/*' },
      body: JSON.stringify({
        snippet: { title: (campaign.title ?? 'Untitled').slice(0, 100), description: campaign.body ?? '' },
        status: { privacyStatus: 'public' },
      }),
    });
    const uploadUrl = init.headers.get('location');
    if (!init.ok || !uploadUrl) {
      const detail = await init.text().catch(() => '');
      return { ok: false, platform: 'youtube', error: `init HTTP ${init.status} ${detail.slice(0, 150)}` };
    }

    const video = await fetch(campaign.media_url);
    if (!video.ok) return { ok: false, platform: 'youtube', error: `media fetch HTTP ${video.status}` };
    const bytes = new Uint8Array(await video.arrayBuffer());

    const up = await fetch(uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'video/*' }, body: bytes });
    const body = (await up.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!up.ok || !body.id) return { ok: false, platform: 'youtube', error: body.error?.message ?? `upload HTTP ${up.status}` };
    return { ok: true, platform: 'youtube', externalId: body.id, url: `https://youtube.com/watch?v=${body.id}` };
  },
};
