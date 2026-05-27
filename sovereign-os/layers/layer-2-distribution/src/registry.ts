import type { DistributionPlatform, PlatformAdapter } from './types.js';
import { seam } from './adapters/seam.js';
import { telegram } from './adapters/telegram.js';
import { bluesky } from './adapters/bluesky.js';
import { linkedin } from './adapters/linkedin.js';
import { x } from './adapters/x.js';
import { facebook } from './adapters/facebook.js';
import { instagram } from './adapters/instagram.js';
import { pinterest } from './adapters/pinterest.js';
import { threads } from './adapters/threads.js';

// Implemented adapters + typed seams for the remainder. The grid surface is complete:
// every DistributionPlatform resolves to an adapter, live or dormant.
// Seams (youtube/tiktok/whatsapp) need resumable upload / content-approval / no public
// post API respectively, so they stay dormant until those flows are built.
export const adapters: Record<DistributionPlatform, PlatformAdapter> = {
  linkedin,
  telegram,
  bluesky,
  x,
  facebook,
  instagram,
  pinterest,
  threads,
  youtube: seam('youtube', ['YOUTUBE_ACCESS_TOKEN']),
  tiktok: seam('tiktok', ['TIKTOK_ACCESS_TOKEN']),
  whatsapp: seam('whatsapp', ['WHATSAPP_ACCESS_TOKEN']),
};

export function getAdapter(platform: DistributionPlatform): PlatformAdapter {
  return adapters[platform];
}

export function liveAdapters(env: NodeJS.ProcessEnv = process.env): DistributionPlatform[] {
  return (Object.keys(adapters) as DistributionPlatform[]).filter((p) => adapters[p].ready(env));
}
