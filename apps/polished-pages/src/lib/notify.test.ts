import { afterEach, describe, expect, it, vi } from "vitest";
import { announce } from "./notify";

afterEach(() => { vi.restoreAllMocks(); document.title = "Claude Studio"; });
describe("finished-job notice", () => {
  it("stays quiet while the owner is looking, and marks the tab and notifies when they're away", () => {
    document.title = "Claude Studio";
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    expect(announce(true, "Rewrite")).toBe(false);
    const shown: string[] = [];
    class N { onclick: (() => void) | null = null; static permission = "granted"; constructor(t: string) { shown.push(t); } close() {} }
    vi.stubGlobal("Notification", N);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    expect(announce(true, "Rewrite")).toBe(true);
    expect(document.title).toBe("✓ Claude Studio");
    expect(shown).toEqual(["Done: Rewrite"]);
    vi.unstubAllGlobals();
  });
});
