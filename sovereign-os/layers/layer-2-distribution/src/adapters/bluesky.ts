import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['BLUESKY_IDENTIFIER', 'BLUESKY_APP_PASSWORD'];
const PDS = 'https://bsky.social';

// Bluesky / AT Protocol. createSession to get a JWT, then createRecord a feed post.
// https://docs.bsky.app/docs/api/com-atproto-repo-create-record
export const bluesky: PlatformAdapter = {
  platform: 'bluesky',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.BLUESKY_IDENTIFIER && env.BLUESKY_APP_PASSWORD),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('bluesky', REQUIRES);

    const session = await fetch(`${PDS}/xrpc/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: env.BLUESKY_IDENTIFIER, password: env.BLUESKY_APP_PASSWORD }),
    });
    const auth = (await session.json().catch(() => ({}))) as { accessJwt?: string; did?: string; message?: string };
    if (!session.ok || !auth.accessJwt || !auth.did) {
      return { ok: false, platform: 'bluesky', error: auth.message ?? `auth HTTP ${session.status}` };
    }

    const text = [campaign.title, campaign.body].filter(Boolean).join('\n\n').slice(0, 300);
    const r = await fetch(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.accessJwt}` },
      body: JSON.stringify({
        repo: auth.did,
        collection: 'app.bsky.feed.post',
        record: { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString() },
      }),
    });
    const body = (await r.json().catch(() => ({}))) as { uri?: string; message?: string };
    if (!r.ok || !body.uri) {
      return { ok: false, platform: 'bluesky', error: body.message ?? `HTTP ${r.status}` };
    }
    return { ok: true, platform: 'bluesky', externalId: body.uri };
  },
};
