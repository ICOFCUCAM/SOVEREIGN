import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryExitApi, LocalStorageExitApi, connectExitApi, activateBackend, eventsForSubject, type Account } from "./exit-api.js";
import { captureDealEvent, allDealEvents, clearDealEvents } from "./deal-events.js";
import { listCompany, allListings } from "./listings.js";
import { buildProfile, SAMPLE_INTAKE } from "./company-intake.js";

const founder: Account = { id: "acct-founder-1", role: "founder", name: "Founder One", createdAt: new Date().toISOString() };
const buyer: Account = { id: "acct-buyer-9", role: "buyer", name: "Buyer Nine", createdAt: new Date().toISOString() };

// a Map-backed localStorage so the durable LocalStorageExitApi + backend
// singleton persist across read()/write() within a test.
function installLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

describe("exit-api contract — the multi-tenant backend bridge", () => {
  it("captured events persist THROUGH the API once connected (not localStorage)", async () => {
    const api = new InMemoryExitApi();
    await connectExitApi(api, founder);
    clearDealEvents();
    captureDealEvent({ actorRole: "founder", kind: "viewed_buyer", subjectType: "buyer", subjectId: "microsoft", subjectName: "Microsoft" });
    // the event is now in the backend, attributed to the account
    const persisted = await api.listEvents(founder.id);
    expect(persisted.some((e) => e.subjectId === "microsoft")).toBe(true);
  });

  it("a new session on the same backend sees the prior events — cross-device persistence", async () => {
    const api = new InMemoryExitApi();
    await connectExitApi(api, founder);
    clearDealEvents();
    captureDealEvent({ actorRole: "founder", kind: "expressed_interest", subjectType: "buyer", subjectId: "vista", subjectName: "Vista" });
    // simulate a fresh session: re-connect to the same backend + account
    await connectExitApi(api, founder);
    expect(allDealEvents().some((e) => e.subjectId === "vista")).toBe(true);
  });

  it("listings persist to the shared pool — visible to every buyer on the network", async () => {
    const api = new InMemoryExitApi();
    await connectExitApi(api, founder);
    listCompany(buildProfile({ ...SAMPLE_INTAKE, name: "Networked Co", sector: "ai_infra" }));
    const pool = await api.listListings();
    expect(pool.some((l) => l.profile.name === "Networked Co")).toBe(true);
    // a buyer connecting later sees it in the shared pool
    const buyer: Account = { id: "acct-buyer-1", role: "buyer", name: "Buyer One", createdAt: new Date().toISOString() };
    await connectExitApi(api, buyer);
    expect(allListings().some((l) => l.profile.name === "Networked Co")).toBe(true);
  });

  it("the reference client implements the full contract", async () => {
    const api = new InMemoryExitApi();
    await api.upsertAccount(founder);
    expect(await api.getAccount(founder.id)).toEqual(founder);
    expect(await api.getAccount("missing")).toBeNull();
  });

  it("listEventsForSubject returns every actor's events targeting a subject", async () => {
    const api = new InMemoryExitApi();
    await api.saveEvents("buyerA", [{ id: "e1", at: "t", actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: "lst-x", subjectName: "Project X" }]);
    await api.saveEvents("buyerB", [{ id: "e2", at: "t", actorRole: "buyer", kind: "expressed_interest", subjectType: "listing", subjectId: "lst-x", subjectName: "Project X" }]);
    const forX = await api.listEventsForSubject("lst-x");
    expect(forX.map((e) => e.id).sort()).toEqual(["e1", "e2"]);
    expect(await api.listEventsForSubject("lst-other")).toHaveLength(0);
  });
});

describe("durable backend — the live, account-scoped exit-api singleton", () => {
  beforeEach(() => { installLocalStorage(); });

  it("LocalStorageExitApi persists events and scans them by subject across accounts", async () => {
    const api = new LocalStorageExitApi();
    await api.saveEvents("buyerA", [{ id: "e1", at: "t", actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: "lst-y", subjectName: "Project Y" }]);
    // a second instance reads the same persisted store — durable across sessions
    const api2 = new LocalStorageExitApi();
    expect((await api2.listEventsForSubject("lst-y")).some((e) => e.id === "e1")).toBe(true);
  });

  it("the founder-receives-interest loop: a buyer's request surfaces to the founder via eventsForSubject", async () => {
    // buyer signs in and acts on a listing
    await activateBackend(buyer);
    clearDealEvents();
    captureDealEvent({ actorRole: "buyer", kind: "expressed_interest", subjectType: "listing", subjectId: "lst-target", subjectName: "Project T" });
    captureDealEvent({ actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: "lst-target", subjectName: "Project T" });

    // the founder signs in (re-points the stores to their own stream)
    await activateBackend(founder);

    // and sees the buyer interest landing on their listing — cross-actor
    const incoming = await eventsForSubject("lst-target");
    expect(incoming.some((e) => e.kind === "expressed_interest")).toBe(true);
    expect(incoming.some((e) => e.kind === "nda_requested")).toBe(true);

    // executing the NDA is captured against the same subject
    captureDealEvent({ actorRole: "founder", kind: "nda_signed", subjectType: "listing", subjectId: "lst-target", subjectName: "Project T" });
    expect((await eventsForSubject("lst-target")).some((e) => e.kind === "nda_signed")).toBe(true);
  });
});
