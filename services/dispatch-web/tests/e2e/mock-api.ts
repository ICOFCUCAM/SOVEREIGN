import type { Page, Route } from "@playwright/test";
import fixtures from "./fixtures/api.json" with { type: "json" };

// Serves the console from RECORDED API responses (tests/e2e/fixtures/api.json,
// produced by capture-fixtures.mjs against a live stack). List and audit queries
// are answered by filtering the recorded data the way the API does (state, q,
// limit, target, action). Any request the recording cannot answer is returned
// 404 and logged in `unmatched`, so a new API dependency fails tests loudly.

type Doc = (typeof fixtures.documents)[number];
export const FIX = fixtures;
export const ALL_SCOPES = ["dispatch:read", "dispatch:render", "dispatch:approve", "dispatch:publish", "dispatch:audit", "dispatch:validate", "dispatch:admin"];

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
// Display-only token: the console decodes it for scopes/tenant; nothing verifies it here.
const fakeJwt = (scopes: string[], sub: string) =>
  `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub, client_id: sub, scopes, tenant_id: fixtures.tenantId, exp: Math.floor(Date.now() / 1000) + 900 })}.x`;

export interface MockApi { unmatched: string[]; mutations: string[] }

export async function mockApi(page: Page, opts: { scopes?: string[]; subject?: string; respond?: (method: string, path: string) => { status: number; body: unknown } | undefined } = {}): Promise<MockApi> {
  const scopes = opts.scopes ?? ALL_SCOPES;
  const subject = opts.subject ?? "svc_e2e_console";
  const log: MockApi = { unmatched: [], mutations: [] };
  const json = (route: Route, status: number, body: unknown) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  const notFound = (route: Route) => json(route, 404, { error: { code: "NOT_FOUND", message: "not found" } });

  await page.route("**/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const p = url.pathname, q = url.searchParams;
    const custom = opts.respond?.(method, p + url.search);
    if (custom) return json(route, custom.status, custom.body);

    if (method === "POST" && p === "/v1/token")
      return json(route, 200, { access_token: fakeJwt(scopes, subject), token: "", tokenType: "Bearer", expiresIn: 900, tenantId: fixtures.tenantId, scopes });
    if (method === "POST" && p === "/v1/analytics/events") return route.fulfill({ status: 204, body: "" });
    if (method !== "GET") { log.mutations.push(`${method} ${p}`); return json(route, 500, { error: { code: "E2E_UNMOCKED_MUTATION", message: "no recorded response" } }); }

    const single = (fixtures.singles as Record<string, { status: number; body: unknown }>)[p + url.search];
    if (single) return json(route, single.status, single.body);

    if (p === "/v1/documents") {
      let items: Doc[] = fixtures.documents;
      if (q.get("state")) items = items.filter((d) => d.lifecycle === q.get("state"));
      if (q.get("q")) items = items.filter((d) => d.title.toLowerCase().includes(q.get("q")!.toLowerCase()));
      items = items.slice(0, Number(q.get("limit") ?? 50));
      return json(route, 200, { items, count: items.length });
    }
    let m = p.match(/^\/v1\/documents\/([^/]+)$/);
    if (m) { const d = (fixtures.details as Record<string, unknown>)[m[1]]; return d ? json(route, 200, d) : notFound(route); }
    m = p.match(/^\/v1\/documents\/([^/]+)\/certificate$/);
    if (m) { const c = (fixtures.certificates as Record<string, unknown>)[m[1]]; return c ? json(route, 200, c) : json(route, 409, { error: { code: "NOT_PRESERVED", message: "" } }); }
    m = p.match(/^\/v1\/documents\/([^/]+)\/governance-certificate$/);
    if (m) { const c = (fixtures.governanceCertificates as Record<string, unknown>)[m[1]]; return c ? json(route, 200, c) : json(route, 409, { error: { code: "NO_CERTIFICATE", message: "" } }); }
    m = p.match(/^\/v1\/jobs\/([^/]+)$/);
    if (m) { const j = (fixtures.jobs as Record<string, unknown>)[m[1]]; return j ? json(route, 200, j) : notFound(route); }
    if (p === "/v1/audit") {
      let ev = fixtures.audit;
      if (q.get("target")) ev = ev.filter((e) => e.targetId === q.get("target"));
      if (q.get("action")) ev = ev.filter((e) => e.action === q.get("action"));
      ev = ev.slice(0, Number(q.get("limit") ?? 200));
      return json(route, 200, { events: ev, count: ev.length });
    }
    log.unmatched.push(`${method} ${p}${url.search}`);
    return notFound(route);
  });
  return log;
}

export async function signIn(page: Page, path = "/console"): Promise<void> {
  await page.goto("/console");
  await page.getByText("Sign in with a service credential").click();
  await page.getByLabel("Client ID").fill("svc_e2e_console");
  await page.getByLabel("Secret").fill("not-a-real-secret");
  await page.getByRole("button", { name: "Sign in with credential" }).click();
  await page.locator("#sd-main").waitFor();
  await page.waitForLoadState("networkidle");
  if (path !== "/console") await go(page, path);
}

// Client-side navigation — a full page load would drop the in-memory session.
// Waits until the URL has changed and the destination's requests have settled.
export async function go(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => { history.pushState({}, "", p); dispatchEvent(new PopStateEvent("popstate")); }, path);
  await page.waitForURL((u) => u.pathname + u.search === path);
  await page.waitForLoadState("networkidle");
}

export const firstDoc = (state: string): Doc => {
  const d = fixtures.documents.find((x) => x.lifecycle === state);
  if (!d) throw new Error(`fixture has no ${state} record — re-run capture-fixtures.mjs`);
  return d;
};
