import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['PINTEREST_ACCESS_TOKEN', 'PINTEREST_BOARD_ID'];

// Pinterest API v5 — create a Pin. Requires a board and an image media_url.
// https://developers.pinterest.com/docs/api/v5/pins-create
export const pinterest: PlatformAdapter = {
  platform: 'pinterest',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.PINTEREST_ACCESS_TOKEN && env.PINTEREST_BOARD_ID),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('pinterest', REQUIRES);
    if (!campaign.media_url) return { ok: false, platform: 'pinterest', error: 'Pinterest requires a media_url.' };

    const r = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.PINTEREST_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: env.PINTEREST_BOARD_ID,
        title: campaign.title ?? undefined,
        description: campaign.body ?? undefined,
        media_source: { source_type: 'image_url', url: campaign.media_url },
      }),
    });
    const body = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok || !body.id) return { ok: false, platform: 'pinterest', error: body.message ?? `HTTP ${r.status}` };
    return { ok: true, platform: 'pinterest', externalId: body.id };
  },
};
