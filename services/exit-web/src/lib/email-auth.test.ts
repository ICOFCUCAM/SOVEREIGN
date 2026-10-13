import { describe, it, expect, vi } from "vitest";
import { sendSignInLink, parseCallback, verifyUser, loadAccess, saveSide, consoleRole, type AuthConfig } from "./email-auth";
import { ensureSupabaseSession } from "./supabase-auth";

const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const cfgWith = (fetchImpl: typeof fetch): AuthConfig => ({ url: "https://p.supabase.co", anonKey: "anon", fetchImpl });

describe("email-link sign-in", () => {
  it("asks Supabase to e-mail a one-time link that returns to the console", async () => {
    const f = vi.fn(async () => json(200, {}));
    await sendSignInLink(cfgWith(f as unknown as typeof fetch), " Founder@Example.com ", "https://exit.example/console");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://p.supabase.co/auth/v1/otp?redirect_to=https%3A%2F%2Fexit.example%2Fconsole");
    expect(JSON.parse(String(init.body))).toEqual({ email: "founder@example.com", create_user: true });
  });

  it("refuses an address that is not an e-mail before calling anything", async () => {
    const f = vi.fn();
    await expect(sendSignInLink(cfgWith(f as unknown as typeof fetch), "not-an-email", "x")).rejects.toThrow(/valid e-mail/);
    expect(f).not.toHaveBeenCalled();
  });

  it("reads the tokens, or the error, Supabase returns in the link's fragment", () => {
    expect(parseCallback("#access_token=a.b.c&refresh_token=r1&expires_in=3600&type=magiclink")).toEqual({ accessToken: "a.b.c", refreshToken: "r1", expiresIn: 3600 });
    expect(parseCallback("#error=access_denied&error_description=Email+link+is+invalid+or+has+expired")).toEqual({ error: "Email link is invalid or has expired" });
    expect(parseCallback("")).toBeNull();
  });

  it("trusts only Supabase's own answer about whose token it is, and only for a confirmed address", async () => {
    const ok = vi.fn(async () => json(200, { id: "u1", email: "a@b.co", email_confirmed_at: "2026-10-13T00:00:00Z" }));
    expect(await verifyUser(cfgWith(ok as unknown as typeof fetch), "tok")).toEqual({ id: "u1", email: "a@b.co" });
    const unconfirmed = vi.fn(async () => json(200, { id: "u1", email: "a@b.co", email_confirmed_at: null }));
    await expect(verifyUser(cfgWith(unconfirmed as unknown as typeof fetch), "tok")).rejects.toThrow(/not been confirmed/);
    const bad = vi.fn(async () => json(401, { msg: "invalid JWT" }));
    await expect(verifyUser(cfgWith(bad as unknown as typeof fetch), "forged")).rejects.toThrow(/invalid JWT/);
  });

  it("reads the side and grants under the person's own token", async () => {
    const f = vi.fn(async (url: string) => json(200, url.includes("exitos_accounts") ? [{ role: "buyer" }] : [{ role: "approver" }, { role: "bogus" }]));
    const a = await loadAccess(cfgWith(f as unknown as typeof fetch), { accessToken: "tok", userId: "u1" });
    expect(a).toEqual({ side: "buyer", grants: ["approver"] });
    for (const call of f.mock.calls as unknown as Array<[string, RequestInit]>) expect((call[1].headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("saves only the side the person chose for their own account", async () => {
    const f = vi.fn(async () => new Response(null, { status: 201 }));
    await saveSide(cfgWith(f as unknown as typeof fetch), { accessToken: "tok", userId: "u1", email: "a@b.co" }, "founder");
    const body = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body[0]).toMatchObject({ id: "u1", role: "founder" });
  });
});

describe("console role", () => {
  it("comes from the side, and only an operator grant makes an operator", () => {
    expect(consoleRole("founder", [])).toBe("founder");
    expect(consoleRole("buyer", ["approver", "counsel"])).toBe("buyer");    // capabilities, not console roles
    expect(consoleRole(null, ["operator"])).toBe("superadmin");
    expect(consoleRole(null, [])).toBeNull();
  });
});

describe("no anonymous identity", () => {
  it("ensureSupabaseSession never signs up anonymously", async () => {
    const f = vi.fn(async () => json(200, { access_token: "x", refresh_token: "y", user: { id: "anon" } }));
    await expect(ensureSupabaseSession({ url: "https://p.supabase.co", anonKey: "anon", fetchImpl: f as unknown as typeof fetch })).rejects.toThrow(/no verified session/);
    expect((f.mock.calls as unknown as Array<[string]>).some(([u]) => u.includes("/signup"))).toBe(false);
  });
});
