import { describe, expect, it } from "vitest";
import { scannedOnly } from "./Workspace";
import type { StudioThread } from "@/lib/claude-studio";

const t = (files: { storedAs: string; kind: string }[]) => ({ files }) as unknown as StudioThread;

describe("scanned uploads", () => {
  it("knows when every manuscript is a scan with no text yet", () => {
    expect(scannedOnly(t([{ storedAs: "onenessofgod.pdf", kind: "original" }]))).toBe(true);
    expect(scannedOnly(t([{ storedAs: "onenessofgod.pdf", kind: "original" }, { storedAs: "onenessofgod.txt", kind: "text" }]))).toBe(false);
    expect(scannedOnly(t([{ storedAs: "notes.md", kind: "original" }]))).toBe(false);
    expect(scannedOnly(t([{ storedAs: "a.pdf", kind: "original" }, { storedAs: "b.docx", kind: "original" }, { storedAs: "b.txt", kind: "text" }]))).toBe(false);
    expect(scannedOnly(t([]))).toBe(false);
  });
});
