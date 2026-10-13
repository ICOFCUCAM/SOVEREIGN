import { describe, it, expect, vi, afterEach } from "vitest";
import { listDocuments, NO_ROOM } from "./data-room";

afterEach(() => { vi.unstubAllGlobals(); });

describe("data room isolation", () => {
  it("refuses without a signed-in user's token, and never sends a tenant id", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(listDocuments()).rejects.toThrow(NO_ROOM);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("data-room tagging and review", () => {
  it("tags and reviews through the owner-only functions, and maps a listed file for completeness", async () => {
    vi.resetModules();
    vi.doMock("./exit-api", () => ({ liveUserToken: async () => "tok" }));
    const calls: Array<{ url: string; body: unknown }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => { calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null }); return new Response(null, { status: 204 }); }));
    const m = await import("./data-room");
    await m.tagFile("d1", "financial.audited_accounts", "co-00000000-0000-4000-8000-000000000001");
    await m.reviewFile("d1", "accepted", "FY2023-FY2025, signed");
    expect(calls[0]).toEqual({ url: expect.stringContaining("/rest/v1/rpc/exit_data_room_tag"), body: { p_document: "d1", p_artifact: "financial.audited_accounts", p_company: "co-00000000-0000-4000-8000-000000000001" } });
    expect(calls[1]).toEqual({ url: expect.stringContaining("/rest/v1/rpc/exit_data_room_review"), body: { p_document: "d1", p_state: "accepted", p_note: "FY2023-FY2025, signed" } });
    expect(m.toRoomFile({ id: "d1", room_kind: "financial", filename: "a.pdf", mime: "application/pdf", bytes: 1, storage_path: "x", classification: "sensitive", uploaded_at: "2026-10-01" }))
      .toEqual({ id: "d1", artifactId: null, companyId: null, reviewState: "submitted", filename: "a.pdf", uploadedAt: "2026-10-01" });
    vi.doUnmock("./exit-api");
  });
  it("surfaces the server's refusal", async () => {
    vi.resetModules();
    vi.doMock("./exit-api", () => ({ liveUserToken: async () => "tok" }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "tag the file with the artifact it satisfies before reviewing it" }), { status: 400 })));
    const m = await import("./data-room");
    await expect(m.reviewFile("d1", "accepted")).rejects.toThrow("tag the file");
    vi.doUnmock("./exit-api");
  });
});
