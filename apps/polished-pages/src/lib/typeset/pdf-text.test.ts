// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { PDFDocument } from "pdf-lib";
import { Typesetter } from "@/lib/typeset/pdf-text";
import { scriptsIn, tokenize, visualOrder } from "@/lib/typeset/scripts";
import { nodeFetchFont } from "@/lib/typeset/test-fonts";

const SAMPLES = [
  "The quick brown fox — “quoted” and naïve café, Ελληνικά, Русский.",
  "بسم الله الرحمن الرحيم، هذا كتاب عن الإيمان والرحلة الطويلة إلى البيت.",
  "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ 2026.",
  "नमस्ते दुनिया, क्षत्रिय श्री। यह एक पुस्तक है।",
  "ሰላም ለዓለም። ይህ መጽሐፍ ነው።",
  "আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।",
  "வணக்கம் உலகம், இது ஒரு புத்தகம்.",
  "你好，世界。这是一本关于信仰和回家的书。",
  "Hello שלום world, version 3.2 עכשיו.",
];

describe("scripts", () => {
  it("detects the writing systems in a text", () => {
    expect([...scriptsIn(SAMPLES.join(" "))].sort()).toEqual(["arabic", "bengali", "devanagari", "ethiopic", "hebrew", "sc", "tamil"]);
    expect([...scriptsIn("こんにちは世界")]).toEqual(["jp"]);
    expect([...scriptsIn("你好", "tc")]).toEqual(["tc"]);
  });
  it("breaks CJK between characters, keeping closing punctuation attached", () => {
    expect(tokenize("你好，世界。").map((t) => t.text)).toEqual(["你", "好，", "世", "界。"]);
    expect(tokenize("fox, “quoted”").map((t) => t.text)).toEqual(["fox", ",", "“", "quoted", "”"]);
  });
  it("orders mixed-direction words visually", () => {
    const t = tokenize("Hello שלום עולם world");
    expect(visualOrder(t, "ltr").map((i) => t[i].text)).toEqual(["Hello", "עולם", "שלום", "world"]);
    const r = tokenize("שלום Polished Pages עולם");
    expect(visualOrder(r, "rtl").map((i) => r[i].text)).toEqual(["עולם", "Polished", "Pages", "שלום"]);
    // Trailing punctuation follows the paragraph: after the Hebrew in English, before it (leftmost) in Hebrew.
    const m = tokenize("version 3.2 עכשיו.");
    expect(visualOrder(m, "ltr").map((i) => m[i].text).join(" ")).toBe("version 3.2 עכשיו .");
    const h = tokenize("הָאָרֶץ 2026.");
    expect(visualOrder(h, "rtl").map((i) => h[i].text).join(" ")).toBe(". 2026 הָאָרֶץ");
  });
});

describe("PDF typesetting", () => {
  it("embeds shaped text for every script, subset and selectable", async () => {
    const doc = await PDFDocument.create();
    const ts = await Typesetter.create(doc, { body: "ebgaramond", heading: "playfair", scripts: scriptsIn(SAMPLES.join(" ")), fetchFont: nodeFetchFont });
    const pc = ts.addPage(420, 595);
    let y = 560;
    ts.text(pc, "Every script, one book", 210, y, { kind: "heading", style: "bold", size: 18 }, "center");
    y -= 34;
    for (const s of SAMPLES) {
      for (const line of ts.wrap(s, { kind: "body", style: "regular", size: 12 }, 360)) {
        ts.drawLine(pc, line, 30, y, 360, { kind: "body", style: "regular", size: 12 }, "justify");
        y -= 19;
      }
      y -= 8;
    }
    ts.finish();
    const bytes = await doc.save();
    if (process.env.TYPESET_OUT) fs.writeFileSync(process.env.TYPESET_OUT, bytes);
    expect(bytes.length).toBeLessThan(1_500_000); // subset, not whole fonts
    const back = await PDFDocument.load(bytes);
    expect(back.getPageCount()).toBe(1);
  }, 60_000);
});
