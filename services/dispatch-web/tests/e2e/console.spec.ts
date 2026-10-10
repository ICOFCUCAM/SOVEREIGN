import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { FIX, firstDoc, go, mockApi, signIn } from "./mock-api";

// Operations console — recorded-fixture suite. Covers every Operations route at
// desktop / tablet / phone widths, automated accessibility (axe), the console's
// truthfulness rules, confirmation of consequential acts, scope gating, keyboard
// operation and session handling. No backend required.

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

const ROUTES: { name: string; path: () => string; heading: string | RegExp }[] = [
  { name: "command", path: () => "/console", heading: "Command centre" },
  { name: "create", path: () => "/console/create", heading: "Create official record" },
  { name: "review", path: () => "/console/review", heading: "Governance review" },
  { name: "register", path: () => "/console/library", heading: "Official records" },
  { name: "register-filtered", path: () => "/console/library?state=in_review&sort=waiting", heading: "Official records" },
  { name: "preservation", path: () => "/console/archives", heading: "Archives" },
  { name: "record-published", path: () => `/console/documents/${firstDoc("published").documentId}`, heading: firstDoc("published").title },
  { name: "record-preserved", path: () => `/console/documents/${firstDoc("archived").documentId}`, heading: firstDoc("archived").title },
  { name: "record-in-review", path: () => `/console/documents/${firstDoc("in_review").documentId}`, heading: firstDoc("in_review").title },
  { name: "record-rejected", path: () => `/console/documents/${firstDoc("rejected").documentId}`, heading: firstDoc("rejected").title },
  { name: "evidence", path: () => "/console/audit", heading: "Evidence chain" },
  { name: "studio", path: () => "/console/polished", heading: "Polished Pages" },
];

async function settle(page: Page, heading: string | RegExp) {
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  await page.waitForLoadState("networkidle");
}

const horizontalOverflow = (page: Page) => page.evaluate(() => {
  const m = document.getElementById("sd-main");
  return document.documentElement.scrollWidth > window.innerWidth + 1 || (!!m && m.scrollWidth > m.clientWidth + 1);
});

for (const width of [1440, 900, 390]) {
  test.describe(`layout at ${width}px`, () => {
    test.use({ viewport: { width, height: width < 500 ? 844 : 1000 } });
    for (const r of ROUTES) {
      test(`${r.name} renders without overflow or errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        const api = await mockApi(page);
        await signIn(page, r.path());
        await settle(page, r.heading);
        expect(await horizontalOverflow(page)).toBe(false);
        expect(errors).toEqual([]);
        expect(api.unmatched).toEqual([]);
      });
    }
  });
}

test.describe("accessibility (axe, WCAG 2.x A/AA + best practice)", () => {
  for (const r of ROUTES) {
    test(`${r.name} has no axe violations`, async ({ page }) => {
      await mockApi(page);
      await signIn(page, r.path());
      await settle(page, r.heading);
      if (r.name === "review") { await page.locator("button[aria-pressed]").first().click(); await expect(page.getByRole("heading", { name: "Decision" })).toBeVisible(); }
      if (r.name === "evidence") await page.locator('button[aria-controls^="ev-"]').first().click();
      await page.evaluate(axeSource);
      const violations = await page.evaluate(async () => {
        const res = await (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } })
          .axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] });
        return res.violations.map((v) => `${v.id} (${v.nodes.length})`);
      });
      expect(violations).toEqual([]);
    });
  }
});

test.describe("truthful presentation", () => {
  test("rejected records are labelled Rejected, never 'Returned for revision'", async ({ page }) => {
    await mockApi(page);
    const d = firstDoc("rejected");
    await signIn(page, "/console/library?state=rejected");
    const row = page.locator("table.sd-table tbody tr", { hasText: d.title });
    await expect(row).toContainText("Rejected");
    await expect(row).not.toContainText("Returned for revision");
  });

  test("events with a digest say 'Digest recorded', never 'Verified'", async ({ page }) => {
    test.skip(!FIX.audit.some((e) => e.sha256), "fixture has no event with a digest");
    await mockApi(page);
    await signIn(page, "/console/audit");
    await expect(page.getByText("Digest recorded").first()).toBeVisible();
    await expect(page.getByText(/^Verified$/)).toHaveCount(0);
  });

  test("an unknown record is reported as not found without disclosing anything", async ({ page }) => {
    await mockApi(page);
    await signIn(page, "/console/documents/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { level: 1, name: "Record not found" })).toBeVisible();
  });
});

test.describe("consequential acts are confirmed first", () => {
  test("return and reject open a confirmation; cancelling sends nothing", async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page, "/console/review");
    await page.locator("button[aria-pressed]").first().click();
    await page.getByRole("button", { name: "Return for revision" }).click();
    await expect(page.getByRole("dialog", { name: "Return this record for revision?" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Reject" }).click();
    const dlg = page.getByRole("dialog", { name: "Reject this record?" });
    await expect(dlg.getByText(/Decisions are recorded permanently/)).toBeVisible();
    await dlg.getByRole("button", { name: "Cancel" }).click();
    await expect(dlg).toBeHidden();
    expect(api.mutations).toEqual([]);
  });

  test("approve records the decision through the API and reports the engine's result", async ({ page }) => {
    const api = await mockApi(page, { respond: (m, p) => (m === "POST" && /\/decision$/.test(p) ? { status: 200, body: { documentId: "x", decision: "approve", lifecycle: "in_review", approvals: 0, required: 0 } } : undefined) });
    await signIn(page, "/console/review");
    await page.locator("button[aria-pressed]").first().click();
    await page.getByRole("button", { name: /^Approve/ }).click();
    await expect(page.getByRole("status").filter({ hasText: /Approval recorded for .+ Record is now In review\./ })).toBeVisible();
    expect(api.mutations).toEqual([]); // answered by `respond`, not the unmocked-mutation trap
  });

  test("an API refusal is shown as an error, never as success", async ({ page }) => {
    await mockApi(page, { respond: (m, p) => (m === "POST" && /\/decision$/.test(p) ? { status: 409, body: { error: { code: "STEP_NOT_OPEN", message: "the next required approval is 'Permanent Secretary'" } } } : undefined) });
    await signIn(page, "/console/review");
    await page.locator("button[aria-pressed]").first().click();
    await page.getByRole("button", { name: /^Approve/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Decision not recorded" })).toBeVisible();
    await expect(page.getByText(/Approval recorded/)).toHaveCount(0);
  });

  test("publish and preserve require confirmation; preserve is flagged terminal", async ({ page }) => {
    const api = await mockApi(page);
    test.skip(!FIX.documents.some((d) => d.lifecycle === "rendered"), "fixture has no rendered record");
    await signIn(page, `/console/documents/${firstDoc("rendered").documentId}`);
    await page.getByRole("button", { name: /^Publish/ }).click();
    const dlg = page.getByRole("dialog", { name: "Publish this official record?" });
    await expect(dlg).toBeVisible();
    await dlg.getByRole("button", { name: "Cancel" }).click();
    await go(page, `/console/documents/${firstDoc("published").documentId}`);
    await page.getByRole("button", { name: "Preserve for the record" }).click();
    await expect(page.getByText(/Preservation is terminal/)).toBeVisible();
    await page.keyboard.press("Escape");
    expect(api.mutations).toEqual([]);
  });

  test("changing record type with authored sections asks before clearing them", async ({ page }) => {
    await mockApi(page);
    await signIn(page, "/console/create");
    await page.getByLabel(/^Executive Summary/).fill("Drafted text.");
    await page.getByRole("radio", { name: /Board Report/ }).click(); // asks first — the selection must not change yet
    const dlg = page.getByRole("dialog", { name: "Change the record type?" });
    await expect(dlg).toBeVisible();
    await dlg.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByLabel(/^Executive Summary/)).toHaveValue("Drafted text.");
    await expect(page.getByRole("radio", { name: /Executive Briefing/ })).toBeChecked();
  });

  test("submission is impossible until every section and a format are present", async ({ page }) => {
    const api = await mockApi(page);
    await signIn(page, "/console/create");
    await page.getByRole("button", { name: /Submit for governance/ }).click();
    await expect(page.getByText(/^Still needed:/)).toBeVisible();
    expect(api.mutations).toEqual([]);
  });
});

test.describe("permissions", () => {
  test("a read-only credential sees no authoring, review or publication controls", async ({ page }) => {
    await mockApi(page, { scopes: ["dispatch:read"] });
    await signIn(page);
    const nav = page.getByRole("complementary", { name: "Operations navigation" });
    await expect(nav.getByRole("link", { name: "Official records" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Create official record" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Governance review" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Evidence chain" })).toHaveCount(0);
    test.skip(!FIX.documents.some((d) => d.lifecycle === "rendered"), "fixture has no rendered record");
    await go(page, `/console/documents/${firstDoc("rendered").documentId}`);
    await expect(page.getByText(/require the publish permission/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Publish/ })).toHaveCount(0);
  });
});

test.describe("keyboard and session", () => {
  test("g-digit navigation, / to search, j + Enter to open a record", async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await settle(page, "Command centre");
    await page.keyboard.press("g"); await page.keyboard.press("4");
    await expect(page).toHaveURL(/\/console\/library$/);
    await settle(page, "Official records");
    await page.keyboard.press("/");
    await expect(page.locator("#reg-search")).toBeFocused();
    await page.keyboard.press("Escape");
    await page.locator("h1").click();
    await page.keyboard.press("j");
    await expect(page.locator('tr[aria-selected="true"]')).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/console\/documents\//);
  });

  test("a rejected token ends the session and sign-in explains why", async ({ page }) => {
    let reject = false;
    // Once the service stops accepting the token, every authenticated call is refused.
    await mockApi(page, { respond: (m, p) => (reject && p !== "/v1/token" && !p.startsWith("/v1/analytics") ? { status: 401, body: { error: { code: "TOKEN_EXPIRED", message: "" } } } : undefined) });
    await signIn(page, "/console/library");
    reject = true;
    // Any authenticated request now fails. Reloading forces one — unless a
    // background request has already ended the session (the button is then gone).
    await page.getByRole("button", { name: "Reload the register" }).click({ timeout: 3000 }).catch(() => {});
    await expect(page.getByText(/no longer accepted by the service/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Work email")).toBeVisible();
  });

  test.describe("mobile drawer", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("focus moves in, Escape returns it, navigation lands on the page", async ({ page }) => {
      await mockApi(page);
      await signIn(page);
      const open = page.getByRole("button", { name: "Open navigation" });
      await open.click();
      await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("#sd-rail"))).toBe(true);
      await page.keyboard.press("Escape");
      await expect(open).toBeFocused();
      await open.click();
      await page.locator("#sd-rail nav").getByRole("link", { name: "Preservation" }).click();
      await expect(page.locator("#sd-main")).toBeFocused();
    });
  });
});
