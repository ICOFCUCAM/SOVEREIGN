// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { PDFDocument } from "pdf-lib";
import { typesetBook, bookDirection, asChapters } from "@/lib/typeset/book";
import { getTrim } from "@/lib/print-sizes";
import { INTERIOR_STYLES } from "@/lib/typeset/styles";
import { nodeFetchFont } from "@/lib/typeset/test-fonts";

const para = (s: string, n: number) => Array.from({ length: n }, () => s).join(" ");
const BOOKS: Record<string, string> = {
  english: `# The First Step\n\n${para("Every journey begins in doubt, and every doubt is a door. We walk because the road asks us to.", 30)}\n\n## A road worth walking\n\n- Faith grows through hardship\n- Community matters\n\n${para("The morning was cold and the path was long.", 40)}\n\n# Arriving\n\nThe end.`,
  arabic: `# الخطوة الأولى\n\n${para("كل رحلة تبدأ بالشك، وكل شك باب. نمشي لأن الطريق يدعونا إلى ذلك في عام 2026.", 25)}\n\n# الوصول\n\nالنهاية.`,
  hebrew: `# הצעד הראשון\n\n${para("כל מסע מתחיל בספק, וכל ספק הוא דלת. אנחנו הולכים כי הדרך קוראת לנו.", 25)}\n\n# ההגעה\n\nהסוף.`,
  chinese: `# 第一步\n\n${para("每一段旅程都始于怀疑，而每一个怀疑都是一扇门。我们行走，因为道路在呼唤我们。", 20)}\n\n# 到达\n\n结束。`,
  amharic: `# የመጀመሪያው እርምጃ\n\n${para("እያንዳንዱ ጉዞ በጥርጣሬ ይጀምራል። እኛ የምንሄደው መንገዱ ስለሚጠራን ነው።", 25)}\n\n# መድረስ\n\nመጨረሻ።`,
  hindi: `# पहला कदम\n\n${para("हर यात्रा संदेह से शुरू होती है, और हर संदेह एक द्वार है। हम चलते हैं क्योंकि रास्ता हमें बुलाता है।", 25)}`,
};

describe("interior styles", () => {
  for (const style of INTERIOR_STYLES.map((x) => x.id)) {
    it(style, async () => {
      const { bytes, pages } = await typesetBook(BOOKS.english, { title: "The Long Road Home", author: "Chama Meyembi", trim: getTrim("5.5x8.5"), layout: "ingram", style, fetchFont: nodeFetchFont, year: 2026 });
      expect(pages).toBeGreaterThan(4);
      if (process.env.TYPESET_DIR) fs.writeFileSync(`${process.env.TYPESET_DIR}/style-${style}.pdf`, bytes);
    }, 60_000);
  }
});

describe("book typesetting", () => {
  it("knows which way a book reads", () => {
    expect(bookDirection(BOOKS.arabic)).toBe("rtl");
    expect(bookDirection(BOOKS.english)).toBe("ltr");
  });
  for (const [name, md] of Object.entries(BOOKS)) {
    for (const layout of ["standard", "ingram"] as const) {
      it(`${name}, ${layout}`, async () => {
        const { bytes, pages } = await typesetBook(md, { title: name === "english" ? "The Long Road Home" : md.split("\n")[0].slice(2), author: "Chama Meyembi", trim: getTrim("5.5x8.5"), layout, body: name === "english" ? "baskerville" : "ebgaramond", heading: "playfair", fetchFont: nodeFetchFont, year: 2026 });
        const doc = await PDFDocument.load(bytes);
        expect(doc.getPageCount()).toBe(pages);
        expect(pages).toBeGreaterThan(3);
        if (layout === "ingram") expect(pages).toBeGreaterThan(4);
        if (process.env.TYPESET_DIR) fs.writeFileSync(`${process.env.TYPESET_DIR}/${name}-${layout}.pdf`, bytes);
      }, 60_000);
    }
  }
});

describe("whole books compiled with \"# Title\" and \"## Chapter\"", () => {
  it("sets the sections as chapters, with the title and by-line on the title page and the typeset contents", () => {
    const compiled = "# Demonology\n\n*A study*\n\nby T\n\n## Contents\n\n- Preface\n- Spirits\n\n## Preface\n\nWhy.\n\n## Spirits\n\nText.\n\n### Names\n\nMore.";
    expect(asChapters(compiled)).toBe("# Preface\n\nWhy.\n\n# Spirits\n\nText.\n\n## Names\n\nMore.");
  });
  it("leaves a manuscript that already uses \"# \" for its chapters alone", () => {
    expect(asChapters(BOOKS.english)).toBe(BOOKS.english);
    expect(asChapters("# One\n\nText.")).toBe("# One\n\nText.");
  });
});

describe("front and back matter", () => {
  it("opens prefaces and bibliographies like chapters but without a number, and can start numbering later", async () => {
    const md = "# Preface\n\nWhy.\n\n# Spirits\n\nText.\n\n# Bibliography\n\nBooks.";
    const { bytes } = await typesetBook(md, { title: "Demonology", trim: getTrim("6x9"), fetchFont: nodeFetchFont, chapterStart: 2, year: 2026 });
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) pages.push((await (await doc.getPage(n)).getTextContent()).items.map((x) => ("str" in x ? x.str : "")).join(" ").replace(/\s+/g, " "));
    const at = (word: string) => pages.findIndex((t, i) => i > 1 && t.includes(word) && !/contents/i.test(t));
    expect(pages[at("hy.")]).not.toMatch(/CHAPTER/);
    expect(pages[at("ext.")]).toMatch(/C\s*H\s*A\s*P\s*T\s*E\s*R\s*T\s*W\s*O/);
    expect(pages[at("ooks.")]).not.toMatch(/CHAPTER/);
  }, 60_000);
});

describe("page makeup", () => {
  const pagesOf = async (bytes: Uint8Array) => {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: false }).promise;
    const out: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) out.push((await (await doc.getPage(n)).getTextContent()).items.map((x) => ("str" in x ? x.str : "")).join(" ").replace(/\s+/g, " "));
    return out;
  };
  it("never leaves a heading alone at the foot of a page", async () => {
    for (let k = 1; k <= 14; k++) {
      const md = `# The Nature of Yahuah\n\n${Array.from({ length: k }, (_, i) => `${para("Yahuah is eternal, immortal and everlasting, the first and the last.", 3 + (i % 3))}`).join("\n\n")}\n\n### Yahuah Is Immutable\n\n${para("The character and attributes of Yahuah never change.", 12)}`;
      const { bytes } = await typesetBook(md, { title: "The Oneness", trim: getTrim("6x9"), fetchFont: nodeFetchFont, year: 2026 });
      const pages = await pagesOf(bytes);
      const p = pages.findIndex((t) => t.includes("Yahuah Is Immutable") && !/Contents/.test(t));
      const after = pages[p].split("Yahuah Is Immutable")[1].trim().split(" ").length;
      expect(after, `with ${k} paragraphs before it`).toBeGreaterThan(8);
    }
  }, 120_000);
  it("sets a title written as a file name with spaces, small enough to fit, and says where each section opens", async () => {
    const md = `# Preface {-}\n\nWhy this book.\n\n# One Yahuah\n\nFirst.\n\n# The Nature of Yahuah\n\nSecond.`;
    const r = await typesetBook(md, { title: "The_Oneness_of_Yahuah_Complete_Manuscript", trim: getTrim("5x8"), fetchFont: nodeFetchFont, year: 2026, leading: 1.8, margins: "wide" });
    const pages = await pagesOf(r.bytes);
    expect(pages[0]).toMatch(/The Oneness of Yahuah/);
    expect(pages[0]).not.toMatch(/_/);
    expect(r.sections.map((s) => s.title)).toEqual(["Preface", "One Yahuah", "The Nature of Yahuah"]);
    expect(pages[r.sections[2].page - 1]).toMatch(/The Nature of Yahuah/);
  }, 60_000);
});
