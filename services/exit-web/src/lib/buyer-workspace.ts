import type { Remote } from "./documents/store";

// ── THE BUYER'S WORKSPACE (server) ──────────────────────────────────
// The Acquisition Command Center's shortlist (followed listings, each with a private note) and saved
// views, kept on the buyer's account so they follow the buyer across devices. The server makes the
// caller the owner of every row and lets nobody else read it. Without a server account the page keeps
// them in this browser instead.

export interface ShortlistRow { readonly listing_id: string; readonly note: string }
export interface SavedViewRow<C = unknown> { readonly name: string; readonly config: C }
export interface Workspace<C = unknown> { readonly shortlist: ShortlistRow[]; readonly views: SavedViewRow<C>[] }

const h = (r: Remote, extra: Record<string, string> = {}): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json", ...extra });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;
async function ok(res: Response, what: string): Promise<void> {
  if (res.ok) return;
  const body = await res.json().catch(() => null) as { message?: string } | null;
  throw new Error(`${what}: ${body?.message ?? res.status}`);
}
const enc = encodeURIComponent;
const SHORTLIST = "exitos_buyer_shortlist", VIEWS = "exitos_buyer_saved_views";

export async function loadWorkspace<C>(r: Remote): Promise<Workspace<C>> {
  const [a, b] = await Promise.all([
    f(r)(`${r.url}/rest/v1/${SHORTLIST}?select=listing_id,note&order=created_at.asc`, { headers: h(r) }),
    f(r)(`${r.url}/rest/v1/${VIEWS}?select=name,config&order=created_at.asc`, { headers: h(r) }),
  ]);
  await ok(a, "Reading your shortlist"); await ok(b, "Reading your saved views");
  return { shortlist: await a.json() as ShortlistRow[], views: await b.json() as SavedViewRow<C>[] };
}

/** Follow a listing; an existing note is kept. */
export async function follow(r: Remote, listingId: string): Promise<void> {
  await ok(await f(r)(`${r.url}/rest/v1/${SHORTLIST}?on_conflict=account_id,listing_id`, {
    method: "POST", headers: h(r, { Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify({ listing_id: listingId }),
  }), "Adding to your shortlist");
}
export async function unfollow(r: Remote, listingId: string): Promise<void> {
  await ok(await f(r)(`${r.url}/rest/v1/${SHORTLIST}?listing_id=eq.${enc(listingId)}`, { method: "DELETE", headers: h(r) }), "Removing from your shortlist");
}
export async function saveNote(r: Remote, listingId: string, note: string): Promise<void> {
  await ok(await f(r)(`${r.url}/rest/v1/${SHORTLIST}?on_conflict=account_id,listing_id`, {
    method: "POST", headers: h(r, { Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify({ listing_id: listingId, note: note.slice(0, 600) }),
  }), "Saving your note");
}
/** Save (or replace) a named view. */
export async function saveView<C>(r: Remote, name: string, config: C): Promise<void> {
  await ok(await f(r)(`${r.url}/rest/v1/${VIEWS}?on_conflict=account_id,name`, {
    method: "POST", headers: h(r, { Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify({ name: name.trim().slice(0, 40), config }),
  }), "Saving the view");
}
export async function deleteView(r: Remote, name: string): Promise<void> {
  await ok(await f(r)(`${r.url}/rest/v1/${VIEWS}?name=eq.${enc(name)}`, { method: "DELETE", headers: h(r) }), "Deleting the view");
}

/** What this browser holds that the account does not yet: moved up once, the first time the buyer signs in here. */
export function toUpload<C>(local: { watched: Record<string, boolean>; notes: Record<string, string>; views: Array<{ name: string } & C> }, server: Workspace<C>): { shortlist: ShortlistRow[]; views: Array<{ name: string } & C> } {
  const have = new Set(server.shortlist.map((x) => x.listing_id));
  const names = new Set(server.views.map((v) => v.name));
  return {
    shortlist: Object.keys(local.watched).filter((id) => local.watched[id] && !have.has(id)).map((id) => ({ listing_id: id, note: local.notes[id] ?? "" })),
    views: local.views.filter((v) => !names.has(v.name)),
  };
}
