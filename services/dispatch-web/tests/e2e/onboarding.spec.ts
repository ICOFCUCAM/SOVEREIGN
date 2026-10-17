import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { FIX, go, mockApi, personJwt, signIn } from "./mock-api";

// Sign-in doors, people's password sign-in, the invitation page, the Welcome on a new institution's first
// sign-in, "Go to a page" and the folding rail. API answers for the new endpoints are given per test.
const PERSON = "amina.okafor@example.org";
const personSession = (scopes = ["dispatch:read", "dispatch:render"]) => ({ status: 200, body: { access_token: personJwt(PERSON, scopes), tenantId: FIX.tenantId, expiresIn: 3600, scopes } });
const TOKEN = "Q".repeat(43);

// A brand-new institution: nothing configured, answered from state the set-up's own writes change.
function newInstitution() {
  const st = { departments: [] as unknown[], roles: [] as unknown[] };
  const respond = (m: string, p: string): { status: number; body: unknown } | undefined => {
    if (m === "GET" && p === "/v1/governance/roles") return { status: 200, body: { departments: st.departments, roles: st.roles, grants: [], delegations: [] } };
    if (m === "GET" && p === "/v1/users") return { status: 200, body: { users: [] } };
    if (m === "GET" && p === "/v1/governance/policies") return { status: 200, body: { policies: [] } };
    if (m === "GET" && p === "/v1/auth/sso/connection") return { status: 200, body: { connection: null } };
    if (m === "GET" && p === "/v1/admin/clients") return { status: 200, body: { clients: [] } };
    if (m === "GET" && p === "/v1/billing") return { status: 200, body: { ...FIX.singles["/v1/billing"].body, institution: "Ministry of Records" } };
    if (m === "POST" && p === "/v1/governance/departments") { st.departments.push({ key: "fiscal_policy", name: "Fiscal Policy" }); return { status: 201, body: { key: "fiscal_policy" } }; }
    if (m === "POST" && p === "/v1/governance/roles") { st.roles.push({ key: "director_of_fiscal_policy", label: "Director of Fiscal Policy", department_key: null }); return { status: 201, body: { key: "director_of_fiscal_policy" } }; }
    return undefined;
  };
  return { respond };
}
// The administrator key door, without waiting for the console (the set-up is outside it).
async function keySignIn(page: Page): Promise<void> {
  await page.goto("/console");
  await page.getByRole("tab", { name: /Administrator or system key/ }).click();
  await page.getByLabel("Client ID").fill("svc_e2e_console");
  await page.getByLabel("Secret").fill("not-a-real-secret");
  await page.getByRole("button", { name: "Sign in with key" }).click();
  await page.waitForLoadState("networkidle");
}

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
    await expect(page.getByText("Ministry of Records").first()).toBeVisible();
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

  test("a new institution's administrator lands on the full-screen set-up, and the console stays closed", async ({ page }) => {
    await mockApi(page, { respond: newInstitution().respond });
    await keySignIn(page);
    await expect(page).toHaveURL(/\/setup$/);
    await expect(page.getByRole("heading", { name: "Let's establish your institution" })).toBeVisible();
    await expect(page.getByText("Ministry of Records", { exact: true })).toBeVisible();
    await expect(page.locator("#sd-rail")).toHaveCount(0);
    const cards = page.locator("ol > li");
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText("Start here");
    await expect(cards.nth(1)).toContainText("After step 1");
    await expect(page.getByText("Your console opens once the three essentials are complete.")).toBeVisible();
    await go(page, "/admin");
    await expect(page).toHaveURL(/\/setup$/);
    await go(page, "/console/library");
    await expect(page).toHaveURL(/\/setup$/);
  });

  test("step 1 records the structure, then leads to the approval rules", async ({ page }) => {
    const inst = newInstitution();
    await mockApi(page, { respond: inst.respond });
    await keySignIn(page);
    await page.getByRole("link", { name: /Begin/ }).click();
    await expect(page).toHaveURL(/\/setup\/structure$/);
    await expect(page.getByRole("heading", { name: "How is your institution organised?" })).toBeVisible();
    const next = page.getByRole("button", { name: /Save and continue/ });
    await expect(next).toBeDisabled();
    await page.getByLabel("Department name").fill("Fiscal Policy");
    await page.getByRole("button", { name: "Add department" }).click();
    await expect(page.getByRole("button", { name: "Remove Fiscal Policy" })).toBeVisible();
    await page.getByLabel("Office name").fill("Director of Fiscal Policy");
    await page.getByRole("button", { name: "Add office" }).click();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page).toHaveURL(/\/setup\/rules$/);
    await expect(page.getByRole("heading", { name: "Who must approve your records?" })).toBeVisible();
    await page.getByLabel("Add an office to the chain").selectOption({ label: "Director of Fiscal Policy" });
    await expect(page.getByText(/In plain words:.*approved by the Director of Fiscal Policy/)).toBeVisible();
  });

  test("once the essentials are in place the set-up says so and opens the console", async ({ page }) => {
    await mockApi(page, { respond: (m, p) => (m === "GET" && p === "/v1/billing" ? { status: 200, body: { ...FIX.singles["/v1/billing"].body, institution: "Ministry of Records" } } : undefined) });
    await keySignIn(page);
    await expect(page).toHaveURL(/\/console$/);
    await go(page, "/setup");
    await expect(page.getByRole("heading", { name: "Your institution is established" })).toBeVisible();
    await page.getByRole("link", { name: /Open the console/ }).click();
    await expect(page.getByRole("heading", { name: "Institutional Posture" })).toBeVisible();
  });

  test("an invitation can be sent by email, copied as a message, or scanned as a QR code", async ({ page }) => {
    const users = { users: [{ id: "u3", subject: "user:u3", email: "s.berg@example.gov", fullName: "Sarah Berg", departmentKey: null, systemAdmin: false, status: "active", signIn: { password: false, lastSignInAt: null, invitationExpiresAt: null } }] };
    await mockApi(page, { respond: (m, p) => {
      if (m === "GET" && p === "/v1/users") return { status: 200, body: users };
      if (m === "GET" && p === "/v1/billing") return { status: 200, body: { ...FIX.singles["/v1/billing"].body, institution: "Ministry of Records" } };
      if (m === "POST" && p === "/v1/users/invite") return { status: 201, body: { token: TOKEN, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() } };
      return undefined;
    } });
    await signIn(page, "/admin/authority");
    await page.getByRole("button", { name: "Invite", exact: true }).click();
    const panel = page.getByRole("status", { name: "Invitation for Sarah Berg" });
    await expect(panel).toBeVisible();
    const href = await panel.getByRole("link", { name: "Open in email" }).getAttribute("href");
    expect(href).toMatch(/^mailto:s\.berg%40example\.gov\?subject=/);
    const body = decodeURIComponent(href!.split("&body=")[1]);
    expect(body).toContain("Dear Sarah Berg,");
    expect(body).toContain("Ministry of Records has invited you");
    expect(body).toContain(`/invite#token=${TOKEN}`);
    await expect(panel.getByRole("button", { name: "Copy message" })).toBeVisible();
    await panel.getByRole("button", { name: "QR code" }).click();
    await expect(panel.getByRole("img", { name: "QR code of the invitation link for Sarah Berg" })).toBeVisible();
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
