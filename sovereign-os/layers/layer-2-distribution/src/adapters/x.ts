import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['X_ACCESS_TOKEN'];

// X (Twitter) API v2 — create a post. Text only; media requires a separate upload flow.
// https://developer.x.com/en/docs/x-api/tweets/manage-tweets/api-reference/post-tweets
export const x: PlatformAdapter = {
  platform: 'x',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.X_ACCESS_TOKEN),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('x', REQUIRES);
    const text = [campaign.title, campaign.body].filter(Boolean).join('\n\n').slice(0, 280);
    const r = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.X_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const body = (await r.json().catch(() => ({}))) as { data?: { id?: string }; detail?: string };
    if (!r.ok || !body.data?.id) return { ok: false, platform: 'x', error: body.detail ?? `HTTP ${r.status}` };
    return { ok: true, platform: 'x', externalId: body.data.id, url: `https://x.com/i/web/status/${body.data.id}` };
  },
};
