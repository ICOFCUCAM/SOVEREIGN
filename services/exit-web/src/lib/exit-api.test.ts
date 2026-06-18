import { describe, expect, it } from "vitest";
import { InMemoryExitApi, connectExitApi, type Account } from "./exit-api.js";
import { captureDealEvent, allDealEvents, clearDealEvents } from "./deal-events.js";
import { listCompany, allListings } from "./listings.js";
import { buildProfile, SAMPLE_INTAKE } from "./company-intake.js";

const founder: Account = { id: "acct-founder-1", role: "founder", name: "Founder One", createdAt: new Date().toISOString() };

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
});
