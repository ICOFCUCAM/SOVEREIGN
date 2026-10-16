import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildCompanyPack, SAMPLE_PACK_COMPANIES, type PackItem } from "./sample-pack";
import { inspectRendered } from "./rendered";
import { documentType } from "./registry";
import { renderDocumentPdf, toWinAnsi, wrap, textWidth, pdfFilename } from "./pdf";

// ExitOS's own PDF renderer, held to the same rendered-output checks as the quality gate: every section
// heading and every table (column labels and rows) reaches the PDF text, the PDF has pages, carries the
// document's title and its status, shows no placeholder, and a buyer-facing PDF carries no valuation.
// The text checks need poppler (pdftotext, pdfinfo); without it only the structure is checked.

const poppler = (() => { try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); return true; } catch { return false; } })();
const items: Array<{ key: string; item: PackItem; valuation: readonly number[] }> = [];

beforeAll(async () => {
  for (const pc of SAMPLE_PACK_COMPANIES) {
    const { items: list, truth } = await buildCompanyPack(pc);
    const v = truth.valuation;
    for (const item of list) items.push({ key: `${pc.key}/${item.slug}`, item, valuation: v ? [v.low, v.mid, v.high] : [] });
  }
}, 120_000);

describe("ExitOS PDF renderer", () => {
  it("writes a well-formed PDF for every document in the sample pack", () => {
    expect(items.length).toBeGreaterThan(15);
    for (const { key, item } of items) {
      const bytes = renderDocumentPdf(item.version.ddm);
      const text = new TextDecoder("latin1").decode(bytes);
      expect(text.startsWith("%PDF-1.4"), key).toBe(true);
      expect(text.trimEnd().endsWith("%%EOF"), key).toBe(true);
      // the cross-reference table points at each object
      const xref = Number(text.match(/startxref\n(\d+)/)![1]);
      expect(text.slice(xref, xref + 4), key).toBe("xref");
      for (const m of text.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)) expect(text.slice(Number(m[1])).match(/^\d+ 0 obj/), key).not.toBeNull();
    }
  });

  it("is deterministic: the same version renders to the same bytes", () => {
    const d = items[0]!.item.version.ddm;
    expect(Buffer.from(renderDocumentPdf(d)).equals(Buffer.from(renderDocumentPdf(d)))).toBe(true);
  });

  it.skipIf(!poppler)("passes the quality gate's rendered-output checks on every document", () => {
    const dir = mkdtempSync(join(tmpdir(), "exitos-pdf-"));
    for (const { key, item, valuation } of items) {
      const file = join(dir, `${key.replace("/", "-")}.pdf`);
      writeFileSync(file, renderDocumentPdf(item.version.ddm));
      const pdfText = execFileSync("pdftotext", ["-layout", file, "-"]).toString();
      const info = execFileSync("pdfinfo", [file]).toString();
      const audience = documentType(item.version.typeId).audience;
      const findings = inspectRendered(item.version, {
        // the checks read every output; here the one output is the PDF
        markdown: pdfText, html: pdfText, pdfText,
        pdfPages: Number(info.match(/Pages:\s+(\d+)/)?.[1] ?? 0), pdfTitle: info.match(/Title:\s+(.+)/)?.[1]?.trim() ?? null,
      }, { buyerFacing: audience === "buyers" || audience === "buyer", valuationUsd: valuation });
      expect(findings.map((f) => `${f.rule} · ${f.section} · ${f.excerpt}`), key).toEqual([]);
    }
  });

  it("writes typographic characters in the standard encoding, and plain equivalents for the rest", () => {
    expect(toWinAnsi("“Quoted” — 5 € · café")).toBe("\x93Quoted\x94 \x97 5 \x80 \xb7 caf\xe9");
    expect(toWinAnsi("≥ 30% → next")).toBe(">= 30% -> next");
    expect(toWinAnsi("Ω")).toBe("?");
  });

  it("wraps to the width and never drops a word", () => {
    const text = toWinAnsi("Every section heading and every table reaches the rendered PDF of the document version");
    const lines = wrap(text, "F1", 10, 150);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(textWidth(l, "F1", 10)).toBeLessThanOrEqual(150);
    expect(lines.join(" ")).toBe(text);
  });

  it.skipIf(!poppler)("states sample data under the title when asked", () => {
    const dir = mkdtempSync(join(tmpdir(), "exitos-pdf-"));
    const file = join(dir, "notice.pdf");
    writeFileSync(file, renderDocumentPdf(items[0]!.item.version.ddm, { review: "In review", notice: "Every figure is demo data." }));
    const text = execFileSync("pdftotext", [file, "-"]).toString();
    expect(text).toContain("Sample data");
    expect(text).toContain("Every figure is demo data.");
    expect(text).toContain("In review");
  });

  it("names the file after the title and version", () => {
    expect(pdfFilename({ ddmVersion: "1.0", docType: "x", sections: [], metadata: { title: "Confidential Information Memorandum — Project Aurora", version: "2" } })).toBe("Confidential-Information-Memorandum-Project-Aurora-v2.pdf");
  });
});
