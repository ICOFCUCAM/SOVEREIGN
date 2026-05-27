import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_AUTHOR_URN'];

// LinkedIn UGC text share. LINKEDIN_AUTHOR_URN is e.g. "urn:li:person:XXXX" or
// "urn:li:organization:XXXX". https://learn.microsoft.com/linkedin/marketing/community-management/shares/ugc-post-api
export const linkedin: PlatformAdapter = {
  platform: 'linkedin',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.LINKEDIN_ACCESS_TOKEN && env.LINKEDIN_AUTHOR_URN),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('linkedin', REQUIRES);
    const text = [campaign.title, campaign.body].filter(Boolean).join('\n\n');

    const r = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: env.LINKEDIN_AUTHOR_URN,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return { ok: false, platform: 'linkedin', error: `HTTP ${r.status} ${detail.slice(0, 200)}` };
    }
    const id = r.headers.get('x-restli-id') ?? undefined;
    return { ok: true, platform: 'linkedin', externalId: id };
  },
};
