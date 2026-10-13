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
