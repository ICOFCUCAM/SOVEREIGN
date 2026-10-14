import { describe, it, expect } from "vitest";
import { loadWorkspace, follow, unfollow, saveNote, saveView, deleteView, toUpload } from "./buyer-workspace";

type Call = { url: string; method: string; prefer?: string; body?: unknown };
const remote = (reply: (c: Call) => { status?: number; body?: unknown } = () => ({})) => {
  const calls: Call[] = [];
  const r = {
    url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok",
    fetchImpl: (async (u: string, init?: RequestInit) => {
      const hd = (init?.headers ?? {}) as Record<string, string>;
      const c: Call = { url: u, method: init?.method ?? "GET", prefer: hd.Prefer, body: init?.body ? JSON.parse(String(init.body)) : undefined };
      calls.push(c); const { status = 200, body = [] } = reply(c);
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch,
  };
  return { r, calls };
};

describe("the buyer's workspace on the account", () => {
  it("reads the shortlist and the saved views", async () => {
    const { r } = remote((c) => ({ body: c.url.includes("shortlist") ? [{ listing_id: "a", note: "n" }] : [{ name: "V", config: { view: "grid" } }] }));
    expect(await loadWorkspace(r)).toEqual({ shortlist: [{ listing_id: "a", note: "n" }], views: [{ name: "V", config: { view: "grid" } }] });
  });
  it("follows with an upsert that keeps an existing note, and never sends an owner", async () => {
    const { r, calls } = remote();
    await follow(r, "lst-1");
    expect(calls[0]).toMatchObject({ method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: { listing_id: "lst-1" } });
    expect(calls[0]!.url).toContain("on_conflict=account_id,listing_id");
    expect(JSON.stringify(calls[0]!.body)).not.toContain("account_id");
  });
  it("unfollows, saves notes (capped at 600) and views, and deletes views by name", async () => {
    const { r, calls } = remote();
    await unfollow(r, "a b"); await saveNote(r, "lst-1", "x".repeat(700)); await saveView(r, "  My view  ", { sort: "name" }); await deleteView(r, "My view");
    expect(calls[0]).toMatchObject({ method: "DELETE" }); expect(calls[0]!.url).toContain("listing_id=eq.a%20b");
    expect((calls[1]!.body as { note: string }).note).toHaveLength(600);
    expect(calls[2]!.body).toEqual({ name: "My view", config: { sort: "name" } });
    expect(calls[3]!.url).toContain("name=eq.My%20view");
  });
  it("reports a refusal instead of failing silently", async () => {
    const { r } = remote(() => ({ status: 403, body: { message: "permission denied" } }));
    await expect(follow(r, "x")).rejects.toThrow(/permission denied/);
  });
  it("moves up only what this browser has and the account does not", () => {
    const up = toUpload({ watched: { a: true, b: true, c: false }, notes: { b: "note" }, views: [{ name: "Mine", sort: "name" }, { name: "Both", sort: "match" }] },
      { shortlist: [{ listing_id: "a", note: "" }], views: [{ name: "Both", config: {} }] });
    expect(up.shortlist).toEqual([{ listing_id: "b", note: "note" }]);
    expect(up.views.map((v) => v.name)).toEqual(["Mine"]);
  });
});
