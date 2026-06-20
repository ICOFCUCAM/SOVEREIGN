import { describe, it, expect } from "vitest";
import { PREMIUM_TEMPLATES, PREMIUM_COLLECTIONS, isPremiumId, getPremiumTemplate } from "@/lib/premium-templates";
import { TOOLS } from "@/lib/tools";
import { BOOK_THEMES, getBookTheme } from "@/lib/book-themes";
import { FONT_FAMILY } from "@/lib/fonts";

describe("premium templates registry", () => {
  it("has unique ids", () => {
    const ids = PREMIUM_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has exactly one flagship", () => {
    expect(PREMIUM_TEMPLATES.filter((t) => t.flagship)).toHaveLength(1);
  });

  it("references only declared collections and valid fonts", () => {
    const collections = new Set(PREMIUM_COLLECTIONS.map((c) => c.id));
    for (const t of PREMIUM_TEMPLATES) {
      expect(collections.has(t.collection)).toBe(true);
      expect(FONT_FAMILY[t.font]).toBeTruthy();
      if (t.display) expect(FONT_FAMILY[t.display]).toBeTruthy();
    }
  });

  it("isPremiumId / getPremiumTemplate agree", () => {
    expect(isPremiumId("sovereign-executive")).toBe(true);
    expect(isPremiumId("not-a-template")).toBe(false);
    expect(getPremiumTemplate("sovereign-executive")?.name).toBe("Sovereign Executive");
  });
});

describe("tools registry", () => {
  it("has unique ids and paths", () => {
    const ids = TOOLS.map((t) => t.id);
    const paths = TOOLS.map((t) => t.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every tool path is absolute", () => {
    for (const t of TOOLS) expect(t.path.startsWith("/")).toBe(true);
  });
});

describe("book themes", () => {
  it("has unique ids and valid fonts", () => {
    const ids = BOOK_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of BOOK_THEMES) {
      expect(FONT_FAMILY[t.body]).toBeTruthy();
      expect(FONT_FAMILY[t.display]).toBeTruthy();
    }
  });

  it("falls back to the first theme for an unknown id", () => {
    expect(getBookTheme("nope").id).toBe(BOOK_THEMES[0].id);
  });
});
