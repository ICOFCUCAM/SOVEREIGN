import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VerificationPathways, DevVerificationTools, IdentityStatusCard, type IdentityState } from "./IdentityGate";
import { pathwayState, type IdentityProvider, type PathwayState } from "../lib/identity";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const base = { hasServer: true, checked: true, available: true, current: null, latest: null, now: NOW };
const attempt = (status: "pending" | "verified" | "failed" | "canceled", minsAgo: number, expires?: string) =>
  ({ provider: "stripe_identity" as const, status, failure: status === "failed" ? "document_unverified_other" : null, created_at: new Date(NOW - minsAgo * 60_000).toISOString(), verified_at: null, expires_at: expires ?? null });

describe("pathway state comes from the server, never from the page", () => {
  it("covers every state", () => {
    expect(pathwayState("stripe_identity", { ...base, hasServer: false })).toBe("unavailable");
    expect(pathwayState("stripe_identity", { ...base, checked: false })).toBe("checking");
    expect(pathwayState("stripe_identity", { ...base, available: false })).toBe("unavailable");
    expect(pathwayState("stripe_identity", base)).toBe("available");
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("pending", 5) })).toBe("in_progress");
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("pending", 45) })).toBe("available"); // an abandoned attempt
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("failed", 5) })).toBe("failed");
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("canceled", 5) })).toBe("failed");
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("verified", 5, "2026-10-01T00:00:00Z") })).toBe("expired");
    expect(pathwayState("stripe_identity", { ...base, current: { provider: "stripe_identity", status: "verified", country: null, verified_at: "2026-10-14T11:00:00Z", expires_at: "2028-10-14T11:00:00Z" } })).toBe("verified");
  });
  it("an attempt on another method does not change this one", () => {
    expect(pathwayState("no_bankid", { ...base, available: false, latest: attempt("pending", 1) })).toBe("unavailable");
  });
});

const ident = (over: Partial<IdentityState> & { states?: Partial<Record<IdentityProvider, PathwayState>> } = {}): IdentityState => ({
  identity: null, latest: null, hasServer: true, busy: null, error: null, start: () => undefined, checkStripe: () => undefined, devTools: null,
  stateOf: (p) => over.states?.[p] ?? "unavailable", ...over,
});

describe("verification pathways", () => {
  it("only an available method offers an action; an unavailable one says so and offers none", () => {
    const html = renderToStaticMarkup(<VerificationPathways id={ident({ states: { stripe_identity: "available", no_bankid: "unavailable" } })} basedIn="Norway" />);
    expect(html).toContain("Begin with Stripe Identity");
    expect(html).not.toContain("Begin with BankID");
    expect(html).toContain("Not yet available");
    expect(html).toContain("cannot be used yet");
  });
  it("shows Norway's pathway first for a Norwegian seller, with its country treatment", () => {
    const html = renderToStaticMarkup(<VerificationPathways id={ident()} basedIn="Norway" />);
    expect(html.indexOf("BankID")).toBeLessThan(html.indexOf("Stripe Identity"));
    expect(html).toContain("National eID · Norway");
  });
  it("in progress, failed and verified states read as such", () => {
    expect(renderToStaticMarkup(<VerificationPathways id={ident({ states: { stripe_identity: "in_progress" } })} basedIn="" />)).toContain("Check my result");
    expect(renderToStaticMarkup(<VerificationPathways id={ident({ states: { stripe_identity: "failed" } })} basedIn="" />)).toContain("Try again");
  });
  it("no development shortcut where there is no development facility", () => {
    const html = renderToStaticMarkup(<VerificationPathways id={ident({ hasServer: false })} basedIn="Norway" />);
    expect(html).not.toMatch(/Mark this session/i);
    expect(renderToStaticMarkup(<DevVerificationTools id={ident({ hasServer: false })} provider="no_bankid" />)).toBe("");
  });
  it("a test identity is labelled as such, never as verified", () => {
    const html = renderToStaticMarkup(<IdentityStatusCard identity={{ provider: "no_bankid", verifiedAt: "2026-10-14T10:00:00Z", local: true }} />);
    expect(html).toContain("Marked for testing");
    expect(html).not.toContain(">Verified<");
  });
});
