import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { dispatch, fetchConnectedChannels, loadPublishHistory } from "./distribution-engine";
import type { SocialPost } from "./social-publish";

const post: SocialPost = { title: "Test", body: "Body", hashtags: ["MnA"], url: "https://x/y", text: "Body\n\nhttps://x/y\n\n#MnA" };

// minimal localStorage polyfill (the test runs in node, no jsdom)
const store = new Map<string, string>();
describe("ExitOS distribution engine", () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k), clear: () => store.clear(), key: () => null, length: 0,
    } as Storage;
    store.clear();
  });
  afterEach(() => { delete (globalThis as Partial<typeof globalThis>).localStorage; vi.restoreAllMocks(); });

  it("returns the engine's real per-channel results and records history", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      results: [
        { channel: "linkedin", status: "done", url: "https://linkedin.com/p/1" },
        { channel: "x", status: "failed", error: "X_ACCESS_TOKEN not configured" },
      ],
    }), { status: 200 })));

    const r = await dispatch(post, ["linkedin", "x"]);
    expect(r.find((x) => x.channel === "linkedin")?.status).toBe("done");
    expect(r.find((x) => x.channel === "x")?.error).toMatch(/X_ACCESS_TOKEN/);

    const hist = loadPublishHistory();
    expect(hist.some((h) => h.channel === "linkedin" && h.status === "done")).toBe(true);
  });

  it("never fakes success when the engine is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const r = await dispatch(post, ["linkedin", "telegram"]);
    expect(r.every((x) => x.status === "failed")).toBe(true);
    expect(r[0].error).toMatch(/network down/i);
  });

  it("reads live channel connection status from the engine", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ connected: { linkedin: true, x: false } }), { status: 200 })));
    const c = await fetchConnectedChannels();
    expect(c.linkedin).toBe(true);
    expect(c.x).toBe(false);
  });
});
