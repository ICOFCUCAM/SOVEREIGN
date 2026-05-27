import type { DistributionPlatform, PlatformAdapter } from './types.js';
import { seam } from './adapters/seam.js';
import { telegram } from './adapters/telegram.js';
import { bluesky } from './adapters/bluesky.js';
import { linkedin } from './adapters/linkedin.js';

// Implemented adapters + typed seams for the remainder. The grid surface is complete:
// every DistributionPlatform resolves to an adapter, live or dormant.
export const adapters: Record<DistributionPlatform, PlatformAdapter> = {
  linkedin,
  telegram,
  bluesky,
  youtube: seam('youtube', ['YOUTUBE_ACCESS_TOKEN']),
  x: seam('x', ['X_BEARER_TOKEN']),
  instagram: seam('instagram', ['INSTAGRAM_ACCESS_TOKEN']),
  facebook: seam('facebook', ['FACEBOOK_ACCESS_TOKEN']),
  tiktok: seam('tiktok', ['TIKTOK_ACCESS_TOKEN']),
  threads: seam('threads', ['THREADS_ACCESS_TOKEN']),
  whatsapp: seam('whatsapp', ['WHATSAPP_ACCESS_TOKEN']),
  pinterest: seam('pinterest', ['PINTEREST_ACCESS_TOKEN']),
};

export function getAdapter(platform: DistributionPlatform): PlatformAdapter {
  return adapters[platform];
}

export function liveAdapters(env: NodeJS.ProcessEnv = process.env): DistributionPlatform[] {
  return (Object.keys(adapters) as DistributionPlatform[]).filter((p) => adapters[p].ready(env));
}
