import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { processDueCampaigns, dueCampaigns, publishCampaign } from '@sovereign/distribution';

// Distribution worker: drains scheduled campaigns and publishes them across the grid.
// Wires real Supabase I/O into the pure processDueCampaigns orchestration.

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT = 8090, DRAIN_INTERVAL_MS } = process.env;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const deps = {
  async loadDue(now) {
    // Broad query, then the pure scheduler decides what is actually due.
    const { data } = await admin
      .from('campaigns')
      .select('*')
      .in('status', ['draft', 'scheduled'])
      .limit(100);
    return dueCampaigns(data ?? [], now);
  },
  async publish(campaign) {
    await admin.from('campaigns').update({ status: 'publishing' }).eq('id', campaign.id);
    return publishCampaign(campaign);
  },
  async onResult(campaign, result) {
    await admin.from('campaigns').update({ status: result.ok ? 'published' : 'failed' }).eq('id', campaign.id);
    await admin.from('pipeline_jobs').insert({
      kind: 'campaign',
      status: result.ok ? 'done' : 'failed',
      provider: result.platform,
      title: campaign.title ?? `campaign ${campaign.id}`,
      result: { external_id: result.externalId ?? null, dormant: result.dormant ?? false },
      result_url: result.url ?? null,
      error: result.ok ? null : result.error ?? null,
    });
  },
};

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/drain', async (_req, res) => {
  try {
    const summary = await processDueCampaigns(deps);
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => console.log(`distribution-worker on :${PORT}`));

if (DRAIN_INTERVAL_MS) {
  const ms = Number(DRAIN_INTERVAL_MS);
  setInterval(() => processDueCampaigns(deps).catch((e) => console.error('drain failed', e)), ms);
  console.log(`auto-drain every ${ms}ms`);
}
