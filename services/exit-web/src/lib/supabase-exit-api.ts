import type {
  ExitApiClient, Account, Organization, NdaRequest, NdaStatus, NdaFilter,
  Offer, OfferStatus, OfferFilter, DealDocument, DocVisibility,
  Notification, NotificationKind,
} from "./exit-api";
import type { DealEvent } from "./deal-events";
import type { Listing } from "./listings";

// ── THE FIRST PRODUCTION BACKEND ────────────────────────────────────
// SupabaseExitApi satisfies ExitApiClient EXACTLY, over the Supabase REST
// (PostgREST) API. Selecting it is dependency injection only (see
// createExitApi) — no UI, store or engine changes. It speaks plain fetch so
// the app carries no extra dependency; pass a fetchImpl to test the swap
// without a live project.
//
// Storage shape: every table is { id, <filter columns…>, data jsonb }. The
// full typed record lives in `data`, so the rich contract types round-trip
// losslessly and the client stays tiny; scalar columns exist only to filter
// and to drive row-level security. The migration is in
// supabase/migrations — RLS there is what makes multi-tenancy real.

export interface SupabaseConfig {
  url: string;            // https://<ref>.supabase.co
  anonKey: string;
  accessToken?: string;   // a signed-in user's JWT; defaults to anonKey
  fetchImpl?: typeof fetch;
}

/** Read Supabase config from Vite env. Returns null when unset — the DI
 *  factory then falls back to the durable browser cache. */
export function supabaseConfigFromEnv(): SupabaseConfig | null {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  // never select the network backend under test — tests assert the durable
  // LocalStorage path; the swap itself is proven by injecting a mock fetch.
  if (env.MODE === "test" || env.VITEST) return null;
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

const rid = (p: string): string => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const nowIso = (): string => new Date().toISOString();
const enc = (v: string): string => encodeURIComponent(v);

export class SupabaseExitApi implements ExitApiClient {
  private accessToken?: string;
  private userId?: string;
  constructor(private readonly cfg: SupabaseConfig) { this.accessToken = cfg.accessToken; }

  /** The signed-in user's JWT + id — set after auth so requests run as that
   *  user and RLS scopes to auth.uid(). Without it, requests run as anon. */
  setAccessToken(token?: string, userId?: string): void { this.accessToken = token; this.userId = userId; }
  get config(): SupabaseConfig { return this.cfg; }

  private get f(): typeof fetch {
    const impl = this.cfg.fetchImpl ?? globalThis.fetch;
    return (...args: Parameters<typeof fetch>) => impl(...args);
  }

  private async rq<T>(path: string, init?: RequestInit & { prefer?: string }): Promise<T> {
    const res = await this.f(`${this.cfg.url}/rest/v1/${path}`, {
      method: init?.method ?? "GET",
      body: init?.body,
      headers: {
        apikey: this.cfg.anonKey,
        Authorization: `Bearer ${this.accessToken ?? this.cfg.anonKey}`,
        "Content-Type": "application/json",
        ...(init?.prefer ? { Prefer: init.prefer } : {}),
      },
    });
    if (!res.ok) throw new Error(`exit-api ${res.status}: ${await res.text().catch(() => "")}`);
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** SELECT … returning the typed `data` payload of each row. */
  private async rows<T>(table: string, query = ""): Promise<T[]> {
    const r = await this.rq<{ data: T }[]>(`${table}?select=data${query ? `&${query}` : ""}`);
    return (r ?? []).map((x) => x.data);
  }

  /** UPSERT rows (id-conflict merge). Rows are { id, …filters, data }. */
  private async upsert(table: string, rows: object[]): Promise<void> {
    if (!rows.length) return;
    await this.rq(table, { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: JSON.stringify(rows) });
  }

  // ── accounts ──
  async upsertAccount(a: Account): Promise<Account> { await this.upsert("exitos_accounts", [{ id: a.id, role: a.role, data: a }]); return a; }
  async getAccount(id: string): Promise<Account | null> { return (await this.rows<Account>("exitos_accounts", `id=eq.${enc(id)}`))[0] ?? null; }

  // ── organizations ──
  async upsertOrganization(o: Organization): Promise<Organization> { await this.upsert("exitos_organizations", [{ id: o.id, owner_account_id: o.ownerAccountId, data: o }]); return o; }
  async getOrganization(id: string): Promise<Organization | null> { return (await this.rows<Organization>("exitos_organizations", `id=eq.${enc(id)}`))[0] ?? null; }
  async listOrganizationsForAccount(accountId: string): Promise<Organization[]> {
    // owner OR member — fetch and filter to mirror the reference semantics
    return (await this.rows<Organization>("exitos_organizations")).filter((o) => o.ownerAccountId === accountId || o.memberIds.includes(accountId));
  }

  // ── deal events ──
  async listEvents(accountId: string): Promise<DealEvent[]> { return this.rows<DealEvent>("exitos_deal_events", `account_id=eq.${enc(accountId)}`); }
  async saveEvents(accountId: string, events: readonly DealEvent[]): Promise<void> {
    // replace this account's stream: delete then insert (the contract's set-semantics)
    await this.rq(`exitos_deal_events?account_id=eq.${enc(accountId)}`, { method: "DELETE", prefer: "return=minimal" });
    await this.upsert("exitos_deal_events", events.map((e) => ({ id: e.id, account_id: accountId, subject_id: e.subjectId, data: e })));
  }
  async listEventsForSubject(subjectId: string): Promise<DealEvent[]> { return this.rows<DealEvent>("exitos_deal_events", `subject_id=eq.${enc(subjectId)}`); }

  // ── listings (shared pool, owner-scoped writes) ──
  async listListings(): Promise<Listing[]> { return this.rows<Listing>("exitos_listings"); }
  async saveListings(listings: readonly Listing[]): Promise<void> {
    // owner-scoped RLS only permits writing one's own listings; send just
    // those (others already live in the pool, written by their owners).
    const mine = this.userId ? listings.filter((l) => l.ownerAccountId === this.userId) : listings;
    await this.upsert("exitos_listings", mine.map((l) => ({ id: l.id, owner_account_id: l.ownerAccountId ?? null, data: l })));
  }

  // ── NDA requests ──
  async createNdaRequest(input: { listingId: string; buyerAccountId: string }): Promise<NdaRequest> {
    const r: NdaRequest = { id: rid("nda"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, status: "requested", requestedAt: nowIso(), resolvedAt: null };
    await this.upsert("exitos_nda_requests", [{ id: r.id, listing_id: r.listingId, buyer_account_id: r.buyerAccountId, data: r }]);
    return r;
  }
  async listNdaRequests(filter: NdaFilter): Promise<NdaRequest[]> {
    const q = [filter.listingId && `listing_id=eq.${enc(filter.listingId)}`, filter.buyerAccountId && `buyer_account_id=eq.${enc(filter.buyerAccountId)}`].filter(Boolean).join("&");
    return this.rows<NdaRequest>("exitos_nda_requests", q);
  }
  async updateNdaRequest(id: string, patch: { status: NdaStatus }): Promise<NdaRequest> {
    const cur = (await this.rows<NdaRequest>("exitos_nda_requests", `id=eq.${enc(id)}`))[0];
    if (!cur) throw new Error(`nda ${id} not found`);
    const next: NdaRequest = { ...cur, status: patch.status, resolvedAt: patch.status === "requested" ? null : nowIso() };
    await this.upsert("exitos_nda_requests", [{ id: next.id, listing_id: next.listingId, buyer_account_id: next.buyerAccountId, data: next }]);
    return next;
  }

  // ── offers ──
  async createOffer(input: { listingId: string; buyerAccountId: string; amountUsd: number; note?: string }): Promise<Offer> {
    const o: Offer = { id: rid("off"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, amountUsd: input.amountUsd, status: "submitted", note: input.note ?? null, createdAt: nowIso() };
    await this.upsert("exitos_offers", [{ id: o.id, listing_id: o.listingId, buyer_account_id: o.buyerAccountId, data: o }]);
    return o;
  }
  async listOffers(filter: OfferFilter): Promise<Offer[]> {
    const q = [filter.listingId && `listing_id=eq.${enc(filter.listingId)}`, filter.buyerAccountId && `buyer_account_id=eq.${enc(filter.buyerAccountId)}`].filter(Boolean).join("&");
    return this.rows<Offer>("exitos_offers", q);
  }
  async updateOffer(id: string, patch: { status?: OfferStatus; amountUsd?: number; note?: string }): Promise<Offer> {
    const cur = (await this.rows<Offer>("exitos_offers", `id=eq.${enc(id)}`))[0];
    if (!cur) throw new Error(`offer ${id} not found`);
    const next: Offer = { ...cur, ...patch };
    await this.upsert("exitos_offers", [{ id: next.id, listing_id: next.listingId, buyer_account_id: next.buyerAccountId, data: next }]);
    return next;
  }

  // ── documents ──
  async putDocument(input: { listingId: string; name: string; kind: string; uri: string; visibility: DocVisibility; uploadedByAccountId: string }): Promise<DealDocument> {
    const d: DealDocument = { id: rid("doc"), createdAt: nowIso(), ...input };
    await this.upsert("exitos_documents", [{ id: d.id, listing_id: d.listingId, data: d }]);
    return d;
  }
  async listDocuments(listingId: string): Promise<DealDocument[]> { return this.rows<DealDocument>("exitos_documents", `listing_id=eq.${enc(listingId)}`); }

  // ── notifications ──
  async pushNotification(input: { accountId: string; kind: NotificationKind; subjectId: string; message: string }): Promise<Notification> {
    const n: Notification = { id: rid("ntf"), read: false, createdAt: nowIso(), ...input };
    await this.upsert("exitos_notifications", [{ id: n.id, account_id: n.accountId, data: n }]);
    return n;
  }
  async listNotifications(accountId: string): Promise<Notification[]> { return this.rows<Notification>("exitos_notifications", `account_id=eq.${enc(accountId)}`); }
  async markNotificationRead(id: string): Promise<void> {
    const cur = (await this.rows<Notification>("exitos_notifications", `id=eq.${enc(id)}`))[0];
    if (!cur) return;
    const next: Notification = { ...cur, read: true };
    await this.upsert("exitos_notifications", [{ id: next.id, account_id: next.accountId, data: next }]);
  }
}
