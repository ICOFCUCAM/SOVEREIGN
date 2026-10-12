import { describe, expect, it } from "vitest";
import { isDevOperator } from "./auth.js";

describe("operator bootstrap", () => {
  it("grants nothing when no operator e-mail is configured", () => {
    expect(isDevOperator("anyone@example.com", "")).toBe(false);
    expect(isDevOperator("", "")).toBe(false);
  });

  it("matches only the configured e-mail, case- and space-insensitively", () => {
    expect(isDevOperator("  Ops@Example.com ", "ops@example.com")).toBe(true);
    expect(isDevOperator("ops@example.co", "ops@example.com")).toBe(false);
  });
});
