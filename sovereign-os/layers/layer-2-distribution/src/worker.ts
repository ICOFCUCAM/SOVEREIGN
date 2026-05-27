import type { Campaign, PublishResult } from './types.js';

// Pure campaign-processing orchestration. The runnable worker injects real I/O
// (Supabase queries + the dispatcher); this stays side-effect free and unit-testable.

export interface CampaignProcessorDeps {
  /** Return campaigns that are due to publish at `now`. */
  loadDue: (now: Date) => Promise<Campaign[]>;
  /** Publish one campaign (typically the dispatcher's publishCampaign). */
  publish: (campaign: Campaign) => Promise<PublishResult>;
  /** Persist the outcome (update campaign status, record a job, meter usage). */
  onResult: (campaign: Campaign, result: PublishResult) => Promise<void>;
}

export interface ProcessSummary {
  processed: number;
  published: number;
  failed: number;
  dormant: number;
  results: { id: string; platform: string; ok: boolean; dormant?: boolean }[];
}

export async function processDueCampaigns(deps: CampaignProcessorDeps, now: Date = new Date()): Promise<ProcessSummary> {
  const due = await deps.loadDue(now);
  const summary: ProcessSummary = { processed: due.length, published: 0, failed: 0, dormant: 0, results: [] };

  for (const campaign of due) {
    let result: PublishResult;
    try {
      result = await deps.publish(campaign);
    } catch (e) {
      result = { ok: false, platform: (campaign.channel as PublishResult['platform']) ?? 'x', error: (e as Error).message };
    }
    await deps.onResult(campaign, result);

    if (result.ok) summary.published++;
    else if (result.dormant) summary.dormant++;
    else summary.failed++;
    summary.results.push({ id: campaign.id, platform: result.platform, ok: result.ok, dormant: result.dormant });
  }
  return summary;
}
