// post-campaign: publishes a campaign to one or more channels with real
// platform API calls. Supports both single (campaign.channel) and multi
// (campaigns.channels[] / request body channels[]) modes — each channel gets
// its own pipeline_job row so success/failure is recorded per platform.
//
// Live publishers:
//   linkedin  — UGC Posts API (LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN)
//   x         — v2 tweets text post (X_ACCESS_TOKEN) — text only for now
//   youtube   — videos.insert (YOUTUBE_ACCESS_TOKEN) — for hosted video URLs
// Stubbed (token-gated, returns clean dormant error if requested):
//   instagram — Graph API (requires IG business account + container flow)
//   tiktok    — TikTok Content Posting API (requires registered app)
//
// Body:
//   { campaign_id }                 → use channels stored on the row
//   { campaign_id, channels: [...] } → override which channels to fan out to

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

interface Campaign {
  id: string;
  channel: string | null;
  channels: string[] | null;
  title: string | null;
  name: string | null;
  body: string | null;
  media_url: string | null;
  asset_ref: string | null;
}

interface PublishResult { ok: boolean; provider: string; remote_id?: string; url?: string; error?: string }

function tokens() {
  return {
    linkedin:  Deno.env.get('LINKEDIN_ACCESS_TOKEN'),
    linkedin_author: Deno.env.get('LINKEDIN_AUTHOR_URN'),
    youtube:   Deno.env.get('YOUTUBE_ACCESS_TOKEN'),
    x:         Deno.env.get('X_ACCESS_TOKEN'),
    instagram: Deno.env.get('INSTAGRAM_ACCESS_TOKEN'),
    instagram_user: Deno.env.get('INSTAGRAM_USER_ID'),
    tiktok:    Deno.env.get('TIKTOK_ACCESS_TOKEN'),
  };
}

async function publishLinkedIn(c: Campaign): Promise<PublishResult> {
  const t = tokens();
  if (!t.linkedin) return { ok: false, provider: 'linkedin', error: 'LINKEDIN_ACCESS_TOKEN not configured' };
  if (!t.linkedin_author) return { ok: false, provider: 'linkedin', error: 'LINKEDIN_AUTHOR_URN not configured (urn:li:person:... or urn:li:organization:...)' };

  const text = [c.title, c.body].filter(Boolean).join('\n\n').slice(0, 3000);
  const body: Record<string, unknown> = {
    author: t.linkedin_author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: c.media_url ? 'ARTICLE' : 'NONE',
        ...(c.media_url ? { media: [{ status: 'READY', originalUrl: c.media_url }] } : {}),
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };
  const r = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t.linkedin}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, provider: 'linkedin', error: `LinkedIn ${r.status}: ${(await r.text()).slice(0, 300)}` };
  const j = await r.json().catch(() => ({}));
  const id = (j?.id as string) || r.headers.get('x-restli-id') || undefined;
  return { ok: true, provider: 'linkedin', remote_id: id, url: id ? `https://www.linkedin.com/feed/update/${id}` : undefined };
}

async function publishX(c: Campaign): Promise<PublishResult> {
  const t = tokens();
  if (!t.x) return { ok: false, provider: 'x', error: 'X_ACCESS_TOKEN not configured' };
  // Text-only post via X v2 (image/video upload requires v1.1 media flow — separate task).
  const text = [c.title, c.body].filter(Boolean).join(' — ').slice(0, 280);
  const r = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${t.x}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) return { ok: false, provider: 'x', error: `X ${r.status}: ${(await r.text()).slice(0, 300)}` };
  const j = await r.json().catch(() => ({}));
  const id = j?.data?.id as string | undefined;
  return { ok: true, provider: 'x', remote_id: id, url: id ? `https://x.com/i/web/status/${id}` : undefined };
}

async function publishYouTube(c: Campaign): Promise<PublishResult> {
  const t = tokens();
  if (!t.youtube) return { ok: false, provider: 'youtube', error: 'YOUTUBE_ACCESS_TOKEN not configured' };
  if (!c.media_url) return { ok: false, provider: 'youtube', error: 'YouTube publishing requires media_url (the hosted MP4)' };

  // 1) Fetch media bytes (Runway result URL is publicly downloadable).
  const mediaResp = await fetch(c.media_url);
  if (!mediaResp.ok) return { ok: false, provider: 'youtube', error: `media fetch failed ${mediaResp.status}` };
  const bytes = new Uint8Array(await mediaResp.arrayBuffer());

  // 2) Resumable upload: initiate.
  const metadata = {
    snippet: {
      title: (c.title || c.name || 'Untitled video').slice(0, 100),
      description: (c.body || '').slice(0, 5000),
    },
    status: { privacyStatus: 'private', selfDeclaredMadeForKids: false },
  };
  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t.youtube}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': String(bytes.byteLength),
    },
    body: JSON.stringify(metadata),
  });
  if (!init.ok) return { ok: false, provider: 'youtube', error: `YouTube init ${init.status}: ${(await init.text()).slice(0, 300)}` };
  const uploadUrl = init.headers.get('location');
  if (!uploadUrl) return { ok: false, provider: 'youtube', error: 'YouTube did not return a resumable upload URL' };

  // 3) Resumable upload: payload.
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(bytes.byteLength) },
    body: bytes,
  });
  if (!put.ok) return { ok: false, provider: 'youtube', error: `YouTube upload ${put.status}: ${(await put.text()).slice(0, 300)}` };
  const j = await put.json().catch(() => ({}));
  const id = j?.id as string | undefined;
  return { ok: true, provider: 'youtube', remote_id: id, url: id ? `https://www.youtube.com/watch?v=${id}` : undefined };
}

async function publishInstagram(_c: Campaign): Promise<PublishResult> {
  const t = tokens();
  if (!t.instagram || !t.instagram_user) {
    return { ok: false, provider: 'instagram', error: 'Instagram publishing requires INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID (Graph API container flow). Not yet wired.' };
  }
  return { ok: false, provider: 'instagram', error: 'Instagram publisher token present but container flow not yet implemented.' };
}

async function publishTikTok(_c: Campaign): Promise<PublishResult> {
  const t = tokens();
  if (!t.tiktok) return { ok: false, provider: 'tiktok', error: 'TIKTOK_ACCESS_TOKEN not configured' };
  return { ok: false, provider: 'tiktok', error: 'TikTok publisher token present but Content Posting API flow not yet implemented.' };
}

const PUBLISHERS: Record<string, (c: Campaign) => Promise<PublishResult>> = {
  linkedin: publishLinkedIn,
  x: publishX,
  twitter: publishX,
  youtube: publishYouTube,
  instagram: publishInstagram,
  tiktok: publishTikTok,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

  try {
    const { campaign_id, channels: requestedChannels } = await req.json().catch(() => ({}));
    if (!campaign_id) return json({ error: 'A "campaign_id" is required.' }, 400);

    const { data: campaign, error: cErr } = await admin.from('campaigns').select('*').eq('id', campaign_id).single();
    if (cErr || !campaign) return json({ error: 'Campaign not found.' }, 404);

    // Resolve channel list — request body wins, then campaign.channels[], then single campaign.channel.
    const channels: string[] = (
      Array.isArray(requestedChannels) && requestedChannels.length ? requestedChannels :
      Array.isArray((campaign as Campaign).channels) && (campaign as Campaign).channels!.length ? (campaign as Campaign).channels! :
      campaign.channel ? [campaign.channel] :
      []
    ).map((c) => String(c).toLowerCase()).filter(Boolean);

    if (channels.length === 0) return json({ error: 'No channels specified on the campaign or in the request.' }, 400);

    // Fan out one job per channel; publish in parallel.
    const results = await Promise.all(channels.map(async (channel) => {
      const publisher = PUBLISHERS[channel];
      const { data: job } = await admin.from('pipeline_jobs').insert({
        kind: 'social',
        status: publisher ? 'processing' : 'failed',
        provider: channel,
        title: campaign.title || campaign.name || null,
        input: { campaign_id, channel, asset_ref: campaign.asset_ref ?? null },
        error: publisher ? null : `No publisher implemented for channel "${channel}".`,
      }).select('id').single();
      const jobId = job?.id as string | undefined;

      if (!publisher) return { channel, status: 'failed', error: `Unsupported channel: ${channel}`, job_id: jobId };

      try {
        const r = await publisher(campaign as Campaign);
        if (jobId) {
          await admin.from('pipeline_jobs').update({
            status: r.ok ? 'done' : 'failed',
            result_url: r.url ?? null,
            result: r,
            error: r.ok ? null : r.error,
            updated_at: new Date().toISOString(),
          }).eq('id', jobId);
        }
        return { channel, status: r.ok ? 'done' : 'failed', error: r.error, url: r.url, remote_id: r.remote_id, job_id: jobId };
      } catch (e) {
        const msg = (e as Error).message;
        if (jobId) await admin.from('pipeline_jobs').update({ status: 'failed', error: msg, updated_at: new Date().toISOString() }).eq('id', jobId);
        return { channel, status: 'failed', error: msg, job_id: jobId };
      }
    }));

    // Mark the parent campaign published if any channel succeeded; failed if all failed.
    const anyOk = results.some((r) => r.status === 'done');
    await admin.from('campaigns').update({ status: anyOk ? 'published' : 'failed' }).eq('id', campaign_id);

    return json({ campaign_id, results });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
