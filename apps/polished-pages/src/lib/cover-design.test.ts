import { describe, expect, it } from "vitest";
import { BARCODE_MM, SAFE_MM, coverChecks, defaultDesign, ean13Check, ean13Modules, estimatePages, isGuard, toIsbn13, wrapGeometry } from "@/lib/cover-design";
import { bookExcerpt, parseCoverCopy } from "@/lib/cover-copy";

describe("ISBN and EAN-13", () => {
  it("accepts valid ISBN-13 and converts ISBN-10", () => {
    expect(toIsbn13("978-0-306-40615-7")).toBe("9780306406157");
    expect(toIsbn13("0-306-40615-2")).toBe("9780306406157");
    expect(toIsbn13("080442957X")).toBe("9780804429573");
  });
  it("rejects bad check digits and non-book prefixes", () => {
    expect(toIsbn13("9780306406158")).toBeNull();
    expect(toIsbn13("0306406153")).toBeNull();
    expect(toIsbn13("4006381333931")).toBeNull(); // a valid EAN, but not an ISBN
    expect(toIsbn13("abc")).toBeNull();
  });
  it("computes the check digit", () => { expect(ean13Check("978030640615")).toBe(7); });
  it("encodes 95 modules with guards and first-digit parity", () => {
    const m = ean13Modules("9780306406157");
    expect(m).toHaveLength(95);
    expect(m.slice(0, 3)).toBe("101");
    expect(m.slice(45, 50)).toBe("01010");
    expect(m.slice(92)).toBe("101");
    // First digit 9 → parity LGGLGL: the 7 is L-coded, the 8 G-coded, the 0 G-coded.
    expect(m.slice(3, 10)).toBe("0111011");
    expect(m.slice(10, 17)).toBe("0001001");
    expect(m.slice(17, 24)).toBe("0100111");
    // Right half is R-coded: the final 7 is 1000100.
    expect(m.slice(85, 92)).toBe("1000100");
    expect([0, 46, 94].every(isGuard)).toBe(true);
    expect(isGuard(10)).toBe(false);
  });
});

describe("print geometry", () => {
  it("lays out back, spine and front with bleed for a 6×9 cream book", () => {
    const g = wrapGeometry({ trimId: "6x9", paper: "Cream", pages: 300 });
    expect(g.spine).toBeCloseTo(300 * 0.0635, 5); // 0.0025 in per page
    expect(g.full.w).toBeCloseTo(3.175 * 2 + 152.4 * 2 + g.spine, 5);
    expect(g.full.h).toBeCloseTo(228.6 + 3.175 * 2, 5);
    expect(g.front.trim.x).toBeCloseTo(3.175 + 152.4 + g.spine, 5);
    expect(g.spineText).toBe(true);
    // Barcode sits inside the back's safe zone, bottom right.
    expect(g.barcode.w).toBeCloseTo(BARCODE_MM.w);
    expect(g.barcode.x + g.barcode.w).toBeCloseTo(g.back.trim.x + g.back.trim.w - SAFE_MM, 5);
    expect(g.barcode.y + g.barcode.h).toBeCloseTo(g.back.trim.y + g.back.trim.h - SAFE_MM, 5);
  });
  it("leaves the spine plain under KDP's 80-page minimum for spine text", () => {
    expect(wrapGeometry({ trimId: "6x9", paper: "White", pages: 79 }).spineText).toBe(false);
    expect(wrapGeometry({ trimId: "6x9", paper: "White", pages: 80 }).spineText).toBe(true);
  });
  it("estimates an even page count from words and trim", () => {
    expect(estimatePages(0, "6x9")).toBe(0);
    expect(estimatePages(60_000, "6x9")).toBe(210);
    expect(estimatePages(60_000, "5x8") % 2).toBe(0);
    expect(estimatePages(60_000, "5x8")).toBeGreaterThan(estimatePages(60_000, "6x9"));
  });
});

describe("cover checks", () => {
  it("flags what a printer would reject and what still needs the author", () => {
    const texts = coverChecks(defaultDesign({ pages: 40, isbn: "978-0-306-40615-8", endorsements: [{ quote: "[quote]", by: "" }], bio: "Lives in [city]." })).map((c) => c.text).join("\n");
    expect(texts).toMatch(/Add the title/);
    expect(texts).toMatch(/too thin for text/);
    expect(texts).toMatch(/ISBN isn't valid/);
    expect(texts).toMatch(/placeholder\]?/);
    expect(texts).toMatch(/bio still has/);
    const ok = coverChecks(defaultDesign({ title: "T", author: "A", pages: 240, isbn: "9780306406157", frontArt: "x" }));
    expect(ok.every((c) => c.level === "ok")).toBe(true);
  });
});

describe("cover copy", () => {
  it("parses JSON with or without fences and drops unknown templates", () => {
    const c = parseCoverCopy('```json\n{"tagline":"t","blurb":"b","template":"noir","bio":"x"}\n```');
    expect(c.blurb).toBe("b"); expect(c.template).toBeNull(); expect(c.backHeadline).toBe("");
    expect(parseCoverCopy('Here: {"blurb":"b","template":"Devotional"}').template).toBe("devotional");
    expect(() => parseCoverCopy('{"tagline":"t"}')).toThrow(/No blurb/);
    expect(() => parseCoverCopy("nope")).toThrow();
  });
  it("keeps the opening, headings and close of a long book", () => {
    const text = `# Book\n\n## One\n\n${"a ".repeat(50_000)}\n\n## Two\n\n${"b ".repeat(50_000)}\n\n## Three\n\nThe end.`;
    const x = bookExcerpt(text, 50_000);
    expect(x.length).toBeLessThan(60_000);
    expect(x).toMatch(/^# Book/); expect(x).toMatch(/## Three/); expect(x).toMatch(/The end\.$/);
  });
});

describe("typefaces", () => {
  it("uses the nearest bundled weight, never a faux bold", async () => {
    const { fontWeight, fontOf, COVER_FONTS, FONT_PAIRINGS } = await import("@/lib/cover-design");
    expect(fontWeight("greatvibes", 700)).toBe(400);
    expect(fontWeight("cinzel", 700)).toBe(700);
    expect(fontWeight("josefin", 500)).toBe(400);
    // Pairings only use faces that exist, with a readable text face.
    for (const p of FONT_PAIRINGS) { expect(COVER_FONTS[p.title]).toBeTruthy(); expect(fontOf(p.body).text).toBe(true); }
  });
  it("bundles every face it lists", async () => {
    const fs = await import("node:fs");
    const { COVER_FONTS } = await import("@/lib/cover-design");
    const css = fs.readFileSync("src/lib/cover-fonts.ts", "utf8") + fs.readFileSync("src/lib/fonts.ts", "utf8");
    for (const f of Object.values(COVER_FONTS)) {
      const pkg = f.family.match(/'([^']+)'/)![1].toLowerCase().replace(/ /g, "-");
      for (const w of f.weights) expect(css, `${f.label} ${w}`).toMatch(new RegExp(`@fontsource/${pkg}/${w}\\.css`));
    }
  });
});
