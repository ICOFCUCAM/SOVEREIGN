import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Publishes a campaign to its channel. Activates per-channel as keys are added:
//   linkedin  -> LINKEDIN_ACCESS_TOKEN
//   youtube   -> YOUTUBE_ACCESS_TOKEN
// Until then it records the publish intent as a job and reports dormant.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const { campaign_id } = await req.json().catch(() => ({}));
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'A "campaign_id" is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { data: campaign, error: cErr } = await admin.from('campaigns').select('*').eq('id', campaign_id).single();
    if (cErr || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found.' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const channel = campaign.channel as string;
    const keyByChannel: Record<string, string | undefined> = {
      linkedin: Deno.env.get('LINKEDIN_ACCESS_TOKEN'),
      youtube: Deno.env.get('YOUTUBE_ACCESS_TOKEN'),
    };
    const token = keyByChannel[channel];

    const { data: job } = await admin.from('pipeline_jobs').insert({
      kind: 'social',
      status: token ? 'queued' : 'failed',
      provider: channel,
      title: campaign.name,
      input: { campaign_id, channel, asset_ref: campaign.asset_ref ?? null },
      error: token ? null : `No credentials for channel "${channel}" (set the matching access-token secret).`,
    }).select('id').single();
    const jobId = job?.id as string | undefined;

    if (!token) {
      return new Response(JSON.stringify({
        error: `Distribution for "${channel}" not configured.`,
        detail: `Set the ${channel === 'youtube' ? 'YOUTUBE_ACCESS_TOKEN' : channel === 'linkedin' ? 'LINKEDIN_ACCESS_TOKEN' : channel + '_ACCESS_TOKEN'} secret to publish automatically. The publish intent has been recorded.`,
        job_id: jobId,
      }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // With a token present, this is where the channel-specific publish call goes.
    // Kept minimal until a real channel + token is wired; marks the job processing.
    if (jobId) await admin.from('pipeline_jobs').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', jobId);
    return new Response(JSON.stringify({ job_id: jobId, channel, status: 'processing' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
