import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { readBackup, splitDocuments } from "./project-restore";

describe("restore from a backup", () => {
  it("reads the manuscript, documents and results of a backup", async () => {
    const z = new JSZip();
    z.file("README.txt", "Claude Studio project: The Oneness of Yahuah\nSaved today.");
    z.file("manuscript.json", JSON.stringify({ title: "The Oneness", sections: [{ id: "c1", kind: "chapter", title: "One", body: "x" }], history: [] }));
    z.file("documents/book.pdf", "%PDF"); z.file("documents/book.txt", "the text"); z.file("documents/notes.txt", "own notes");
    z.file("results/rewrite.md", "# R"); z.file("results/versions/rewrite-v1.md", "old");
    const b = await readBackup(await z.generateAsync({ type: "blob" }));
    expect(b.title).toBe("The Oneness of Yahuah");
    expect(b.manuscript?.sections).toHaveLength(1);
    expect(b.results.map((r) => r.path)).toEqual(["rewrite.md"]);
    const { originals, texts } = splitDocuments(b.documents);
    expect(originals.map((d) => d.name).sort()).toEqual(["book.pdf", "notes.txt"]);
    expect(texts.map((d) => d.name)).toEqual(["book.txt"]);
  });
  it("says plainly when the file isn't a backup", async () => {
    await expect(readBackup(new Blob(["not a zip"]))).rejects.toThrow(/isn't a Claude Studio backup/);
  });
});
