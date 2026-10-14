import { describe, it, expect } from "vitest";
import { providersFor, countryCode, providerLabel, startVerification, identityStatus, completeEid } from "./identity";
import { normalizeListing } from "./listings";

const remote = (respond: (url: string, init?: RequestInit) => { status: number; body: unknown }) => ({
  url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok",
  fetchImpl: (async (url: string, init?: RequestInit) => { const r = respond(url, init); return new Response(JSON.stringify(r.body), { status: r.status }); }) as typeof fetch,
});

describe("identity verification (client)", () => {
  it("offers a founder their national eID first and Stripe Identity everywhere", () => {
    expect(providersFor("Norway").suggested.map((p) => p.id)).toEqual(["no_bankid", "stripe_identity"]);
    expect(providersFor("NL").suggested.map((p) => p.id)).toEqual(["be_itsme", "nl_idin", "stripe_identity"]);
    expect(providersFor("United States").suggested.map((p) => p.id)).toEqual(["stripe_identity"]);
    const all = providersFor("Sweden"); expect(all.suggested.length + all.other.length).toBe(10);
  });
  it("reads country names and codes", () => {
    expect(countryCode("Sverige")).toBe("SE"); expect(countryCode("dk")).toBe("DK"); expect(countryCode("Narnia")).toBeUndefined();
    expect(providerLabel("no_bankid")).toBe("BankID Norway"); expect(providerLabel("stripe_identity")).toBe("Stripe Identity");
  });
  it("calls the function with the caller's token and returns the provider URL", async () => {
    let seen: RequestInit | undefined;
    const url = await startVerification(remote((u, init) => { seen = init; expect(u).toBe("https://x.supabase.co/functions/v1/exit-identity"); return { status: 200, body: { ok: true, url: "https://verify.stripe.com/s/1" } }; }), "stripe_identity", "https://app/console/intake", "NO");
    expect(url).toBe("https://verify.stripe.com/s/1");
    expect((seen?.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(String(seen?.body))).toEqual({ action: "start", provider: "stripe_identity", returnUrl: "https://app/console/intake", country: "NO" });
  });
  it("surfaces the server's refusal", async () => {
    await expect(identityStatus(remote(() => ({ status: 401, body: { ok: false, error: "sign in to verify your identity" } })))).rejects.toThrow("sign in to verify your identity");
    await expect(completeEid(remote(() => ({ status: 400, body: { ok: false, error: "this sign-in has expired" } })), "c", "s")).rejects.toThrow("expired");
  });
  it("a listing keeps the server's verification stamp and drops a malformed one", () => {
    const base = { id: "l", code: "P", listedAt: "t", publicView: { sector: "S", region: "Europe" } };
    expect(normalizeListing({ ...base, verification: { provider: "no_bankid", verifiedAt: "2026-10-14T10:00:00Z" } }).verification).toEqual({ provider: "no_bankid", verifiedAt: "2026-10-14T10:00:00Z" });
    expect(normalizeListing({ ...base, verification: { provider: 1 } }).verification).toBeUndefined();
  });
});
