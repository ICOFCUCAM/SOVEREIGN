import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['IG_USER_ID', 'IG_ACCESS_TOKEN'];
const GRAPH = 'https://graph.facebook.com/v21.0';

// Instagram Graph API two-step publish: create a media container, then publish it.
// Instagram requires an image/video — a media_url is mandatory.
// https://developers.facebook.com/docs/instagram-api/guides/content-publishing
export const instagram: PlatformAdapter = {
  platform: 'instagram',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.IG_USER_ID && env.IG_ACCESS_TOKEN),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('instagram', REQUIRES);
    if (!campaign.media_url) return { ok: false, platform: 'instagram', error: 'Instagram requires a media_url.' };
    const token = env.IG_ACCESS_TOKEN!;
    const igId = env.IG_USER_ID!;
    const caption = [campaign.title, campaign.body].filter(Boolean).join('\n\n');

    const createParams = new URLSearchParams({ image_url: campaign.media_url, caption, access_token: token });
    const create = await fetch(`${GRAPH}/${igId}/media?${createParams.toString()}`, { method: 'POST' });
    const created = (await create.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!create.ok || !created.id) return { ok: false, platform: 'instagram', error: created.error?.message ?? `container HTTP ${create.status}` };

    const pubParams = new URLSearchParams({ creation_id: created.id, access_token: token });
    const pub = await fetch(`${GRAPH}/${igId}/media_publish?${pubParams.toString()}`, { method: 'POST' });
    const published = (await pub.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!pub.ok || !published.id) return { ok: false, platform: 'instagram', error: published.error?.message ?? `publish HTTP ${pub.status}` };
    return { ok: true, platform: 'instagram', externalId: published.id };
  },
};
