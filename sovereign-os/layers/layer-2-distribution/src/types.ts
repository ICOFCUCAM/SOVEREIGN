import type { Campaign, DistributionPlatform } from '@sovereign/core/types';

export type { Campaign, DistributionPlatform };

export interface PublishResult {
  ok: boolean;
  platform: DistributionPlatform;
  externalId?: string;
  url?: string;
  /** Adapter exists but its credentials are not configured. */
  dormant?: boolean;
  error?: string;
}

export interface PlatformAdapter {
  platform: DistributionPlatform;
  /** Env var(s) required for this adapter to be live. */
  requires: string[];
  /** True once required credentials are present. */
  ready(env?: NodeJS.ProcessEnv): boolean;
  publish(campaign: Campaign, env?: NodeJS.ProcessEnv): Promise<PublishResult>;
}

export function dormant(platform: DistributionPlatform, requires: string[]): PublishResult {
  return { ok: false, platform, dormant: true, error: `dormant — set ${requires.join(', ')}` };
}
