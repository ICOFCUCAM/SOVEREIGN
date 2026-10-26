import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { joinPdfs, parseRanges } from "./join-pdf";

async function pdf(label: string, pages: number) {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) d.addPage([300, 400]).drawText(`${label} page ${i}`, { x: 20, y: 200, size: 14, font: f });
  return d.save();
}
// 1x1 PNG
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));

describe("parseRanges", () => {
  it("reads pages and ranges", () => {
    expect(parseRanges("", 3)).toEqual([0, 1, 2]);
    expect(parseRanges("1-2, 5, 7-", 8)).toEqual([0, 1, 4, 6, 7]);
    expect(() => parseRanges("9", 3)).toThrow(/has 3 pages/);
    expect(() => parseRanges("a-b", 3)).toThrow(/isn't a page/);
  });
});

describe("joinPdfs", () => {
  it("joins PDFs in order, honours ranges, and adds images as pages", async () => {
    const { bytes, pages } = await joinPdfs([
      { name: "a.pdf", kind: "pdf", bytes: await pdf("A", 3) },
      { name: "b.pdf", kind: "pdf", bytes: await pdf("B", 5), ranges: "2-3" },
      { name: "scan.png", kind: "png", bytes: PNG },
    ], { title: "Joined" });
    expect(pages).toBe(6);
    const out = await PDFDocument.load(bytes);
    expect(out.getPageCount()).toBe(6);
    expect(out.getTitle()).toBe("Joined");
  });
  it("explains a file that isn't a PDF", async () => {
    await expect(joinPdfs([{ name: "x.pdf", kind: "pdf", bytes: new Uint8Array([1, 2, 3]) }])).rejects.toThrow(/couldn't be read/);
  });
});
