import { describe, it, expect } from "vitest";
import { NAV, canAccess } from "./access.js";
import { pageGuide, PAGE_GUIDE_PATHS } from "./page-guide.js";

const base = (to: string): string => to.split("#")[0]!;

describe("page guide", () => {
  it("has a purpose for every page in the menu, for each role that sees it", () => {
    for (const n of NAV) for (const r of n.roles) {
      expect(pageGuide(base(n.to), r)?.purpose, `${n.to} (${r})`).toBeTruthy();
    }
  });

  it("only points to a next page the same role can open", () => {
    for (const n of NAV) for (const r of n.roles) {
      const next = pageGuide(base(n.to), r)?.next;
      if (next) expect(canAccess(next, r), `${n.to} → ${next} (${r})`).toBe(true);
    }
  });

  it("covers buyer profiles by prefix and nothing unknown", () => {
    expect(pageGuide("/console/buyer/abc", "founder")?.purpose).toMatch(/One buyer/);
    expect(pageGuide("/console/upgrade", "founder")).toBeNull();
    expect(PAGE_GUIDE_PATHS.length).toBe(41); // every route but Upgrade (Company Story added in D4)
  });
});
