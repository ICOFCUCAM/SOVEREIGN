import type { DistributionPlatform, PlatformAdapter } from './types.js';
import { telegram } from './adapters/telegram.js';
import { bluesky } from './adapters/bluesky.js';
import { linkedin } from './adapters/linkedin.js';
import { x } from './adapters/x.js';
import { facebook } from './adapters/facebook.js';
import { instagram } from './adapters/instagram.js';
import { pinterest } from './adapters/pinterest.js';
import { threads } from './adapters/threads.js';
import { youtube } from './adapters/youtube.js';
import { tiktok } from './adapters/tiktok.js';
import { whatsapp } from './adapters/whatsapp.js';

// Every DistributionPlatform now resolves to an implemented adapter. youtube/tiktok require
// a video media_url (resumable upload / PULL_FROM_URL); whatsapp uses the Cloud API message
// send (Channels have no public posting API). Adapters follow documented specs and are
// credential-gated (dormant without env), but are not verified against live endpoints.
export const adapters: Record<DistributionPlatform, PlatformAdapter> = {
  linkedin,
  telegram,
  bluesky,
  x,
  facebook,
  instagram,
  pinterest,
  threads,
  youtube,
  tiktok,
  whatsapp,
};

export function getAdapter(platform: DistributionPlatform): PlatformAdapter {
  return adapters[platform];
}

export function liveAdapters(env: NodeJS.ProcessEnv = process.env): DistributionPlatform[] {
  return (Object.keys(adapters) as DistributionPlatform[]).filter((p) => adapters[p].ready(env));
}
