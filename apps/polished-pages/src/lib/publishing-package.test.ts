import { describe, expect, it } from "vitest";
import { packageChecks } from "./publishing-package";
import { getTrim } from "./print-sizes";

describe("publishing package checks", () => {
  it("blocks a screen size or a page count the platforms refuse, and advises on author, ISBN and cover", () => {
    const bad = packageChecks({ title: "B", trim: getTrim("kindle") }, 12);
    expect(bad.filter((c) => !c.ok && c.level === "block").map((c) => c.text)).toEqual([expect.stringMatching(/screen preview/), expect.stringMatching(/24–828/)]);
    const good = packageChecks({ title: "B", author: "T", isbn: "978-0-00-000000-0", trim: getTrim("6x9"), coverUrl: "x" }, 180);
    expect(good.every((c) => c.ok)).toBe(true);
  });
});
