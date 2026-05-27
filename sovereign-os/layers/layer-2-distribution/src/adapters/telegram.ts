import type { Campaign, PlatformAdapter, PublishResult } from '../types.js';
import { dormant } from '../types.js';

const REQUIRES = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];

// Telegram Bot API. Posts to a channel/chat: sendPhoto when a media_url is present,
// otherwise sendMessage. https://core.telegram.org/bots/api
export const telegram: PlatformAdapter = {
  platform: 'telegram',
  requires: REQUIRES,
  ready: (env = process.env) => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
  async publish(campaign: Campaign, env = process.env): Promise<PublishResult> {
    if (!this.ready(env)) return dormant('telegram', REQUIRES);
    const token = env.TELEGRAM_BOT_TOKEN!;
    const chatId = env.TELEGRAM_CHAT_ID!;
    const text = [campaign.title, campaign.body].filter(Boolean).join('\n\n');

    const method = campaign.media_url ? 'sendPhoto' : 'sendMessage';
    const payload = campaign.media_url
      ? { chat_id: chatId, photo: campaign.media_url, caption: text }
      : { chat_id: chatId, text };

    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await r.json().catch(() => ({}))) as { ok?: boolean; result?: { message_id?: number }; description?: string };
    if (!r.ok || !body.ok) {
      return { ok: false, platform: 'telegram', error: body.description ?? `HTTP ${r.status}` };
    }
    return { ok: true, platform: 'telegram', externalId: String(body.result?.message_id ?? '') };
  },
};
