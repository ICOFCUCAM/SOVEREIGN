import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_TOKEN'];
const GRAPH = 'https://graph.facebook.com/v21.0';

// Facebook Page publish via the Graph API. /photos when a media_url is present, else /feed.
// https://developers.facebook.com/docs/pages-api/posts
export const facebook: PlatformAdapter = {
  platform: 'facebook',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.FACEBOOK_PAGE_ID && env.FACEBOOK_PAGE_TOKEN),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('facebook', REQUIRES);
    const token = env.FACEBOOK_PAGE_TOKEN!;
    const pageId = env.FACEBOOK_PAGE_ID!;
    const message = [campaign.title, campaign.body].filter(Boolean).join('\n\n');

    const endpoint = campaign.media_url ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
    const params = new URLSearchParams({ access_token: token });
    if (campaign.media_url) {
      params.set('url', campaign.media_url);
      params.set('caption', message);
    } else {
      params.set('message', message);
    }

    const r = await fetch(`${endpoint}?${params.toString()}`, { method: 'POST' });
    const body = (await r.json().catch(() => ({}))) as { id?: string; post_id?: string; error?: { message?: string } };
    const id = body.post_id ?? body.id;
    if (!r.ok || !id) return { ok: false, platform: 'facebook', error: body.error?.message ?? `HTTP ${r.status}` };
    return { ok: true, platform: 'facebook', externalId: id };
  },
};
