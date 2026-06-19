// exit-social-dispatch: ExitOS's own social distribution engine. Accepts inline
// post content (no campaign row required) and fans out to each requested channel
// with REAL platform API calls, returning a per-channel result. Tokens live only
// here, as Supabase function secrets — never in the browser.
//
// GET  (or POST { status: true })  → which channels are credential-connected.
// POST { title, body, url, channels[], media_url? } → publish, returns results[].
//
// Live publishers (token-gated): linkedin, x, facebook, telegram, whatsapp,
// instagram (media). Each returns a clean status-tagged error when its
// credentials are absent — it never fakes a post.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

interface Post { title?: string; body?: string; url?: string; media_url?: string }
interface Result { channel: string; status: 'done' | 'failed'; url?: string; remote_id?: string; error?: string }

const env = (k: string) => Deno.env.get(k);
const compose = (p: Post, max: number, withUrl = true): string =>
  [p.title, p.body].filter(Boolean).join('\n\n').concat(withUrl && p.url ? `\n\n${p.url}` : '').slice(0, max);

// Which channels have credentials present (honest connection status).
function connected(): Record<string, boolean> {
  return {
    linkedin: !!(env('LINKEDIN_ACCESS_TOKEN') && env('LINKEDIN_AUTHOR_URN')),
    x: !!env('X_ACCESS_TOKEN'),
    facebook: !!(env('FB_PAGE_ACCESS_TOKEN') && env('FB_PAGE_ID')),
    instagram: !!(env('INSTAGRAM_ACCESS_TOKEN') && env('INSTAGRAM_USER_ID')),
    telegram: !!(env('TELEGRAM_BOT_TOKEN') && env('TELEGRAM_CHAT_ID')),
    whatsapp: !!(env('WHATSAPP_TOKEN') && env('WHATSAPP_PHONE_ID') && env('WHATSAPP_RECIPIENTS')),
  };
}

async function pubLinkedIn(p: Post): Promise<Result> {
  const tok = env('LINKEDIN_ACCESS_TOKEN'), author = env('LINKEDIN_AUTHOR_URN');
  if (!tok || !author) return { channel: 'linkedin', status: 'failed', error: 'LinkedIn is ACTIVATING — LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN not configured.' };
  const text = compose(p, 3000);
  const r = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      author, lifecycleState: 'PUBLISHED',
      specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text }, shareMediaCategory: 'NONE' } },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  if (!r.ok) return { channel: 'linkedin', status: 'failed', error: `LinkedIn ${r.status}: ${(await r.text()).slice(0, 240)}` };
  const id = (await r.json().catch(() => ({})))?.id || r.headers.get('x-restli-id') || undefined;
  return { channel: 'linkedin', status: 'done', remote_id: id, url: id ? `https://www.linkedin.com/feed/update/${id}` : undefined };
}

async function pubX(p: Post): Promise<Result> {
  const tok = env('X_ACCESS_TOKEN');
  if (!tok) return { channel: 'x', status: 'failed', error: 'X is ACTIVATING — X_ACCESS_TOKEN not configured.' };
  const r = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: compose(p, 280) }),
  });
  if (!r.ok) return { channel: 'x', status: 'failed', error: `X ${r.status}: ${(await r.text()).slice(0, 240)}` };
  const id = (await r.json().catch(() => ({})))?.data?.id as string | undefined;
  return { channel: 'x', status: 'done', remote_id: id, url: id ? `https://x.com/i/web/status/${id}` : undefined };
}

async function pubFacebook(p: Post): Promise<Result> {
  const tok = env('FB_PAGE_ACCESS_TOKEN'), page = env('FB_PAGE_ID');
  if (!tok || !page) return { channel: 'facebook', status: 'failed', error: 'Facebook is ACTIVATING — FB_PAGE_ACCESS_TOKEN + FB_PAGE_ID not configured.' };
  const params = new URLSearchParams({ message: compose(p, 60000, false), access_token: tok });
  if (p.url) params.set('link', p.url);
  const r = await fetch(`https://graph.facebook.com/v19.0/${page}/feed`, { method: 'POST', body: params });
  if (!r.ok) return { channel: 'facebook', status: 'failed', error: `Facebook ${r.status}: ${(await r.text()).slice(0, 240)}` };
  const id = (await r.json().catch(() => ({})))?.id as string | undefined;
  return { channel: 'facebook', status: 'done', remote_id: id, url: id ? `https://www.facebook.com/${id}` : undefined };
}

async function pubInstagram(p: Post): Promise<Result> {
  const tok = env('INSTAGRAM_ACCESS_TOKEN'), user = env('INSTAGRAM_USER_ID');
  if (!tok || !user) return { channel: 'instagram', status: 'failed', error: 'Instagram is ACTIVATING — INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID not configured.' };
  if (!p.media_url) return { channel: 'instagram', status: 'failed', error: 'Instagram requires an image (media_url) — text-only posts are not supported by the Graph API.' };
  const caption = compose(p, 2200);
  const create = await fetch(`https://graph.facebook.com/v19.0/${user}/media`, { method: 'POST', body: new URLSearchParams({ image_url: p.media_url, caption, access_token: tok }) });
  if (!create.ok) return { channel: 'instagram', status: 'failed', error: `Instagram container ${create.status}: ${(await create.text()).slice(0, 200)}` };
  const cid = (await create.json().catch(() => ({})))?.id as string | undefined;
  if (!cid) return { channel: 'instagram', status: 'failed', error: 'Instagram did not return a container id.' };
  const pub = await fetch(`https://graph.facebook.com/v19.0/${user}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: cid, access_token: tok }) });
  if (!pub.ok) return { channel: 'instagram', status: 'failed', error: `Instagram publish ${pub.status}: ${(await pub.text()).slice(0, 200)}` };
  const id = (await pub.json().catch(() => ({})))?.id as string | undefined;
  return { channel: 'instagram', status: 'done', remote_id: id };
}

async function pubTelegram(p: Post): Promise<Result> {
  const tok = env('TELEGRAM_BOT_TOKEN'), chat = env('TELEGRAM_CHAT_ID');
  if (!tok || !chat) return { channel: 'telegram', status: 'failed', error: 'Telegram is ACTIVATING — TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID not configured.' };
  const r = await fetch(`https://api.telegram.org/bot${tok}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: compose(p, 4096), disable_web_page_preview: false }),
  });
  if (!r.ok) return { channel: 'telegram', status: 'failed', error: `Telegram ${r.status}: ${(await r.text()).slice(0, 240)}` };
  const j = await r.json().catch(() => ({}));
  const id = j?.result?.message_id ? String(j.result.message_id) : undefined;
  return { channel: 'telegram', status: 'done', remote_id: id };
}

async function pubWhatsApp(p: Post): Promise<Result> {
  const tok = env('WHATSAPP_TOKEN'), phone = env('WHATSAPP_PHONE_ID'), to = env('WHATSAPP_RECIPIENTS');
  if (!tok || !phone || !to) return { channel: 'whatsapp', status: 'failed', error: 'WhatsApp is ROLLING OUT — WHATSAPP_TOKEN + WHATSAPP_PHONE_ID + WHATSAPP_RECIPIENTS not configured.' };
  const recipients = to.split(',').map((s) => s.trim()).filter(Boolean);
  const text = compose(p, 4000);
  let okCount = 0; let lastErr = '';
  for (const r of recipients) {
    const resp = await fetch(`https://graph.facebook.com/v19.0/${phone}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: r, type: 'text', text: { body: text, preview_url: true } }),
    });
    if (resp.ok) okCount++; else lastErr = `${resp.status}: ${(await resp.text()).slice(0, 160)}`;
  }
  if (okCount === 0) return { channel: 'whatsapp', status: 'failed', error: `WhatsApp delivery failed — ${lastErr}` };
  return { channel: 'whatsapp', status: 'done', remote_id: `${okCount}/${recipients.length}` };
}

const PUBLISHERS: Record<string, (p: Post) => Promise<Result>> = {
  linkedin: pubLinkedIn, x: pubX, twitter: pubX, facebook: pubFacebook,
  instagram: pubInstagram, telegram: pubTelegram, whatsapp: pubWhatsApp,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Connection-status probe.
  if (req.method === 'GET') return json({ connected: connected() });

  try {
    const payload = await req.json().catch(() => ({}));
    if (payload?.status === true) return json({ connected: connected() });

    const post: Post = { title: payload.title, body: payload.body, url: payload.url, media_url: payload.media_url };
    const channels: string[] = Array.isArray(payload.channels) ? payload.channels.map((c: unknown) => String(c).toLowerCase()).filter(Boolean) : [];
    if (!post.body && !post.title) return json({ error: 'A post body or title is required.' }, 400);
    if (channels.length === 0) return json({ error: 'At least one channel is required.' }, 400);

    const results = await Promise.all(channels.map(async (ch): Promise<Result> => {
      const pub = PUBLISHERS[ch];
      if (!pub) return { channel: ch, status: 'failed', error: `Unsupported channel: ${ch}` };
      try { return await pub(post); } catch (e) { return { channel: ch, status: 'failed', error: (e as Error).message }; }
    }));

    // Best-effort audit to pipeline_jobs (ignored if the table/RLS differ).
    try {
      const admin = createClient(env('SUPABASE_URL') ?? '', env('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
      await admin.from('pipeline_jobs').insert(results.map((r) => ({
        kind: 'social', provider: r.channel, status: r.status === 'done' ? 'done' : 'failed',
        title: post.title ?? null, result_url: r.url ?? null, result: r, error: r.error ?? null,
      })));
    } catch { /* audit is best-effort */ }

    return json({ results });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
