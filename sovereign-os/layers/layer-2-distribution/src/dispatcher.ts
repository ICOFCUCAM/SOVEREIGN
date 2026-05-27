import type { Campaign, DistributionPlatform, PublishResult } from './types.js';
import { getAdapter } from './registry.js';

const KNOWN = new Set<string>([
  'linkedin', 'x', 'instagram', 'facebook', 'tiktok', 'youtube',
  'threads', 'telegram', 'whatsapp', 'pinterest', 'bluesky',
]);

function isPlatform(value: string): value is DistributionPlatform {
  return KNOWN.has(value);
}

/** Route one campaign to its channel adapter. */
export async function publishCampaign(campaign: Campaign, env: NodeJS.ProcessEnv = process.env): Promise<PublishResult> {
  if (!isPlatform(campaign.channel)) {
    return { ok: false, platform: 'x', error: `unknown channel "${campaign.channel}"` };
  }
  return getAdapter(campaign.channel).publish(campaign, env);
}

/** Fan a campaign out to several platforms at once (cross-posting). */
export async function publishToMany(
  campaign: Omit<Campaign, 'channel'>,
  platforms: DistributionPlatform[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<PublishResult[]> {
  return Promise.all(platforms.map((channel) => getAdapter(channel).publish({ ...campaign, channel }, env)));
}
