import { describe, expect, it } from "vitest";
import { canAccess } from "../lib/access";
import { layersFor } from "./LayerBar";

describe("command layers by role", () => {
  it("only offers layers, and links, the role can open", () => {
    for (const role of ["founder", "buyer", "admin", "superadmin"] as const) {
      for (const l of layersFor(role)) expect(canAccess(l.href, role), `${role} → ${l.href}`).toBe(true);
    }
  });
  it("gives the operator all five layers", () => { expect(layersFor("superadmin")).toHaveLength(5); });
});
