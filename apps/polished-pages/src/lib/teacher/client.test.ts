import { describe, expect, it } from "vitest";
import type { Manuscript } from "@/lib/manuscript";
import { prepare, teacherMarkdown } from "@/lib/teacher/client";

const m: Manuscript = { title: "Demonology", author: "The Author", history: [], rules: "Write Yahuah instead of God", sections: [
  { id: "c1", kind: "chapter", title: "Spirits in the Ancient Near East", body: "The people of the ancient world did not doubt that spirits were real.\n\nSee Lev 17:7." },
  { id: "tp", kind: "title-page", title: "Title page", body: "Demonology" },
  { id: "pre", kind: "preface", title: "Preface", body: "This book began as lectures." },
  { id: "c2", kind: "chapter", title: "Empty chapter", body: "" },
  { id: "bib", kind: "bibliography", title: "Bibliography", body: "Black and Green (1992)." },
] };

describe("the book as the tutor reads it", () => {
  it("keeps sections with text in publishing order, front and back matter unnumbered, no title page", () => {
    const md = teacherMarkdown(m);
    expect(md.split("\n").filter((l) => l.startsWith("#"))).toEqual(["# Demonology", "## Preface {-}", "## Spirits in the Ancient Near East", "## Bibliography {-}"]);
  });

  it("previews chapters with stable ids, numbers only chapters, and finds scripture", async () => {
    const { preview, version } = await prepare(m, "doc-1");
    expect(preview.chapters.map((c) => [c.id, c.label])).toEqual([["preface", "Unnumbered"], ["ch-01-spirits-in-the-ancient-near-east", "Chapter 1"], ["bibliography", "Unnumbered"]]);
    expect(preview.chapters[1].scripture).toEqual(["LEV 17:7"]);
    expect(version.chunks.every((c) => c.id.startsWith("doc-1:"))).toBe(true);
    expect(preview.blocking).toBe(false);
  });
});
