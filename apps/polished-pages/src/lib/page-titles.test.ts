import { describe, expect, it } from "vitest";
import { HOME_TITLE, pageTitle } from "./page-titles";
import { friendlyAuthError } from "./auth-errors";

describe("pageTitle", () => {
  it("keeps the full brand title on the home page", () => {
    expect(pageTitle("/")).toBe(HOME_TITLE);
  });
  it("names tool pages from the tool list", () => {
    expect(pageTitle("/book")).toBe("Book Creator · Polished Pages");
    expect(pageTitle("/cv/")).toBe("CV Builder · Polished Pages");
  });
  it("names other and parameterised pages", () => {
    expect(pageTitle("/pricing")).toBe("Pricing · Polished Pages");
    expect(pageTitle("/organizations/acme/analytics")).toBe("Organization analytics · Polished Pages");
    expect(pageTitle("/catalog/author/Jane")).toBe("Author · Polished Pages");
  });
  it("falls back to the brand title for unknown routes", () => {
    expect(pageTitle("/nope")).toBe(HOME_TITLE);
  });
});

describe("friendlyAuthError", () => {
  it("rewrites known Supabase messages", () => {
    expect(friendlyAuthError("Invalid login credentials")).toMatch(/don't match/);
    expect(friendlyAuthError("Email not confirmed")).toMatch(/Confirm your email/);
  });
  it("passes unknown messages through", () => {
    expect(friendlyAuthError("Something odd")).toBe("Something odd");
  });
});
