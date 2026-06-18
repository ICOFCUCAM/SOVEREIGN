import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryExitApi, LocalStorageExitApi, connectExitApi, activateBackend, eventsForSubject, requestNda, ndaRequestsForListing, signNda, submitOffer, offersForListing, resolveOffer, type Account, type ExitApiClient } from "./exit-api.js";
import { SupabaseExitApi } from "./supabase-exit-api.js";
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

  it("first-class NDA + offer records flow buyer → founder and resolve", async () => {
    // buyer requests an NDA and submits an offer on a listing
    await activateBackend(buyer);
    const nda = await requestNda("lst-deal");
    await submitOffer("lst-deal", 25e6, "all cash");
    expect(nda?.buyerAccountId).toBe(buyer.id);

    // the founder sees both as records on their listing and resolves them
    await activateBackend(founder);
    const incomingNdas = await ndaRequestsForListing("lst-deal");
    expect(incomingNdas.some((r) => r.status === "requested")).toBe(true);
    const signed = await signNda(incomingNdas[0].id);
    expect(signed.status).toBe("signed");

    const incomingOffers = await offersForListing("lst-deal");
    expect(incomingOffers[0].amountUsd).toBe(25e6);
    expect((await resolveOffer(incomingOffers[0].id, "accepted")).status).toBe("accepted");
  });
});

// the contract is now COMPLETE — exercise every entity the network needs
describe("the complete contract — organizations, NDA, offers, documents, notifications", () => {
  it("organizations: an account sees the orgs it owns or belongs to", async () => {
    const api = new InMemoryExitApi();
    await api.upsertOrganization({ id: "org-1", name: "Vista", ownerAccountId: founder.id, memberIds: [], createdAt: new Date().toISOString() });
    await api.upsertOrganization({ id: "org-2", name: "KKR", ownerAccountId: "someone", memberIds: [buyer.id], createdAt: new Date().toISOString() });
    expect((await api.listOrganizationsForAccount(founder.id)).map((o) => o.id)).toEqual(["org-1"]);
    expect((await api.listOrganizationsForAccount(buyer.id)).map((o) => o.id)).toEqual(["org-2"]);
  });

  it("NDA requests carry a lifecycle the founder resolves", async () => {
    const api = new InMemoryExitApi();
    const r = await api.createNdaRequest({ listingId: "lst-1", buyerAccountId: buyer.id });
    expect(r.status).toBe("requested");
    expect((await api.listNdaRequests({ listingId: "lst-1" })).length).toBe(1);
    const signed = await api.updateNdaRequest(r.id, { status: "signed" });
    expect(signed.status).toBe("signed");
    expect(signed.resolvedAt).not.toBeNull();
  });

  it("offers, documents and notifications round-trip", async () => {
    const api = new InMemoryExitApi();
    const offer = await api.createOffer({ listingId: "lst-1", buyerAccountId: buyer.id, amountUsd: 42e6 });
    expect((await api.listOffers({ buyerAccountId: buyer.id }))[0].amountUsd).toBe(42e6);
    expect((await api.updateOffer(offer.id, { status: "accepted" })).status).toBe("accepted");

    await api.putDocument({ listingId: "lst-1", name: "CIM.pdf", kind: "cim", uri: "s3://x", visibility: "post_nda", uploadedByAccountId: founder.id });
    expect((await api.listDocuments("lst-1")).length).toBe(1);

    const n = await api.pushNotification({ accountId: founder.id, kind: "nda_event", subjectId: "lst-1", message: "Buyer requested NDA" });
    expect((await api.listNotifications(founder.id))[0].read).toBe(false);
    await api.markNotificationRead(n.id);
    expect((await api.listNotifications(founder.id))[0].read).toBe(true);
  });

  it("LocalStorage durably persists the new entities across instances", async () => {
    installLocalStorage();
    const a = new LocalStorageExitApi();
    await a.createOffer({ listingId: "lst-9", buyerAccountId: buyer.id, amountUsd: 10e6 });
    await a.createNdaRequest({ listingId: "lst-9", buyerAccountId: buyer.id });
    const b = new LocalStorageExitApi();   // fresh session, same store
    expect((await b.listOffers({ listingId: "lst-9" })).length).toBe(1);
    expect((await b.listNdaRequests({ listingId: "lst-9" })).length).toBe(1);
  });
});

// ── THE SWAP TEST — InMemory ⇄ Supabase, no consumer changes ─────────
// A fake PostgREST (Map-backed) lets us drive the production client through
// the exact same assertions. If these pass, swapping backends is dependency
// injection only — no UI, store or engine change.
function fakeSupabaseFetch(): typeof fetch {
  const tables: Record<string, Map<string, Record<string, unknown>>> = {};
  const tbl = (n: string): Map<string, Record<string, unknown>> => (tables[n] ??= new Map());
  return (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = new URL(String(input));
    const table = url.pathname.replace(/^\/rest\/v1\//, "");
    const method = init?.method ?? "GET";
    const t = tbl(table);
    const matches = (row: Record<string, unknown>): boolean => {
      for (const [k, v] of url.searchParams) {
        if (k === "select") continue;
        const m = /^eq\.(.*)$/.exec(v);
        if (m && String(row[k]) !== m[1]) return false;
      }
      return true;
    };
    if (method === "GET") {
      const rows = [...t.values()].filter(matches).map((r) => ({ data: r.data }));
      return new Response(JSON.stringify(rows), { status: 200 });
    }
    if (method === "POST") {
      for (const row of JSON.parse(String(init?.body ?? "[]")) as Record<string, unknown>[]) t.set(String(row.id), row);
      return new Response("", { status: 200 });
    }
    if (method === "DELETE") {
      for (const [id, row] of [...t]) if (matches(row)) t.delete(id);
      return new Response("", { status: 200 });
    }
    return new Response("", { status: 400 });
  }) as typeof fetch;
}

// the SAME suite, run against any ExitApiClient — proving interchangeability
function contractSuite(name: string, make: () => ExitApiClient): void {
  describe(`contract conformance · ${name}`, () => {
    beforeEach(() => installLocalStorage());   // harmless for InMemory/Supabase, required for LocalStorage
    it("accounts upsert + fetch", async () => {
      const api = make();
      await api.upsertAccount(founder);
      expect((await api.getAccount(founder.id))?.name).toBe(founder.name);
      expect(await api.getAccount("missing")).toBeNull();
    });
    it("events: per-account stream + cross-actor subject scan", async () => {
      const api = make();
      await api.saveEvents(buyer.id, [{ id: "e1", at: "t", actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: "lst-s", subjectName: "P" }]);
      expect((await api.listEvents(buyer.id)).length).toBe(1);
      expect((await api.listEventsForSubject("lst-s")).map((e) => e.id)).toEqual(["e1"]);
    });
    it("listings: a saved listing is in the shared pool", async () => {
      const api = make();
      await api.saveListings([{ id: "lst-z", code: "Project Z", listedAt: "t", profile: { name: "Z" } as never, publicView: { sector: "AI", region: "North America", revenueUsd: 1, growthPct: 0, ebitdaMarginPct: 0 } }]);
      expect((await api.listListings()).some((l) => l.id === "lst-z")).toBe(true);
    });
    it("NDA + offer lifecycle", async () => {
      const api = make();
      const r = await api.createNdaRequest({ listingId: "lst-1", buyerAccountId: buyer.id });
      expect((await api.updateNdaRequest(r.id, { status: "signed" })).status).toBe("signed");
      const o = await api.createOffer({ listingId: "lst-1", buyerAccountId: buyer.id, amountUsd: 5e6 });
      expect((await api.updateOffer(o.id, { status: "accepted" })).status).toBe("accepted");
      expect((await api.listOffers({ listingId: "lst-1" })).length).toBe(1);
    });
    it("deal lifecycle: open once, advance through stages, history accrues", async () => {
      const api = make();
      const d = await api.createDeal({ listingId: "lst-1", buyerAccountId: buyer.id });
      expect(d.stage).toBe("qualified");
      const again = await api.createDeal({ listingId: "lst-1", buyerAccountId: buyer.id });
      expect(again.id).toBe(d.id);                          // one deal per (listing, buyer)
      const signed = await api.updateDeal(d.id, { stage: "nda_executed" });
      expect(signed.stage).toBe("nda_executed");
      const closed = await api.updateDeal(d.id, { stage: "closed" });
      expect(closed.stage).toBe("closed");
      expect(closed.history.map((h) => h.stage)).toEqual(["qualified", "nda_executed", "closed"]);
      expect((await api.listDeals({ buyerAccountId: buyer.id })).length).toBe(1);
    });
    it("mandate persists and is listable for matching", async () => {
      const api = make();
      await api.upsertMandate({ id: buyer.id, buyerAccountId: buyer.id, name: "Vista mandate", sectors: ["AI"], regions: ["North America"], minCheckUsd: 5e6, maxCheckUsd: 5e8, minGrowthPct: 0.2, strategicThemes: ["ai infra"], updatedAt: "t" });
      expect((await api.getMandate(buyer.id))?.name).toBe("Vista mandate");
      expect((await api.listMandates()).some((m) => m.buyerAccountId === buyer.id)).toBe(true);
    });
  });
}

contractSuite("InMemoryExitApi", () => new InMemoryExitApi());
contractSuite("LocalStorageExitApi", () => new LocalStorageExitApi());
contractSuite("SupabaseExitApi (mock PostgREST)", () => new SupabaseExitApi({ url: "https://x.supabase.co", anonKey: "anon", fetchImpl: fakeSupabaseFetch() }));

describe("ownership hardening — owner-scoped listing writes", () => {
  it("Supabase saveListings only persists the signed-in user's own listings", async () => {
    const api = new SupabaseExitApi({ url: "https://x.supabase.co", anonKey: "anon", fetchImpl: fakeSupabaseFetch() });
    api.setAccessToken("jwt", "userU");
    const mk = (id: string, owner?: string): Parameters<typeof api.saveListings>[0][number] =>
      ({ id, ownerAccountId: owner, code: "Project X", listedAt: "t", profile: { name: id } as never, publicView: { sector: "AI", region: "North America", revenueUsd: 1, growthPct: 0, ebitdaMarginPct: 0 } });
    // a session that holds the whole pool tries to write all of it…
    await api.saveListings([mk("mine", "userU"), mk("theirs", "userOther"), mk("seed", undefined)]);
    const pool = await api.listListings();
    // …but only the user's own listing is sent (RLS would reject the rest)
    expect(pool.map((l) => l.id)).toEqual(["mine"]);
  });
});
