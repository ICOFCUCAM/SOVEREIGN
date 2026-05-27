import type { Campaign, DistributionPlatform } from '@sovereign/core/types';

// Sovereign Distribution Grid — uniform publish contract.
// Every target platform implements one PlatformAdapter. The migrated `post-campaign`
// edge function is the working seed (LinkedIn + YouTube live); the rest are declared
// here as seams so the grid has a complete, typed surface from day one.

export interface PublishResult {
  ok: boolean;
  platform: DistributionPlatform;
  externalId?: string;
  dormant?: boolean; // adapter exists but credentials not yet configured
  error?: string;
}

export interface PlatformAdapter {
  platform: DistributionPlatform;
  /** True once the platform's credentials are present in env. */
  ready(): boolean;
  publish(campaign: Campaign): Promise<PublishResult>;
}

/** Default seam: records intent and reports dormant until the adapter is implemented. */
function seam(platform: DistributionPlatform, envVar: string): PlatformAdapter {
  return {
    platform,
    ready: () => Boolean(process.env[envVar]),
    async publish(): Promise<PublishResult> {
      return { ok: false, platform, dormant: true, error: `${platform} adapter not yet implemented (needs ${envVar})` };
    },
  };
}

export const adapters: Record<DistributionPlatform, PlatformAdapter> = {
  linkedin: seam('linkedin', 'LINKEDIN_ACCESS_TOKEN'), // live path in functions/post-campaign
  youtube: seam('youtube', 'YOUTUBE_ACCESS_TOKEN'), // live path in functions/post-campaign
  x: seam('x', 'X_BEARER_TOKEN'),
  instagram: seam('instagram', 'INSTAGRAM_ACCESS_TOKEN'),
  facebook: seam('facebook', 'FACEBOOK_ACCESS_TOKEN'),
  tiktok: seam('tiktok', 'TIKTOK_ACCESS_TOKEN'),
  threads: seam('threads', 'THREADS_ACCESS_TOKEN'),
  telegram: seam('telegram', 'TELEGRAM_BOT_TOKEN'),
  whatsapp: seam('whatsapp', 'WHATSAPP_ACCESS_TOKEN'),
  pinterest: seam('pinterest', 'PINTEREST_ACCESS_TOKEN'),
  bluesky: seam('bluesky', 'BLUESKY_APP_PASSWORD'),
};

export function getAdapter(platform: DistributionPlatform): PlatformAdapter {
  return adapters[platform];
}
