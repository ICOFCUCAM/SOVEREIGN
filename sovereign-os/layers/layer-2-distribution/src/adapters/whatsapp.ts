import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_RECIPIENT'];
const GRAPH = 'https://graph.facebook.com/v21.0';

// WhatsApp Cloud API message send. Note: WhatsApp *Channels* have no public posting API;
// this sends a message (text, or image when a media_url is present) to a recipient/number.
// https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
export const whatsapp: PlatformAdapter = {
  platform: 'whatsapp',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_RECIPIENT),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('whatsapp', REQUIRES);
    const text = [campaign.title, campaign.body].filter(Boolean).join('\n\n');
    const to = env.WHATSAPP_RECIPIENT!;

    const message = campaign.media_url
      ? { messaging_product: 'whatsapp', to, type: 'image', image: { link: campaign.media_url, caption: text } }
      : { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } };

    const r = await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const body = (await r.json().catch(() => ({}))) as { messages?: { id?: string }[]; error?: { message?: string } };
    const id = body.messages?.[0]?.id;
    if (!r.ok || !id) return { ok: false, platform: 'whatsapp', error: body.error?.message ?? `HTTP ${r.status}` };
    return { ok: true, platform: 'whatsapp', externalId: id };
  },
};
