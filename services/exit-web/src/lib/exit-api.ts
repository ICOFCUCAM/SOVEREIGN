import type { DealEvent } from "./deal-events";
import { setPersistenceAdapter } from "./deal-events";
import type { Listing } from "./listings";
import { setListingsAdapter } from "./listings";

// ── THE EXIT-API CONTRACT ───────────────────────────────────────────
// The boundary between this client and the multi-tenant backend (items
// 1–3 of network activation). The whole app already runs through swappable
// adapters; this defines the ONE interface a real backend must implement,
// plus a reference in-memory implementation. connectExitApi() hydrates the
// stores from the API and write-throughs every change — so going from
// single-browser localStorage to a shared, multi-tenant backend is a config
// swap, never a rewrite of capture, matching or scoring logic.

export type AccountRole = "founder" | "buyer" | "advisor";
export interface Account { readonly id: string; readonly role: AccountRole; readonly name: string; readonly createdAt: string }

/** Implemented in-memory below; in production a fetch-based client against
 *  the exit-api implements exactly this interface. */
export interface ExitApiClient {
  upsertAccount(a: Account): Promise<Account>;
  getAccount(id: string): Promise<Account | null>;
  // deal events are per account (the actor's own stream)
  listEvents(accountId: string): Promise<DealEvent[]>;
  saveEvents(accountId: string, events: readonly DealEvent[]): Promise<void>;
  // events targeting a subject (a listing / buyer) across ALL actors — this
  // is how a founder sees buyer interest on their listing
  listEventsForSubject(subjectId: string): Promise<DealEvent[]>;
  // listings are the shared marketplace pool (visible to all buyers)
  listListings(): Promise<Listing[]>;
  saveListings(listings: readonly Listing[]): Promise<void>;
}

/** Reference implementation. A real backend swaps this for a network client
 *  implementing the same interface — nothing else in the app changes. */
export class InMemoryExitApi implements ExitApiClient {
  private accounts = new Map<string, Account>();
  private events = new Map<string, DealEvent[]>();
  private listings: Listing[] = [];
  async upsertAccount(a: Account): Promise<Account> { this.accounts.set(a.id, a); return a; }
  async getAccount(id: string): Promise<Account | null> { return this.accounts.get(id) ?? null; }
  async listEvents(accountId: string): Promise<DealEvent[]> { return [...(this.events.get(accountId) ?? [])]; }
  async saveEvents(accountId: string, events: readonly DealEvent[]): Promise<void> { this.events.set(accountId, [...events]); }
  async listEventsForSubject(subjectId: string): Promise<DealEvent[]> {
    return [...this.events.values()].flat().filter((e) => e.subjectId === subjectId);
  }
  async listListings(): Promise<Listing[]> { return [...this.listings]; }
  async saveListings(listings: readonly Listing[]): Promise<void> { this.listings = [...listings]; }
}

// ── durable, browser-side implementation ────────────────────────────
// Same contract, persisted to localStorage and keyed by account — so the
// app is account-scoped and durable today, and the production exit-api
// swaps in without touching any consumer.
interface Store { accounts: Record<string, Account>; events: Record<string, DealEvent[]>; listings: Listing[] }
const SKEY = "exitos.backend.v1";
export class LocalStorageExitApi implements ExitApiClient {
  private read(): Store {
    try { return { accounts: {}, events: {}, listings: [], ...(JSON.parse(globalThis.localStorage?.getItem(SKEY) ?? "{}") as Partial<Store>) }; }
    catch { return { accounts: {}, events: {}, listings: [] }; }
  }
  private write(s: Store): void { try { globalThis.localStorage?.setItem(SKEY, JSON.stringify(s)); } catch { /* in-memory */ } }
  async upsertAccount(a: Account): Promise<Account> { const s = this.read(); s.accounts[a.id] = a; this.write(s); return a; }
  async getAccount(id: string): Promise<Account | null> { return this.read().accounts[id] ?? null; }
  async listEvents(accountId: string): Promise<DealEvent[]> { return this.read().events[accountId] ?? []; }
  async saveEvents(accountId: string, events: readonly DealEvent[]): Promise<void> { const s = this.read(); s.events[accountId] = [...events]; this.write(s); }
  async listEventsForSubject(subjectId: string): Promise<DealEvent[]> { return Object.values(this.read().events).flat().filter((e) => e.subjectId === subjectId); }
  async listListings(): Promise<Listing[]> { return this.read().listings; }
  async saveListings(listings: readonly Listing[]): Promise<void> { const s = this.read(); s.listings = [...listings]; this.write(s); }
}

// ── THE LIVE BACKEND SINGLETON ──────────────────────────────────────
// One durable client the running app talks to. Today it's LocalStorage-
// backed (durable, account-scoped, in-browser); swapping in the production
// exit-api is a one-line change here — every consumer keeps working because
// they only ever touch the stores, never this client directly.
export const backend: ExitApiClient = new LocalStorageExitApi();

/** Activate the live backend for a signed-in account: point every store at
 *  it so this session is durable and account-scoped. Called on sign-in. */
export async function activateBackend(account: Account): Promise<void> {
  await connectExitApi(backend, account);
}

/** Query accessor — events targeting a subject (a listing the founder owns,
 *  a buyer) across ALL actors. This is how a founder sees the buyer interest
 *  and NDA requests landing on their listing. */
export async function eventsForSubject(subjectId: string): Promise<DealEvent[]> {
  return backend.listEventsForSubject(subjectId);
}

/** Point the app's stores at a backend. After this, captured events and
 *  listings persist through the API (network-wide, per account) instead of
 *  localStorage — the multi-tenant spine, with no consumer changes. */
export async function connectExitApi(client: ExitApiClient, account: Account): Promise<void> {
  await client.upsertAccount(account);

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
