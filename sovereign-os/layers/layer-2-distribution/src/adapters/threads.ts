import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['THREADS_USER_ID', 'THREADS_ACCESS_TOKEN'];
const GRAPH = 'https://graph.threads.net/v1.0';

// Threads API two-step publish: create a media container, then publish it.
// https://developers.facebook.com/docs/threads/posts
export const threads: PlatformAdapter = {
  platform: 'threads',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.THREADS_USER_ID && env.THREADS_ACCESS_TOKEN),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('threads', REQUIRES);
    const token = env.THREADS_ACCESS_TOKEN!;
    const userId = env.THREADS_USER_ID!;
    const text = [campaign.title, campaign.body].filter(Boolean).join('\n\n');

    const createParams = new URLSearchParams({ media_type: 'TEXT', text, access_token: token });
    const create = await fetch(`${GRAPH}/${userId}/threads?${createParams.toString()}`, { method: 'POST' });
    const created = (await create.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!create.ok || !created.id) return { ok: false, platform: 'threads', error: created.error?.message ?? `container HTTP ${create.status}` };

    const pubParams = new URLSearchParams({ creation_id: created.id, access_token: token });
    const pub = await fetch(`${GRAPH}/${userId}/threads_publish?${pubParams.toString()}`, { method: 'POST' });
    const published = (await pub.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!pub.ok || !published.id) return { ok: false, platform: 'threads', error: published.error?.message ?? `publish HTTP ${pub.status}` };
    return { ok: true, platform: 'threads', externalId: published.id };
  },
};
