import { describe, expect, it, vi } from "vitest";
import { insertBlock, insertFootnote } from "./markdown-format";
import { resolveFigures } from "./figures";
import { fetchVerse, verseBlock } from "./scripture-insert";

describe("footnotes, images and verses in the text", () => {
  it("adds the next footnote at the cursor with its note line at the end", () => {
    const r = insertFootnote("Angels are messengers.[^1]\n\n[^1]: Hebrew.", 9);
    expect(r.text).toBe("Angels ar[^2]e messengers.[^1]\n\n[^1]: Hebrew.\n\n[^2]: ");
    expect(r.start).toBe(r.text.length);
  });
  it("puts a block on its own lines and resolves figures for the book", () => {
    expect(insertBlock("One.Two.", 4, "![Map](figure:f1)").text).toBe("One.\n\n![Map](figure:f1)\n\nTwo.");
    expect(resolveFigures("![Map](figure:f1) and ![Gone](figure:x)", { f1: "data:image/jpeg;base64,AAA" })).toBe("![Map](data:image/jpeg;base64,AAA) and ![Gone](figure:x)");
  });
  it("fetches a verse word for word and sets it as a quotation with its reference", async () => {
    const fake = vi.fn(async () => new Response(JSON.stringify({ reference: "John 3:16", text: "For God so loved the world,\n", translation_id: "kjv" }), { status: 200 }));
    const v = await fetchVerse("John 3:16", "kjv", fake as unknown as typeof fetch);
    expect(verseBlock(v)).toBe("> “For God so loved the world,” (John 3:16, KJV)");
    expect(String((fake.mock.calls[0] as unknown[])[0])).toBe("https://bible-api.com/John%203%3A16?translation=kjv");
    await expect(fetchVerse("John", "kjv", fake as unknown as typeof fetch)).rejects.toThrow(/reference such as/);
  });
});
