import { describe, expect, it } from "vitest";
import { navForRole } from "../lib/access";
import { searchPages } from "./CommandPalette";

describe("command palette search", () => {
  const items = navForRole("founder");
  it("lists every page for an empty query", () => { expect(searchPages(items, "")).toHaveLength(items.length); });
  it("matches menu names, page names and groups, every word", () => {
    expect(searchPages(items, "readiness").map((n) => n.label)).toContain("Check Readiness");
    expect(searchPages(items, "data room").every((n) => `${n.label} ${n.name ?? ""} ${n.group}`.toLowerCase().includes("room"))).toBe(true);
    expect(searchPages(items, "zzzz")).toHaveLength(0);
  });
});
