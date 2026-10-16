import { test, expect } from "@playwright/test";
import { FIX, mockApi, personJwt, signIn } from "./mock-api";

// Sign-in doors, people's password sign-in, the invitation page, the Welcome on a new institution's first
// sign-in, "Go to a page" and the folding rail. API answers for the new endpoints are given per test.
const PERSON = "amina.okafor@example.org";
const personSession = (scopes = ["dispatch:read", "dispatch:render"]) => ({ status: 200, body: { access_token: personJwt(PERSON, scopes), tenantId: FIX.tenantId, expiresIn: 3600, scopes } });
const TOKEN = "Q".repeat(43);

test.describe("sign-in and onboarding", () => {
  test("three named doors; a person on a domain without an identity provider signs in with a password", async ({ page }) => {
    const log = await mockApi(page, { respond: (m, p) => {
      if (m === "POST" && p === "/v1/auth/method") return { status: 200, body: { method: "password" } };
      if (m === "POST" && p === "/v1/auth/password") return personSession();
      return undefined;
    } });
    await page.goto("/console");
    for (const name of [/I work at an institution/, /Set up a new institution/, /Administrator or system key/]) await expect(page.getByRole("tab", { name })).toBeVisible();
    await expect(page.getByRole("tab", { name: /I work at an institution/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("Password")).toHaveCount(0);
    await page.getByRole("textbox", { name: "Work email" }).fill(PERSON);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Password").fill("correct horse battery");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.locator("#sd-main").waitFor();
    await expect(page.locator("#sd-rail")).toContainText(PERSON);
    await expect(page.locator("#sd-rail")).toContainText(/Person/);
    expect(log.unmatched.filter((u) => u.includes("/v1/auth"))).toEqual([]);
  });

  test("a wrong password gets one plain answer", async ({ page }) => {
    await mockApi(page, { respond: (m, p) => {
      if (m === "POST" && p === "/v1/auth/method") return { status: 200, body: { method: "password" } };
      if (m === "POST" && p === "/v1/auth/password") return { status: 401, body: { error: { code: "INVALID_SIGN_IN", message: "x" } } };
      return undefined;
    } });
    await page.goto("/console");
    await page.getByRole("textbox", { name: "Work email" }).fill(PERSON);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Password").fill("not the password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText("don't match");
  });

  test("the new-institution door explains the Evaluation and leads to sign-up", async ({ page }) => {
    await mockApi(page);
    await page.goto("/console");
    await page.getByRole("tab", { name: /Set up a new institution/ }).click();
    await expect(page.getByText(/free for 30 days and includes 10 official records/)).toBeVisible();
    await page.getByRole("link", { name: /Create your institution's account/ }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText(/Free for 30 days, with 10 official records/)).toBeVisible();
  });

  test("an invitation names the person, checks the password and signs them in", async ({ page }) => {
    await mockApi(page, { respond: (m, p) => {
      if (m === "POST" && p === "/v1/auth/invitation") return { status: 200, body: { state: "valid", institution: "Ministry of Records", email: PERSON, fullName: "Amina Okafor", expiresAt: new Date(Date.now() + 6 * 86400000).toISOString() } };
      if (m === "POST" && p === "/v1/auth/invitation/accept") return personSession();
      return undefined;
    } });
    await page.goto(`/invite#token=${TOKEN}`);
    await expect(page.getByRole("heading", { name: "Welcome, Amina Okafor" })).toBeVisible();
    await expect(page.getByText("Ministry of Records")).toBeVisible();
    expect(new URL(page.url()).hash).toBe("");
    const submit = page.getByRole("button", { name: "Set password and sign in" });
    await page.getByLabel("Choose a password").fill("short");
    await expect(submit).toBeDisabled();
    await page.getByLabel("Choose a password").fill("a long enough passphrase");
    await page.getByLabel("Repeat it").fill("a different passphrase!");
    await expect(page.getByText("The two passwords don't match.")).toBeVisible();
    await page.getByLabel("Repeat it").fill("a long enough passphrase");
    await submit.click();
    await page.locator("#sd-main").waitFor();
    await expect(page).toHaveURL(/\/console$/);
  });

  test("a spent invitation says what to do", async ({ page }) => {
    await mockApi(page, { respond: (m, p) => (m === "POST" && p === "/v1/auth/invitation" ? { status: 200, body: { state: "expired", institution: null, email: null, fullName: null, expiresAt: null } } : undefined) });
    await page.goto(`/invite#token=${TOKEN}`);
    await expect(page.getByText(/has expired\. Ask your administrator for a new link/)).toBeVisible();
    await expect(page.getByLabel("Choose a password")).toHaveCount(0);
  });

  test("an administrator's first sign-in to an empty institution opens the Welcome, once", async ({ page }) => {
    const empty: Record<string, unknown> = {
      "/v1/governance/roles": { departments: [], roles: [], grants: [], delegations: [] },
      "/v1/users": { users: [] }, "/v1/governance/policies": { policies: [] },
      "/v1/auth/sso/connection": { connection: null }, "/v1/admin/clients": { clients: [] },
    };
    await mockApi(page, { respond: (m, p) => (m === "GET" && empty[p] ? { status: 200, body: empty[p] } : undefined) });
    await signIn(page);
    await expect(page).toHaveURL(/\/admin\/welcome$/);
    await expect(page.getByRole("heading", { name: "Let's set up your institution" })).toBeVisible();
    const first = page.locator("#sd-main ol > li").first();
    await expect(first).toContainText("Establish your institution");
    await expect(first).toContainText("Next");
    await page.locator("#sd-rail nav").getByRole("link", { name: /Overview/ }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Institutional Posture" })).toBeVisible();
  });

  test("Go to a page finds a page by what it is for", async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await page.keyboard.press("Control+k");
    const box = page.getByRole("combobox", { name: "Page name" });
    await box.fill("governance act");
    await expect(page.getByRole("option").first()).toContainText("Audit trail");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/console\/audit$/);
    await expect(page.getByRole("dialog", { name: "Go to a page" })).toHaveCount(0);
  });

  test("the rail folds to its icons and back", async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    const rail = page.locator("#sd-rail");
    await page.locator("#sd-main").click();
    await page.keyboard.press("[");
    await expect.poll(async () => (await rail.boundingBox())?.width).toBeLessThan(80);
    await expect(rail.getByRole("link", { name: "Write a new record" })).toBeVisible();
    await page.getByRole("button", { name: "Expand the menu" }).click();
    await expect.poll(async () => (await rail.boundingBox())?.width).toBeGreaterThan(240);
  });
});
