import { createHmac, timingSafeEqual } from 'node:crypto';

// HMAC-signed webhook deliveries. Each client webhook has its own secret; deliveries carry
// X-Sovereign-Signature so consumers can verify authenticity.

export interface WebhookDelivery {
  body: string;
  headers: Record<string, string>;
}

export function signWebhook(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

export function buildDelivery(event: string, data: unknown, secret: string): WebhookDelivery {
  const body = JSON.stringify({ event, data, sent_at: new Date().toISOString() });
  return {
    body,
    headers: {
      'Content-Type': 'application/json',
      'X-Sovereign-Event': event,
      'X-Sovereign-Signature': signWebhook(body, secret),
    },
  };
}

export function verifyWebhookSignature(body: string, signatureHeader: string, secret: string): boolean {
  const expected = signWebhook(body, secret);
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Fire-and-forget delivery to a set of endpoints; returns per-endpoint status. */
export async function deliver(
  endpoints: { url: string; secret: string }[],
  event: string,
  data: unknown,
): Promise<{ url: string; ok: boolean; status?: number; error?: string }[]> {
  return Promise.all(
    endpoints.map(async ({ url, secret }) => {
      const d = buildDelivery(event, data, secret);
      try {
        const r = await fetch(url, { method: 'POST', headers: d.headers, body: d.body });
        return { url, ok: r.ok, status: r.status };
      } catch (e) {
        return { url, ok: false, error: (e as Error).message };
      }
    }),
  );
}
