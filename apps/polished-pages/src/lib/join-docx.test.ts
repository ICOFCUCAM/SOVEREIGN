import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { joinDocx } from "./join-docx";

const fx = (n: string) => fs.readFileSync(path.join(__dirname, "../test/fixtures/join", n));
const OUT = process.env.JOIN_OUT;

describe("joinDocx", () => {
  it("joins Word files keeping text, lists, styles, images, links, notes and page setup", async () => {
    const { bytes: buf, notes } = await joinDocx([{ name: "a.docx", bytes: fx("a.docx") }, { name: "b.docx", bytes: fx("b.docx") }, { name: "c.docx", bytes: fx("c.docx") }], { headings: false });
    if (OUT) fs.writeFileSync(OUT, buf);
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.file("word/document.xml")!.async("string");
    for (const t of ["Alpha paragraph", "Beta step three", "For God so loved the world", "Gamma sentence", "Gamma bookmarked line"]) expect(doc).toContain(t);
    // one section per file: two section breaks inside paragraphs + the closing one
    expect((doc.match(/<w:sectPr/g) || []).length).toBe(3);
    // landscape setup of b carried as its own section
    expect(doc).toMatch(/w:orient="landscape"/);
    // images: both present as distinct media parts, all relationship ids resolve
    const rels = await zip.file("word/_rels/document.xml.rels")!.async("string");
    const ids = [...doc.matchAll(/r:(?:id|embed)="([^"]+)"/g)].map((m) => m[1]);
    for (const id of ids) expect(rels).toContain(`Id="${id}"`);
    expect(Object.keys(zip.files).filter((f) => f.startsWith("word/media/")).length).toBeGreaterThanOrEqual(2);
    expect(rels).toContain("https://example.org/beta");
    // the custom style travelled
    const styles = await zip.file("word/styles.xml")!.async("string");
    expect(styles).toMatch(/w:styleId="ScriptureQuote"/);
    // drawing ids unique
    const docPr = [...doc.matchAll(/<wp:docPr[^>]* id="(\d+)"/g)].map((m) => m[1]);
    expect(new Set(docPr).size).toBe(docPr.length);
    // comment dropped and reported; footnote kept (as a note) with its text
    expect(doc).not.toMatch(/commentReference/);
    expect(notes.join(" ")).toMatch(/comment/);
    const foot = (await zip.file("word/footnotes.xml")?.async("string")) ?? doc;
    expect(foot).toContain("Gamma footnote text");
  });

  it("moves footnotes into the first file's footnotes when it has them", async () => {
    const { bytes, notes } = await joinDocx([{ name: "c.docx", bytes: fx("c.docx") }, { name: "c2.docx", bytes: fx("c.docx") }, { name: "a.docx", bytes: fx("a.docx") }], { headings: true });
    const zip = await JSZip.loadAsync(bytes);
    const doc = await zip.file("word/document.xml")!.async("string");
    const foot = await zip.file("word/footnotes.xml")!.async("string");
    expect((foot.match(/Gamma footnote text/g) || []).length).toBe(2);
    const refIds = [...doc.matchAll(/<w:footnoteReference w:id="(\d+)"/g)].map((m) => m[1]);
    expect(new Set(refIds).size).toBe(2);
    for (const id of refIds) expect(foot).toContain(`w:id="${id}"`);
    expect(doc).toContain("c2</w:t>"); // file-name heading
    expect(notes.length).toBeGreaterThan(0);
  });

  it("refuses files that aren't .docx", async () => {
    await expect(joinDocx([{ name: "x.doc", bytes: new TextEncoder().encode("not a zip") }])).rejects.toThrow(/isn't a Word/);
  });
});
