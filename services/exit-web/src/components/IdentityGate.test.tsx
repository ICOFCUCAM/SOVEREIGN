import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { IdentityMethods, DevVerificationTools, IdentityStatusCard, type IdentityState } from "./IdentityGate";
import { pathwayState, methodOptions, type IdentityStatus } from "../lib/identity";

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
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("pending", 45) })).toBe("available");
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("failed", 5) })).toBe("failed");
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("canceled", 5) })).toBe("failed");
    expect(pathwayState("stripe_identity", { ...base, latest: attempt("verified", 5, "2026-10-01T00:00:00Z") })).toBe("expired");
    expect(pathwayState("stripe_identity", { ...base, current: { provider: "stripe_identity", status: "verified", country: null, verified_at: "2026-10-14T11:00:00Z", expires_at: "2028-10-14T11:00:00Z" } })).toBe("verified");
  });
});

const serverWith = (configured: string[]): IdentityStatus => ({
  providers: {}, verification: null,
  methods: (["stripe_identity", "no_bankid", "se_bankid", "dk_mitid", "fi_ftn", "be_itsme", "nl_idin", "de_eid", "fr_franceconnect", "ee_smartid"] as const)
    .map((id) => ({ id, configured: configured.includes(id), countries: id === "stripe_identity" ? [] : id === "no_bankid" ? ["NO"] : id === "be_itsme" ? ["BE", "NL", "LU"] : ["XX"] })),
});

describe("method options: configured from the server only, eligibility by the identity-document country", () => {
  it("without a server nothing is configured", () => {
    expect(methodOptions(null, "Norway").every((o) => !o.configured)).toBe(true);
  });
  it("eligible methods first, national before worldwide; others are not eligible", () => {
    const o = methodOptions(serverWith(["stripe_identity"]), "NO");
    expect(o.slice(0, 2).map((x) => [x.info.id, x.eligible, x.configured])).toEqual([["no_bankid", true, false], ["stripe_identity", true, true]]);
    expect(o.find((x) => x.info.id === "se_bankid")?.eligible).toBe(false);
  });
  it("no country, nothing eligible", () => expect(methodOptions(serverWith(["stripe_identity"]), undefined).some((o) => o.eligible)).toBe(false));
});

const ident = (status: IdentityStatus | null, over: Partial<IdentityState> = {}): IdentityState => ({
  identity: null, latest: null, hasServer: true, checked: true, busy: null, error: null, start: () => undefined, checkStripe: () => undefined, devTools: null,
  options: (c) => methodOptions(status, c), stateOf: (_id, configured) => (configured ? "available" : "unavailable"), ...over,
});

describe("identity methods", () => {
  it("asks for the identity-document country first", () => {
    expect(renderToStaticMarkup(<IdentityMethods id={ident(serverWith([]))} country={undefined} />)).toContain("Choose the country of your identity document");
  });
  it("nothing configured: says so, offers no action, lists the country's methods as not yet available", () => {
    const html = renderToStaticMarkup(<IdentityMethods id={ident(serverWith([]))} country="NO" />);
    expect(html).toContain("No verification method is open for Norway yet");
    expect(html).not.toMatch(/Continue with|type="radio"/);
    expect(html).toContain("Offered for Norway · not yet available");
    expect(html).toContain("BankID Norway");
  });
  it("a configured, eligible method is selectable with its requirements and an action; an unconfigured one is not", () => {
    const html = renderToStaticMarkup(<IdentityMethods id={ident(serverWith(["stripe_identity"]))} country="NO" />);
    expect(html).toContain("Continue with Stripe Identity");
    expect(html).toContain('type="radio"');
    expect(html).toContain("What is required");
    expect(html).not.toContain("Continue with BankID");
  });
  it("a configured method that is not offered for the country is not selectable", () => {
    const html = renderToStaticMarkup(<IdentityMethods id={ident(serverWith(["no_bankid"]))} country="SE" />);
    expect(html).not.toContain("Continue with BankID");
    expect(html).toContain("No verification method is open for Sweden yet");
  });
  it("no development facility where none is provided", () => {
    expect(renderToStaticMarkup(<DevVerificationTools id={ident(null, { hasServer: false })} provider="no_bankid" />)).toBe("");
  });
  it("a test identity is labelled as such, never as established", () => {
    const html = renderToStaticMarkup(<IdentityStatusCard identity={{ provider: "no_bankid", verifiedAt: "2026-10-14T10:00:00Z", local: true }} />);
    expect(html).toContain("Marked for testing");
    expect(html).not.toContain("Established");
  });
});
