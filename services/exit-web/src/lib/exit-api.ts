import type { DealEvent, DealEventKind } from "./deal-events";
import { setPersistenceAdapter, captureDealEvent } from "./deal-events";
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

// ── THE DEAL — the transaction object ───────────────────────────────
// One record per (listing × buyer), tracking the full acquisition lifecycle.
// This is the spine of the network: every transaction is a Deal advancing
// through the canonical stages. NDA requests, offers and documents attach to
// it; its stage is the single source of truth for where a transaction stands.
export type DealStage =
  | "draft" | "listed" | "qualified" | "nda_requested" | "nda_executed"
  | "management_meeting" | "ioi" | "loi" | "due_diligence" | "closed" | "withdrawn";

/** The ordered, advanceable pipeline (excludes the terminal "withdrawn"). */
export const DEAL_STAGES: ReadonlyArray<{ stage: DealStage; label: string }> = [
  { stage: "listed", label: "Listed" },
  { stage: "qualified", label: "Qualified" },
  { stage: "nda_requested", label: "NDA Requested" },
  { stage: "nda_executed", label: "NDA Executed" },
  { stage: "management_meeting", label: "Management Meeting" },
  { stage: "ioi", label: "IOI" },
  { stage: "loi", label: "LOI" },
  { stage: "due_diligence", label: "Due Diligence" },
  { stage: "closed", label: "Closed" },
];
export const dealStageIndex = (s: DealStage): number => DEAL_STAGES.findIndex((d) => d.stage === s);

export interface Deal {
  readonly id: string;
  readonly listingId: string;
  readonly buyerAccountId: string;
  readonly stage: DealStage;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly history: ReadonlyArray<{ readonly stage: DealStage; readonly at: string }>;
}

// ── THE MANDATE — the persisted acquisition criteria ────────────────
// A buyer's standing acquisition mandate. Persisting it is what makes the
// other side of the market liquid: a mandate becomes matchable against every
// listing, and a listing becomes discoverable by every matching mandate.
export interface Mandate {
  readonly id: string;                          // == buyerAccountId (one live mandate per buyer)
  readonly buyerAccountId: string;
  readonly name: string;
  readonly sectors: readonly string[];
  readonly regions: readonly string[];
  readonly minCheckUsd: number;
  readonly maxCheckUsd: number;
  readonly minGrowthPct: number;
  readonly strategicThemes: readonly string[];
  readonly updatedAt: string;
}

export interface NdaFilter { listingId?: string; buyerAccountId?: string }
export interface OfferFilter { listingId?: string; buyerAccountId?: string }
export interface DealFilter { listingId?: string; buyerAccountId?: string }

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

  // ── deals (the transaction lifecycle) ──
  createDeal(input: { listingId: string; buyerAccountId: string; stage?: DealStage }): Promise<Deal>;
  listDeals(filter: DealFilter): Promise<Deal[]>;
  updateDeal(id: string, patch: { stage: DealStage }): Promise<Deal>;

  // ── mandates (the buyer side of liquidity) ──
  upsertMandate(m: Mandate): Promise<Mandate>;
  getMandate(buyerAccountId: string): Promise<Mandate | null>;
  listMandates(): Promise<Mandate[]>;
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
  private deals: Deal[] = [];
  private mandates = new Map<string, Mandate>();

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

  async createDeal(input: { listingId: string; buyerAccountId: string; stage?: DealStage }): Promise<Deal> {
    const existing = this.deals.find((d) => d.listingId === input.listingId && d.buyerAccountId === input.buyerAccountId);
    if (existing) return existing;                           // one deal per (listing, buyer)
    const stage = input.stage ?? "qualified", at = nowIso();
    const d: Deal = { id: rid("deal"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, stage, createdAt: at, updatedAt: at, history: [{ stage, at }] };
    this.deals.push(d); return d;
  }
  async listDeals(filter: DealFilter): Promise<Deal[]> {
    return this.deals.filter((d) => (!filter.listingId || d.listingId === filter.listingId) && (!filter.buyerAccountId || d.buyerAccountId === filter.buyerAccountId));
  }
  async updateDeal(id: string, patch: { stage: DealStage }): Promise<Deal> {
    const i = this.deals.findIndex((d) => d.id === id); if (i < 0) throw new Error(`deal ${id} not found`);
    const at = nowIso();
    this.deals[i] = { ...this.deals[i], stage: patch.stage, updatedAt: at, history: [...this.deals[i].history, { stage: patch.stage, at }] };
    return this.deals[i];
  }

  async upsertMandate(m: Mandate): Promise<Mandate> { this.mandates.set(m.buyerAccountId, m); return m; }
  async getMandate(buyerAccountId: string): Promise<Mandate | null> { return this.mandates.get(buyerAccountId) ?? null; }
  async listMandates(): Promise<Mandate[]> { return [...this.mandates.values()]; }
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
  deals: Deal[];
  mandates: Record<string, Mandate>;
}
const SKEY = "exitos.backend.v1";
const emptyStore = (): Store => ({ accounts: {}, organizations: {}, events: {}, listings: [], ndaRequests: [], offers: [], documents: [], notifications: [], deals: [], mandates: {} });

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

  async createDeal(input: { listingId: string; buyerAccountId: string; stage?: DealStage }): Promise<Deal> {
    const s = this.read();
    const existing = s.deals.find((d) => d.listingId === input.listingId && d.buyerAccountId === input.buyerAccountId);
    if (existing) return existing;
    const stage = input.stage ?? "qualified", at = nowIso();
    const d: Deal = { id: rid("deal"), listingId: input.listingId, buyerAccountId: input.buyerAccountId, stage, createdAt: at, updatedAt: at, history: [{ stage, at }] };
    s.deals.push(d); this.write(s); return d;
  }
  async listDeals(filter: DealFilter): Promise<Deal[]> {
    return this.read().deals.filter((d) => (!filter.listingId || d.listingId === filter.listingId) && (!filter.buyerAccountId || d.buyerAccountId === filter.buyerAccountId));
  }
  async updateDeal(id: string, patch: { stage: DealStage }): Promise<Deal> {
    const s = this.read(); const i = s.deals.findIndex((d) => d.id === id); if (i < 0) throw new Error(`deal ${id} not found`);
    const at = nowIso();
    s.deals[i] = { ...s.deals[i], stage: patch.stage, updatedAt: at, history: [...s.deals[i].history, { stage: patch.stage, at }] };
    this.write(s); return s.deals[i];
  }

  async upsertMandate(m: Mandate): Promise<Mandate> { const s = this.read(); s.mandates[m.buyerAccountId] = m; this.write(s); return m; }
  async getMandate(buyerAccountId: string): Promise<Mandate | null> { return this.read().mandates[buyerAccountId] ?? null; }
  async listMandates(): Promise<Mandate[]> { return Object.values(this.read().mandates); }
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

// ── the live account this session acts as ───────────────────────────
// Set on connect (== auth.uid() under Supabase). The NDA/offer accessors
// stamp it as the actor so RLS attributes records to the right buyer.
let connectedAccountId: string | undefined;
export function currentAccountId(): string | undefined { return connectedAccountId; }

// ── NDA requests (first-class records, owner-scoped resolution) ──────
/** Buyer action: request an NDA on a listing. Attributed to this account. */
export async function requestNda(listingId: string): Promise<NdaRequest | null> {
  if (!connectedAccountId) return null;
  return active.createNdaRequest({ listingId, buyerAccountId: connectedAccountId });
}
/** Founder view: the NDA requests on a listing they own. */
export async function ndaRequestsForListing(listingId: string): Promise<NdaRequest[]> {
  return active.listNdaRequests({ listingId });
}
/** Founder action: execute (sign) an NDA — only the listing owner may, by RLS. */
export async function signNda(id: string): Promise<NdaRequest> {
  return active.updateNdaRequest(id, { status: "signed" });
}

// ── offers (first-class records) ────────────────────────────────────
/** Buyer action: submit an offer on a listing. Attributed to this account. */
export async function submitOffer(listingId: string, amountUsd: number, note?: string): Promise<Offer | null> {
  if (!connectedAccountId) return null;
  return active.createOffer({ listingId, buyerAccountId: connectedAccountId, amountUsd, note });
}
/** Founder view: the offers on a listing they own. */
export async function offersForListing(listingId: string): Promise<Offer[]> {
  return active.listOffers({ listingId });
}
/** Founder action: accept/reject an offer — the listing owner may, by RLS. */
export async function resolveOffer(id: string, status: OfferStatus): Promise<Offer> {
  return active.updateOffer(id, { status });
}

// ── deals (the transaction lifecycle) ───────────────────────────────
// Advancing a deal also emits the matching telemetry event, so the captured
// stream — and every model that learns from it (buyer DNA, response/close
// rates, premium/probability) — improves with each real transaction step.
const STAGE_EVENT: Partial<Record<DealStage, DealEventKind>> = {
  qualified: "expressed_interest", nda_requested: "nda_requested", nda_executed: "nda_signed",
  management_meeting: "meeting_scheduled", ioi: "loi_issued", loi: "loi_issued",
  due_diligence: "diligence_started", closed: "closed", withdrawn: "walked_away",
};

/** Buyer action: open (or fetch) the deal on a listing at a starting stage. */
export async function startDeal(listingId: string, stage?: DealStage): Promise<Deal | null> {
  if (!connectedAccountId) return null;
  return active.createDeal({ listingId, buyerAccountId: connectedAccountId, stage });
}
export async function dealsForListing(listingId: string): Promise<Deal[]> { return active.listDeals({ listingId }); }
export async function dealsForBuyer(): Promise<Deal[]> { return connectedAccountId ? active.listDeals({ buyerAccountId: connectedAccountId }) : []; }
/** Advance a deal to a stage and capture the matching telemetry event. */
export async function advanceDeal(deal: Deal, stage: DealStage, actorRole: "founder" | "buyer" = "founder", subjectName?: string): Promise<Deal> {
  const updated = await active.updateDeal(deal.id, { stage });
  const kind = STAGE_EVENT[stage];
  if (kind) captureDealEvent({ actorRole, kind, subjectType: "listing", subjectId: deal.listingId, subjectName: subjectName ?? deal.listingId });
  return updated;
}

// ── mandates (persisted buyer criteria → matchable liquidity) ───────
export async function saveMandate(input: Omit<Mandate, "id" | "buyerAccountId" | "updatedAt">): Promise<Mandate | null> {
  if (!connectedAccountId) return null;
  return active.upsertMandate({ id: connectedAccountId, buyerAccountId: connectedAccountId, updatedAt: nowIso(), ...input });
}
export async function myMandate(): Promise<Mandate | null> { return connectedAccountId ? active.getMandate(connectedAccountId) : null; }
export async function allMandates(): Promise<Mandate[]> { return active.listMandates(); }

/** Point the app's stores at a backend. After this, captured events and
 *  listings persist through the API (network-wide, per account) instead of
 *  localStorage — the multi-tenant spine, with no consumer changes. */
export async function connectExitApi(client: ExitApiClient, account: Account): Promise<void> {
  await client.upsertAccount(account);
  // remember who we act as (== auth.uid() under Supabase) and stamp this
  // account as the owner of any listing it creates this session
  connectedAccountId = account.id;
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
