import type { DealEvent } from "./deal-events";
import { setPersistenceAdapter } from "./deal-events";
import type { Listing } from "./listings";
import { setListingsAdapter, setListingOwner } from "./listings";
import { SupabaseExitApi, supabaseConfigFromEnv } from "./supabase-exit-api";
import { ensureSupabaseSession } from "./supabase-auth";

// ── THE EXIT-API CONTRACT ───────────────────────────────────────────
// The boundary between this client and the multi-tenant backend. The whole
// app runs through swappable adapters; this defines the ONE interface a real
// backend must implement, plus reference implementations. connectExitApi()
// hydrates the stores and write-throughs every change — so going from a
// single-browser cache to a shared, multi-tenant backend is a config swap,
// never a rewrite of capture, matching or scoring logic.
//
// The contract is deliberately COMPLETE before the backend is built — every
// entity the network needs has a home here, so the backend implements a
// frozen surface and consumers never change again:
//   Accounts · Organizations · Listings · Events · NDA Requests ·
//   Buyer Interest (events) · Offers · Documents · Notifications

export type AccountRole = "founder" | "buyer" | "advisor";
export interface Account { readonly id: string; readonly role: AccountRole; readonly name: string; readonly createdAt: string }

/** A multi-user organization — a fund, a strategic acquirer, an advisory
 *  team. Accounts act within an org; ownership + membership gate access. */
export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly ownerAccountId: string;
  readonly memberIds: readonly string[];
  readonly createdAt: string;
}

export type NdaStatus = "requested" | "signed" | "rejected";
/** A first-class NDA request between a buyer and a listing. Buyer interest
 *  is captured as DealEvents; an NDA REQUEST is a tracked record with a
 *  lifecycle (requested → signed/rejected) the founder resolves. */
export interface NdaRequest {
  readonly id: string;
  readonly listingId: string;
  readonly buyerAccountId: string;
  readonly status: NdaStatus;
  readonly requestedAt: string;
  readonly resolvedAt: string | null;
}

export type OfferStatus = "submitted" | "accepted" | "rejected" | "withdrawn";
/** A price/terms offer a buyer submits against a listing. */
export interface Offer {
  readonly id: string;
  readonly listingId: string;
  readonly buyerAccountId: string;
  readonly amountUsd: number;
  readonly status: OfferStatus;
  readonly note: string | null;
  readonly createdAt: string;
}

export type DocVisibility = "founder" | "post_nda" | "public";
/** A document attached to a listing (CIM, financials, data-room file).
 *  Visibility gates who can fetch it; the audit trail rides on DealEvents. */
export interface DealDocument {
  readonly id: string;
  readonly listingId: string;
  readonly name: string;
  readonly kind: string;
  readonly uri: string;
  readonly visibility: DocVisibility;
  readonly uploadedByAccountId: string;
  readonly createdAt: string;
}

export type NotificationKind = "buyer_activity" | "listing_activity" | "nda_event" | "offer_event";
/** A notification delivered to an account (buyer activity on my listing,
 *  a new listing in my mandate, an NDA event, an offer event). */
export interface Notification {
  readonly id: string;
  readonly accountId: string;
  readonly kind: NotificationKind;
  readonly subjectId: string;
  readonly message: string;
  readonly read: boolean;
  readonly createdAt: string;
}

export interface NdaFilter { listingId?: string; buyerAccountId?: string }
export interface OfferFilter { listingId?: string; buyerAccountId?: string }

/** Implemented in-memory + localStorage below; in production SupabaseExitApi
 *  (or any network client) implements exactly this interface. */
export interface ExitApiClient {
  // ── accounts ──
  upsertAccount(a: Account): Promise<Account>;
  getAccount(id: string): Promise<Account | null>;

  // ── organizations ──
  upsertOrganization(o: Organization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | null>;
  listOrganizationsForAccount(accountId: string): Promise<Organization[]>;

  // ── deal events (per account stream + cross-actor subject scan) ──
  listEvents(accountId: string): Promise<DealEvent[]>;
  saveEvents(accountId: string, events: readonly DealEvent[]): Promise<void>;
  // events targeting a subject (a listing / buyer) across ALL actors — this
  // is how a founder sees buyer interest on their listing (= buyer interest)
  listEventsForSubject(subjectId: string): Promise<DealEvent[]>;

  // ── listings (the shared marketplace pool) ──
  listListings(): Promise<Listing[]>;
  saveListings(listings: readonly Listing[]): Promise<void>;

  // ── NDA requests ──
  createNdaRequest(input: { listingId: string; buyerAccountId: string }): Promise<NdaRequest>;
  listNdaRequests(filter: NdaFilter): Promise<NdaRequest[]>;
  updateNdaRequest(id: string, patch: { status: NdaStatus }): Promise<NdaRequest>;

  // ── offers ──
  createOffer(input: { listingId: string; buyerAccountId: string; amountUsd: number; note?: string }): Promise<Offer>;
  listOffers(filter: OfferFilter): Promise<Offer[]>;
  updateOffer(id: string, patch: { status?: OfferStatus; amountUsd?: number; note?: string }): Promise<Offer>;

  // ── documents ──
  putDocument(input: { listingId: string; name: string; kind: string; uri: string; visibility: DocVisibility; uploadedByAccountId: string }): Promise<DealDocument>;
  listDocuments(listingId: string): Promise<DealDocument[]>;

  // ── notifications ──
  pushNotification(input: { accountId: string; kind: NotificationKind; subjectId: string; message: string }): Promise<Notification>;
  listNotifications(accountId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
}

const rid = (p: string): string => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const nowIso = (): string => new Date().toISOString();

/** Reference implementation. A real backend swaps this for a network client
 *  implementing the same interface — nothing else in the app changes. */
export class InMemoryExitApi implements ExitApiClient {
  private accounts = new Map<string, Account>();
  private orgs = new Map<string, Organization>();
  private events = new Map<string, DealEvent[]>();
  private listings: Listing[] = [];
  private ndas: NdaRequest[] = [];
  private offers: Offer[] = [];
  private documents: DealDocument[] = [];
  private notifications: Notification[] = [];

  async upsertAccount(a: Account): Promise<Account> { this.accounts.set(a.id, a); return a; }
  async getAccount(id: string): Promise<Account | null> { return this.accounts.get(id) ?? null; }

  async upsertOrganization(o: Organization): Promise<Organization> { this.orgs.set(o.id, o); return o; }
  async getOrganization(id: string): Promise<Organization | null> { return this.orgs.get(id) ?? null; }
  async listOrganizationsForAccount(accountId: string): Promise<Organization[]> {
    return [...this.orgs.values()].filter((o) => o.ownerAccountId === accountId || o.memberIds.includes(accountId));
  }

  async listEvents(accountId: string): Promise<DealEvent[]> { return [...(this.events.get(accountId) ?? [])]; }
  async saveEvents(accountId: string, events: readonly DealEvent[]): Promise<void> { this.events.set(accountId, [...events]); }
  async listEventsForSubject(subjectId: string): Promise<DealEvent[]> {
    return [...this.events.values()].flat().filter((e) => e.subjectId === subjectId);
  }

  async listListings(): Promise<Listing[]> { return [...this.listings]; }
  async saveListings(listings: readonly Listing[]): Promise<void> { this.listings = [...listings]; }

  async createNdaRequest(input: { listingId: string; buyerAccountId: string }): Promise<NdaRequest> {
    const r: NdaRequest = { id: rid("nda"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, status: "requested", requestedAt: nowIso(), resolvedAt: null };
    this.ndas.push(r); return r;
  }
  async listNdaRequests(filter: NdaFilter): Promise<NdaRequest[]> {
    return this.ndas.filter((r) => (!filter.listingId || r.listingId === filter.listingId) && (!filter.buyerAccountId || r.buyerAccountId === filter.buyerAccountId));
  }
  async updateNdaRequest(id: string, patch: { status: NdaStatus }): Promise<NdaRequest> {
    const i = this.ndas.findIndex((r) => r.id === id); if (i < 0) throw new Error(`nda ${id} not found`);
    this.ndas[i] = { ...this.ndas[i], status: patch.status, resolvedAt: patch.status === "requested" ? null : nowIso() }; return this.ndas[i];
  }

  async createOffer(input: { listingId: string; buyerAccountId: string; amountUsd: number; note?: string }): Promise<Offer> {
    const o: Offer = { id: rid("off"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, amountUsd: input.amountUsd, status: "submitted", note: input.note ?? null, createdAt: nowIso() };
    this.offers.push(o); return o;
  }
  async listOffers(filter: OfferFilter): Promise<Offer[]> {
    return this.offers.filter((o) => (!filter.listingId || o.listingId === filter.listingId) && (!filter.buyerAccountId || o.buyerAccountId === filter.buyerAccountId));
  }
  async updateOffer(id: string, patch: { status?: OfferStatus; amountUsd?: number; note?: string }): Promise<Offer> {
    const i = this.offers.findIndex((o) => o.id === id); if (i < 0) throw new Error(`offer ${id} not found`);
    this.offers[i] = { ...this.offers[i], ...patch }; return this.offers[i];
  }

  async putDocument(input: { listingId: string; name: string; kind: string; uri: string; visibility: DocVisibility; uploadedByAccountId: string }): Promise<DealDocument> {
    const d: DealDocument = { id: rid("doc"), createdAt: nowIso(), ...input };
    this.documents.push(d); return d;
  }
  async listDocuments(listingId: string): Promise<DealDocument[]> { return this.documents.filter((d) => d.listingId === listingId); }

  async pushNotification(input: { accountId: string; kind: NotificationKind; subjectId: string; message: string }): Promise<Notification> {
    const n: Notification = { id: rid("ntf"), read: false, createdAt: nowIso(), ...input };
    this.notifications.push(n); return n;
  }
  async listNotifications(accountId: string): Promise<Notification[]> { return this.notifications.filter((n) => n.accountId === accountId); }
  async markNotificationRead(id: string): Promise<void> {
    const i = this.notifications.findIndex((n) => n.id === id); if (i >= 0) this.notifications[i] = { ...this.notifications[i], read: true };
  }
}

// ── durable, browser-side implementation ────────────────────────────
// Same contract, persisted to localStorage and keyed by entity — so the app
// is durable and account-scoped today, and the production exit-api swaps in
// without touching any consumer.
interface Store {
  accounts: Record<string, Account>;
  organizations: Record<string, Organization>;
  events: Record<string, DealEvent[]>;
  listings: Listing[];
  ndaRequests: NdaRequest[];
  offers: Offer[];
  documents: DealDocument[];
  notifications: Notification[];
}
const SKEY = "exitos.backend.v1";
const emptyStore = (): Store => ({ accounts: {}, organizations: {}, events: {}, listings: [], ndaRequests: [], offers: [], documents: [], notifications: [] });

export class LocalStorageExitApi implements ExitApiClient {
  private read(): Store {
    try { return { ...emptyStore(), ...(JSON.parse(globalThis.localStorage?.getItem(SKEY) ?? "{}") as Partial<Store>) }; }
    catch { return emptyStore(); }
  }
  private write(s: Store): void { try { globalThis.localStorage?.setItem(SKEY, JSON.stringify(s)); } catch { /* in-memory */ } }

  async upsertAccount(a: Account): Promise<Account> { const s = this.read(); s.accounts[a.id] = a; this.write(s); return a; }
  async getAccount(id: string): Promise<Account | null> { return this.read().accounts[id] ?? null; }

  async upsertOrganization(o: Organization): Promise<Organization> { const s = this.read(); s.organizations[o.id] = o; this.write(s); return o; }
  async getOrganization(id: string): Promise<Organization | null> { return this.read().organizations[id] ?? null; }
  async listOrganizationsForAccount(accountId: string): Promise<Organization[]> {
    return Object.values(this.read().organizations).filter((o) => o.ownerAccountId === accountId || o.memberIds.includes(accountId));
  }

  async listEvents(accountId: string): Promise<DealEvent[]> { return this.read().events[accountId] ?? []; }
  async saveEvents(accountId: string, events: readonly DealEvent[]): Promise<void> { const s = this.read(); s.events[accountId] = [...events]; this.write(s); }
  async listEventsForSubject(subjectId: string): Promise<DealEvent[]> { return Object.values(this.read().events).flat().filter((e) => e.subjectId === subjectId); }

  async listListings(): Promise<Listing[]> { return this.read().listings; }
  async saveListings(listings: readonly Listing[]): Promise<void> { const s = this.read(); s.listings = [...listings]; this.write(s); }

  async createNdaRequest(input: { listingId: string; buyerAccountId: string }): Promise<NdaRequest> {
    const s = this.read(); const r: NdaRequest = { id: rid("nda"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, status: "requested", requestedAt: nowIso(), resolvedAt: null };
    s.ndaRequests.push(r); this.write(s); return r;
  }
  async listNdaRequests(filter: NdaFilter): Promise<NdaRequest[]> {
    return this.read().ndaRequests.filter((r) => (!filter.listingId || r.listingId === filter.listingId) && (!filter.buyerAccountId || r.buyerAccountId === filter.buyerAccountId));
  }
  async updateNdaRequest(id: string, patch: { status: NdaStatus }): Promise<NdaRequest> {
    const s = this.read(); const i = s.ndaRequests.findIndex((r) => r.id === id); if (i < 0) throw new Error(`nda ${id} not found`);
    s.ndaRequests[i] = { ...s.ndaRequests[i], status: patch.status, resolvedAt: patch.status === "requested" ? null : nowIso() }; this.write(s); return s.ndaRequests[i];
  }

  async createOffer(input: { listingId: string; buyerAccountId: string; amountUsd: number; note?: string }): Promise<Offer> {
    const s = this.read(); const o: Offer = { id: rid("off"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, amountUsd: input.amountUsd, status: "submitted", note: input.note ?? null, createdAt: nowIso() };
    s.offers.push(o); this.write(s); return o;
  }
  async listOffers(filter: OfferFilter): Promise<Offer[]> {
    return this.read().offers.filter((o) => (!filter.listingId || o.listingId === filter.listingId) && (!filter.buyerAccountId || o.buyerAccountId === filter.buyerAccountId));
  }
  async updateOffer(id: string, patch: { status?: OfferStatus; amountUsd?: number; note?: string }): Promise<Offer> {
    const s = this.read(); const i = s.offers.findIndex((o) => o.id === id); if (i < 0) throw new Error(`offer ${id} not found`);
    s.offers[i] = { ...s.offers[i], ...patch }; this.write(s); return s.offers[i];
  }

  async putDocument(input: { listingId: string; name: string; kind: string; uri: string; visibility: DocVisibility; uploadedByAccountId: string }): Promise<DealDocument> {
    const s = this.read(); const d: DealDocument = { id: rid("doc"), createdAt: nowIso(), ...input };
    s.documents.push(d); this.write(s); return d;
  }
  async listDocuments(listingId: string): Promise<DealDocument[]> { return this.read().documents.filter((d) => d.listingId === listingId); }

  async pushNotification(input: { accountId: string; kind: NotificationKind; subjectId: string; message: string }): Promise<Notification> {
    const s = this.read(); const n: Notification = { id: rid("ntf"), read: false, createdAt: nowIso(), ...input };
    s.notifications.push(n); this.write(s); return n;
  }
  async listNotifications(accountId: string): Promise<Notification[]> { return this.read().notifications.filter((n) => n.accountId === accountId); }
  async markNotificationRead(id: string): Promise<void> {
    const s = this.read(); const i = s.notifications.findIndex((n) => n.id === id); if (i >= 0) { s.notifications[i] = { ...s.notifications[i], read: true }; this.write(s); }
  }
}

// ── DEPENDENCY INJECTION — the one place the backend is chosen ───────
// Swapping InMemory → LocalStorage → Supabase is THIS function only. No UI,
// store or engine change. If Supabase env config is present, the production
// backend is selected automatically; otherwise the durable browser cache.
export function createExitApi(): ExitApiClient {
  const cfg = supabaseConfigFromEnv();
  if (cfg) return new SupabaseExitApi(cfg);
  return new LocalStorageExitApi();
}

// ── THE LIVE BACKEND SINGLETON ──────────────────────────────────────
// One durable client the running app talks to, chosen by createExitApi().
// Every consumer only ever touches the stores, never this client directly —
// so the dependency injection above is the entire backend-swap surface.
let active: ExitApiClient = createExitApi();

/** The live client, for query accessors. */
export function backendClient(): ExitApiClient { return active; }

/** Activate the live backend for a signed-in account: point every store at
 *  it so this session is durable and account-scoped. Called on sign-in.
 *
 *  With Supabase selected we first obtain a real authenticated session so
 *  the backend runs as that user (RLS scopes to auth.uid()), and bind the
 *  account id to the auth user id. If auth is unreachable or disabled, we
 *  fall back to the durable local backend so the app never breaks. */
export async function activateBackend(account: Account): Promise<void> {
  if (active instanceof SupabaseExitApi) {
    try {
      const session = await ensureSupabaseSession(active.config);
      active.setAccessToken(session.accessToken, session.userId);
      account = { ...account, id: session.userId };   // account id == auth.uid()
    } catch (err) {
      console.warn("[exitos] Supabase auth unavailable — using durable local backend.", err);
      active = new LocalStorageExitApi();
    }
  }
  await connectExitApi(active, account);
}

/** Query accessor — events targeting a subject (a listing the founder owns,
 *  a buyer) across ALL actors. This is how a founder sees the buyer interest
 *  and NDA requests landing on their listing. */
export async function eventsForSubject(subjectId: string): Promise<DealEvent[]> {
  return active.listEventsForSubject(subjectId);
}

/** Point the app's stores at a backend. After this, captured events and
 *  listings persist through the API (network-wide, per account) instead of
 *  localStorage — the multi-tenant spine, with no consumer changes. */
export async function connectExitApi(client: ExitApiClient, account: Account): Promise<void> {
  await client.upsertAccount(account);
  // stamp this account as the owner of any listing it creates this session
  setListingOwner(account.id);

  // listings — the shared pool (mutated in place so read() stays stable)
  const listings = await client.listListings();
  setListingsAdapter({
    read: () => listings,
    write: (l) => { listings.length = 0; listings.push(...l); void client.saveListings(l); },
  });

  // deal events — this account's own stream
  const events = await client.listEvents(account.id);
  setPersistenceAdapter({
    read: () => events,
    write: (e) => { events.length = 0; events.push(...e); void client.saveEvents(account.id, e); },
  });
}
