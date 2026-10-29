import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { markdownToEpubBlob } from "./export-epub";
import { compile, type Manuscript } from "./manuscript";

const m: Manuscript = { title: "The Oneness of Yahuah", subtitle: "The Biblical Identity of Yahusha", author: "A. Author", history: [], sections: [
  { id: "pr", kind: "praise", title: "Praise for the book", body: "“A careful study.”\n\n— A. Reader, Pastor" },
  { id: "h", kind: "half-title", title: "Half-title page", body: "" },
  { id: "d", kind: "dedication", title: "Dedication", body: "To Ann." },
  { id: "p", kind: "preface", title: "Preface", body: "Why I wrote it." },
  { id: "i", kind: "introduction", title: "Introduction", body: "What the book teaches.[^1]\n\n[^1]: A note." },
  { id: "c", kind: "chapter", title: "One Yahuah", body: "Both testaments confess that **Yahuah** is *one*.\n\n> Hear, O Israel." },
  { id: "g", kind: "glossary", title: "Glossary", body: "Shema: the confession of Deuteronomy 6:4." },
  { id: "si", kind: "scripture-index", title: "Index of Scripture", body: "" },
] };

describe("EPUB with the book's front matter", () => {
  it("opens with the endorsements, a title page and copyright page, the dedication as a page of its own, and linked contents", async () => {
    const blob = await markdownToEpubBlob(compile(m, { contents: true }), { title: m.title, subtitle: m.subtitle, author: m.author, isbn: "[ISBN]", notices: ["Scripture quotations are from the King James Version."] });
    const zip = await JSZip.loadAsync(blob);
    const opf = await zip.file("OEBPS/content.opf")!.async("string");
    const spine = [...opf.matchAll(/idref="([^"]+)"/g)].map((x) => x[1]);
    const hrefOf = (id: string) => new RegExp(`id="${id}" href="([^"]+)"`).exec(opf)![1];
    const files = await Promise.all(spine.map((id) => zip.file(`OEBPS/${hrefOf(id)}`)!.async("string")));
    const text = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const at = (re: RegExp) => files.findIndex((f) => re.test(text(f)));
    expect(at(/A careful study/)).toBe(0);
    expect(at(/The Biblical Identity of Yahusha/)).toBe(1);
    expect(text(files[2])).toMatch(/Copyright © \d{4} A\. Author\. All rights reserved\. No part of this book/);
    expect(text(files[2])).toMatch(/King James Version/);
    expect(text(files[2])).not.toMatch(/ISBN/);
    const ded = files[at(/To Ann\./)];
    expect(ded).toMatch(/epub:type="dedication"/);
    expect(ded).not.toMatch(/<h1/);
    expect(at(/To Ann\./)).toBeLessThan(at(/Why I wrote it/));
    const contents = files[at(/^ ?Contents/)];
    expect(contents).toMatch(/href="[^"]+">Introduction<\/a>/);
    expect(contents).not.toMatch(/Dedication|Copyright/);
    expect(at(/^ ?Contents/)).toBeLessThan(at(/What the book teaches/));
    const ch = files[at(/Both testaments/)];
    expect(ch).toMatch(/Chapter one/i);
    expect(ch).toMatch(/<strong>Yahuah<\/strong> is <em>one<\/em>/);
    expect(ch).toMatch(/<blockquote>/);
    expect(files[at(/What the book teaches/)]).toMatch(/epub:type="footnote"[\s\S]*A note\./);
    const si = files[at(/^ ?Index of Scripture/)];
    expect(si).toMatch(/Deuteronomy<\/h2><p>6:4 — <a href="[^"]+">Glossary<\/a>/);
    expect(files.join("")).not.toMatch(/\{(display|praise|toc|-)\}|\[\^1\]/);
  });
});
