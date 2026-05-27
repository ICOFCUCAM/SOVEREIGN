// ── Openprovider DNS API abstraction ──────────────────────────────────
// Modular, scalable client over the Openprovider v1beta API. Handles token
// auth (cached per instance), centralized endpoints, and light in-call retry
// with exponential backoff. Durable retries are handled by the dns-worker
// job queue. Reads credentials from env:
//   OPENPROVIDER_USERNAME, OPENPROVIDER_PASSWORD
// Optional: OPENPROVIDER_BASE_URL (defaults to the production API).

const DEFAULT_BASE = 'https://api.openprovider.eu';

// Centralized endpoint map — adjust here if the provider revises paths.
export const OP = {
  login: '/v1beta/auth/login',
  nameservers: '/v1beta/dns/nameservers',
  nameserver: (id: string) => `/v1beta/dns/nameservers/${encodeURIComponent(id)}`,
  zones: '/v1beta/dns/zones',
  zone: (name: string) => `/v1beta/dns/zones/${encodeURIComponent(name)}`,
};

export class OpenproviderNotConfigured extends Error {}
export class OpenproviderError extends Error {
  constructor(message: string, public status: number, public body?: unknown, public retryable = false) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface OpRecord { type: string; name: string; value: string; ttl?: number; prio?: number }

export class OpenproviderClient {
  private base: string;
  private username?: string;
  private password?: string;
  private token: string | null = null;

  constructor() {
    this.base = Deno.env.get('OPENPROVIDER_BASE_URL') || DEFAULT_BASE;
    this.username = Deno.env.get('OPENPROVIDER_USERNAME') || undefined;
    this.password = Deno.env.get('OPENPROVIDER_PASSWORD') || undefined;
  }

  get configured(): boolean {
    return Boolean(this.username && this.password);
  }

  private assertConfigured() {
    if (!this.configured) {
      throw new OpenproviderNotConfigured('OPENPROVIDER_USERNAME / OPENPROVIDER_PASSWORD are not configured.');
    }
  }

  async login(): Promise<string> {
    this.assertConfigured();
    const resp = await fetch(this.base + OP.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.password, ip: '0.0.0.0' }),
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new OpenproviderError('Openprovider auth failed', resp.status, body, resp.status >= 500);
    const token = body?.data?.token;
    if (!token) throw new OpenproviderError('Openprovider auth returned no token', 502, body);
    this.token = token;
    return token;
  }

  // Core request with auth + bounded in-call retry (durable retry is the worker's job).
  async request<T = unknown>(method: string, path: string, body?: unknown, attempt = 0): Promise<T> {
    this.assertConfigured();
    if (!this.token) await this.login();

    let resp: Response;
    try {
      resp = await fetch(this.base + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      // network error — retryable
      if (attempt < 2) { await sleep(400 * (attempt + 1)); return this.request<T>(method, path, body, attempt + 1); }
      throw new OpenproviderError(`Network error: ${(e as Error).message}`, 0, undefined, true);
    }

    if (resp.status === 401 && attempt === 0) {
      // token expired — re-auth once and retry
      this.token = null;
      await this.login();
      return this.request<T>(method, path, body, attempt + 1);
    }

    const parsed = await resp.json().catch(() => ({})) as { code?: number; desc?: string; message?: string };
    // Openprovider returns HTTP 200 with a non-zero `code` on logical errors.
    if (resp.ok && (parsed?.code === undefined || parsed.code === 0)) return parsed as T;

    const status = resp.ok ? 400 : resp.status;
    const retryable = status === 429 || status >= 500;
    if (retryable && attempt < 2) {
      await sleep(500 * Math.pow(2, attempt));
      return this.request<T>(method, path, body, attempt + 1);
    }
    const msg = parsed?.desc || parsed?.message || `Openprovider ${status}${parsed?.code ? ` (code ${parsed.code})` : ''}`;
    throw new OpenproviderError(msg, status, parsed, retryable);
  }

  // ── Nameservers ──
  listNameservers() { return this.request('GET', OP.nameservers); }
  createNameserver(input: { name: string; ip?: string; ip6?: string }) {
    return this.request('POST', OP.nameservers, { name: input.name, ip: input.ip, ip6: input.ip6 });
  }
  updateNameserver(id: string, input: { ip?: string; ip6?: string }) {
    return this.request('PUT', OP.nameserver(id), { ip: input.ip, ip6: input.ip6 });
  }

  // ── Zones ──
  listZones() { return this.request('GET', OP.zones); }
  // Openprovider expects the zone as { domain: { name, extension } }. Split on the
  // first dot: "op-demozone.nl" -> name "op-demozone", extension "nl".
  createZone(input: { name: string; type?: string; records?: OpRecord[]; secured?: boolean }) {
    const dot = input.name.indexOf('.');
    const host = dot === -1 ? input.name : input.name.slice(0, dot);
    const extension = dot === -1 ? '' : input.name.slice(dot + 1);
    return this.request('POST', OP.zones, {
      domain: { name: host, extension },
      type: input.type || 'master',
      records: input.records || [],
      secured: Boolean(input.secured),
    });
  }
  deleteZone(name: string) { return this.request('DELETE', OP.zone(name)); }
  // Records are modified via a zone PUT with add/remove/update sets. The update
  // set pairs the existing record (original_record) with its replacement (record).
  modifyRecords(name: string, ops: { add?: OpRecord[]; remove?: OpRecord[]; update?: Array<{ original: OpRecord; record: OpRecord }> }) {
    const update = (ops.update || []).map((u) => ({ original_record: u.original, record: u.record }));
    return this.request('PUT', OP.zone(name), { name, records: { add: ops.add || [], remove: ops.remove || [], update } });
  }
}
