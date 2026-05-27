import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['TIKTOK_ACCESS_TOKEN'];

// TikTok Content Posting API — Direct Post via PULL_FROM_URL (TikTok fetches the video
// from the given URL). Requires a video media_url and an approved app.
// https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
export const tiktok: PlatformAdapter = {
  platform: 'tiktok',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.TIKTOK_ACCESS_TOKEN),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('tiktok', REQUIRES);
    if (!campaign.media_url) return { ok: false, platform: 'tiktok', error: 'TikTok requires a video media_url.' };

    const r = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.TIKTOK_ACCESS_TOKEN}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        post_info: { title: [campaign.title, campaign.body].filter(Boolean).join(' ').slice(0, 150), privacy_level: 'PUBLIC_TO_EVERYONE' },
        source_info: { source: 'PULL_FROM_URL', video_url: campaign.media_url },
      }),
    });
    const body = (await r.json().catch(() => ({}))) as { data?: { publish_id?: string }; error?: { message?: string; code?: string } };
    if (!r.ok || !body.data?.publish_id || (body.error && body.error.code && body.error.code !== 'ok')) {
      return { ok: false, platform: 'tiktok', error: body.error?.message ?? `HTTP ${r.status}` };
    }
    return { ok: true, platform: 'tiktok', externalId: body.data.publish_id };
  },
};
