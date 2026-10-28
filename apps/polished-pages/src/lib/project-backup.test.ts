import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildBackup } from "./project-backup";
import type { StudioBackend } from "./studio-backend";

describe("project backup", () => {
  it("holds the manuscript, the documents as uploaded, every result and the earlier versions of the book", async () => {
    const backend = {
      thread: async () => ({ thread: { id: "t1", title: "Oneness", messages: [{ id: "m" }], files: [{ storedAs: "book.pdf", kind: "original" }, { storedAs: "book.txt", kind: "text" }, { storedAs: "gone.pdf", kind: "original" }], outputs: [{ path: "rewrite.md" }, { path: "rewrite-notes.md" }] }, job: null }),
      manuscript: async () => ({ title: "Oneness", sections: [], history: [] }),
      source: async (_: string, s: string) => (s === "book.txt" ? "the text" : null),
      output: async (_: string, p: string) => `# ${p}`,
      history: async () => ({ path: "rewrite.md", versions: [{ n: 1 }, { n: 2 }], approval: null }),
      version: async (_: string, _p: string, n: number) => `version ${n}`,
    } as unknown as StudioBackend;
    const raw = async (s: string) => { if (s === "gone.pdf") throw new Error("404"); return new TextEncoder().encode("%PDF").buffer as ArrayBuffer; };
    const { blob, report } = await buildBackup(backend, "t1", raw);
    const zip = await JSZip.loadAsync(blob);
    expect(Object.keys(zip.files).sort()).toEqual(expect.arrayContaining(["manuscript.json", "documents/book.pdf", "documents/book.txt", "results/rewrite.md", "results/rewrite-notes.md", "results/versions/rewrite-v1.md", "results/versions/rewrite-v2.md", "conversation.json", "README.txt"]));
    expect(await zip.file("documents/book.pdf")!.async("string")).toBe("%PDF");
    expect(report.skipped).toEqual(["documents/gone.pdf"]);
    expect(await zip.file("README.txt")!.async("string")).toMatch(/Could not be included:\n- documents\/gone\.pdf/);
  });
});
