import type { Campaign } from './types.js';

// Pure scheduling helpers. The Layer 2 worker calls dueCampaigns() against the queue,
// then dispatches each via the dispatcher. Kept side-effect free so it is unit-testable.

export function isDue(campaign: Campaign, now: Date = new Date()): boolean {
  if (campaign.status && !['draft', 'scheduled'].includes(campaign.status)) return false;
  if (!campaign.scheduled_at) return campaign.status === 'scheduled';
  return new Date(campaign.scheduled_at).getTime() <= now.getTime();
}

export function dueCampaigns(campaigns: Campaign[], now: Date = new Date()): Campaign[] {
  return campaigns.filter((c) => isDue(c, now));
}

export interface RepostPlan {
  campaign: Campaign;
  /** Minutes from the original publish for each smart repost. */
  offsetsMinutes: number[];
}

/** Smart reposting cadence — spreads N reposts over the following days. */
export function repostSchedule(campaign: Campaign, count = 2): RepostPlan {
  const offsets = Array.from({ length: count }, (_, i) => (i + 1) * 24 * 60);
  return { campaign, offsetsMinutes: offsets };
}
