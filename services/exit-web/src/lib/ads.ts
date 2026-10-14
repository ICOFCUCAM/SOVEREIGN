import type { Remote } from "./documents/store";

// ── LISTING-DESK PROMOTIONS ─────────────────────────────────────────
// Campaigns the operator runs in the listing desk's sidebar: their own products first (Sovereign
// Dispatch and the rest of the portfolio), approved partners later. The server decides who sees
// what (a founder only ever receives a published campaign inside its schedule; images are signed
// only for those); this module validates what an operator enters, picks what to show for a stage,
// and talks to Supabase. Without a server (development, or a build not connected to the exchange)
// campaigns are kept in this browser so the desk and the manager still work end to end.

export type AdStage = "identity" | "profile" | "review";
export const AD_STAGES: readonly AdStage[] = ["identity", "profile", "review"];
export const AD_STAGE_LABEL: Record<AdStage, string> = { identity: "Identity", profile: "Company profile", review: "Review and publish" };

export type AdStatus = "draft" | "published" | "paused" | "archived";
/** What an operator sees: the stored status, with schedule applied to published campaigns. */
export type AdState = "Draft" | "Scheduled" | "Published" | "Paused" | "Expired" | "Archived";

export interface Campaign {
  readonly id: string;
  readonly name: string;                 // internal
  readonly eyebrow: string | null;
  readonly headline: string;
  readonly body: string | null;
  readonly cta_label: string | null;
  readonly cta_url: string | null;
  readonly attribution: string | null;
  readonly image_path: string | null;
  readonly video_path?: string | null;   // optional muted, looping video; the image is its cover frame
  readonly image_alt: string | null;
  readonly focal_x: number;
  readonly focal_y: number;
  readonly stages: readonly AdStage[];
  readonly mobile: boolean;
  readonly priority: number;
  readonly position: number;
  readonly status: AdStatus;
  readonly starts_at: string | null;
  readonly ends_at: string | null;
  readonly updated_at?: string;
}
export type CampaignDraft = Omit<Campaign, "id" | "updated_at"> & { readonly id?: string };

export interface AdSettings { readonly rotation_seconds: number; readonly mobile_enabled: boolean }
export const DEFAULT_SETTINGS: AdSettings = { rotation_seconds: 7, mobile_enabled: true };

/** A campaign ready to show: the record plus a URL for its image (signed, or a local data URL). */
export interface Slide { readonly campaign: Campaign; readonly image: string | null; readonly video?: string | null }

export const LIMITS = { name: 120, eyebrow: 60, headline: 120, body: 280, cta_label: 40, cta_url: 500, attribution: 80, image_alt: 200 } as const;
export const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const VIDEO_MAX_BYTES = 25 * 1024 * 1024;

export const emptyDraft = (position = 0): CampaignDraft => ({
  name: "", eyebrow: null, headline: "", body: null, cta_label: null, cta_url: null, attribution: null,
  image_path: null, video_path: null, image_alt: null, focal_x: 50, focal_y: 50, stages: [...AD_STAGES], mobile: true,
  priority: 0, position, status: "draft", starts_at: null, ends_at: null,
});

export function campaignState(c: Pick<Campaign, "status" | "starts_at" | "ends_at">, now = Date.now()): AdState {
  if (c.status === "archived") return "Archived";
  if (c.status === "paused") return "Paused";
  if (c.status === "draft") return "Draft";
  if (c.starts_at && Date.parse(c.starts_at) > now) return "Scheduled";
  if (c.ends_at && Date.parse(c.ends_at) <= now) return "Expired";
  return "Published";
}
export const isLive = (c: Campaign, now = Date.now()): boolean => campaignState(c, now) === "Published";

/** What to show on a stage: live campaigns for it (and for small screens, only those allowed there), highest priority first, then the operator's order. */
export function selectCampaigns(list: readonly Campaign[], stage: AdStage, opts: { mobile?: boolean; now?: number } = {}): Campaign[] {
  return list
    .filter((c) => isLive(c, opts.now) && c.stages.includes(stage) && (!opts.mobile || c.mobile))
    .sort((a, b) => b.priority - a.priority || a.position - b.position);
}

/** An https address with a host and no credentials, or the reason it is not one. */
export function checkUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "Enter the destination address.";
  if (s.length > LIMITS.cta_url) return `At most ${LIMITS.cta_url} characters.`;
  let u: URL;
  try { u = new URL(s); } catch { return "Enter a full address, starting with https://"; }
  if (u.protocol !== "https:") return "The destination must be an https:// address.";
  if (u.username || u.password) return "The address cannot contain a user name or password.";
  if (!/^[A-Za-z0-9.-]+$/.test(u.hostname) || !u.hostname.includes(".")) return "The address needs a real host name.";
  if (/[\s<>"]/.test(s)) return "The address contains characters that are not allowed.";
  return null;
}

/** Everything wrong with a campaign before it can be saved (empty = savable). Publishing also needs an image. */
export function validateCampaign(d: CampaignDraft, forPublish = false): Partial<Record<keyof CampaignDraft | "schedule", string>> {
  const e: Partial<Record<keyof CampaignDraft | "schedule", string>> = {};
  const len = (k: keyof typeof LIMITS, v: string | null): void => { if (v && v.length > LIMITS[k]) e[k] = `At most ${LIMITS[k]} characters.`; };
  if (!d.name.trim()) e.name = "Give the campaign an internal name.";
  if (!d.headline.trim()) e.headline = "Write a headline.";
  (["name", "eyebrow", "headline", "body", "cta_label", "attribution", "image_alt"] as const).forEach((k) => len(k, d[k]));
  if (d.cta_label && !d.cta_url) e.cta_url = "A call to action needs a destination.";
  if (d.cta_url) { const m = checkUrl(d.cta_url); if (m) e.cta_url = m; else if (!d.cta_label?.trim()) e.cta_label = "Name the call to action, e.g. “Explore Dispatch”."; }
  if (!d.stages.length) e.stages = "Choose at least one stage.";
  if (d.starts_at && d.ends_at && Date.parse(d.ends_at) <= Date.parse(d.starts_at)) e.schedule = "The end must be after the start.";
  if (d.image_path && !d.image_alt?.trim()) e.image_alt = "Describe the image for people who cannot see it.";
  if (forPublish && !d.image_path) e.image_path = d.video_path ? "Add a cover image for the video (shown while it loads and to visitors who prefer less motion)." : "Add an image before publishing.";
  if (forPublish && !d.cta_url && !e.cta_url) e.cta_url = "Every slide links somewhere: add the destination before publishing.";
  if (forPublish && d.cta_url && !d.cta_label?.trim() && !e.cta_label) e.cta_label = "Add the button text, e.g. “Explore Dispatch”.";
  return e;
}

/** An image the operator picked, or the reason it cannot be used. */
/** A video the operator picked, or the reason it cannot be used. */
export function checkVideo(file: { type: string; size: number }): string | null {
  if (!(VIDEO_TYPES as readonly string[]).includes(file.type)) return "Use an MP4 or WebM video.";
  if (file.size > VIDEO_MAX_BYTES) return "The video must be 25 MB or smaller.";
  return null;
}
export function checkImage(file: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Use a WebP, JPEG, PNG or AVIF image.";
  if (file.size > IMAGE_MAX_BYTES) return "The image must be 5 MB or smaller.";
  return null;
}
const EXT: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };
export const imagePath = (type: string, uuid: () => string = () => crypto.randomUUID()): string => `${uuid()}/${uuid()}.${EXT[type] ?? "webp"}`;

// only fields the table accepts are ever sent
const FIELDS = ["name", "eyebrow", "headline", "body", "cta_label", "cta_url", "attribution", "image_path", "video_path", "image_alt", "focal_x", "focal_y", "stages", "mobile", "priority", "position", "status", "starts_at", "ends_at"] as const;
const clean = (d: Partial<CampaignDraft>): Record<string, unknown> => {
  const o: Record<string, unknown> = {};
  for (const k of FIELDS) if (k in d) { const v = d[k]; o[k] = typeof v === "string" ? (v.trim() || null) : v; }
  if (typeof o.name !== "string" && "name" in d) o.name = "";
  if (typeof o.headline !== "string" && "headline" in d) o.headline = "";
  return o;
};

// ── server ──────────────────────────────────────────────────────────
const BUCKET = "exitos-ads";
const h = (r: Remote, extra: Record<string, string> = {}): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json", ...extra });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;
async function json<T>(res: Response, what: string): Promise<T> {
  const body = await res.json().catch(() => null) as unknown;
  if (!res.ok) throw new Error(`${what}: ${(body as { message?: string; error?: string } | null)?.message ?? (body as { error?: string } | null)?.error ?? res.status}`);
  return body as T;
}

/** Campaigns this account may see (a founder: live ones only; an operator: all). */
export const loadCampaigns = async (r: Remote): Promise<Campaign[]> =>
  json<Campaign[]>(await f(r)(`${r.url}/rest/v1/exitos_ad_campaigns?select=*&order=position.asc`, { headers: h(r) }), "Reading campaigns");

export async function loadSettings(r: Remote): Promise<AdSettings> {
  const rows = await json<AdSettings[]>(await f(r)(`${r.url}/rest/v1/exitos_ad_settings?select=rotation_seconds,mobile_enabled`, { headers: h(r) }), "Reading settings");
  return rows[0] ?? DEFAULT_SETTINGS;
}

export async function saveSettings(r: Remote, s: AdSettings): Promise<void> {
  const res = await f(r)(`${r.url}/rest/v1/exitos_ad_settings?id=eq.true`, { method: "PATCH", headers: h(r, { Prefer: "return=representation" }), body: JSON.stringify({ rotation_seconds: s.rotation_seconds, mobile_enabled: s.mobile_enabled, updated_at: new Date().toISOString() }) });
  const rows = await json<unknown[]>(res, "Saving settings");
  if (!rows.length) throw new Error("Saving settings: only an operator can change them");
}

/** Create or update; resolves to the stored campaign. The server refuses anyone who is not an operator. */
export async function saveCampaign(r: Remote, d: Partial<CampaignDraft> & { id?: string }): Promise<Campaign> {
  const body = JSON.stringify(clean(d));
  const res = d.id
    ? await f(r)(`${r.url}/rest/v1/exitos_ad_campaigns?id=eq.${encodeURIComponent(d.id)}`, { method: "PATCH", headers: h(r, { Prefer: "return=representation" }), body })
    : await f(r)(`${r.url}/rest/v1/exitos_ad_campaigns`, { method: "POST", headers: h(r, { Prefer: "return=representation" }), body });
  const rows = await json<Campaign[]>(res, "Saving the campaign");
  if (!rows[0]) throw new Error("Saving the campaign: only an operator can change campaigns");
  return rows[0];
}

/** Upload an image (or, with `video`, a video) to the private bucket; resolves to its path. */
export async function uploadImage(r: Remote, file: File, video = false): Promise<string> {
  const bad = video ? checkVideo(file) : checkImage(file); if (bad) throw new Error(bad);
  const path = imagePath(file.type);
  const res = await f(r)(`${r.url}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": file.type, "x-upsert": "false" }, body: file });
  await json<unknown>(res, video ? "Uploading the video" : "Uploading the image");
  return path;
}

/** Short-lived links for the images this account may see (a founder: live campaigns only). */
export async function signImages(r: Remote, paths: readonly string[], seconds = 3600): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const res = await f(r)(`${r.url}/storage/v1/object/sign/${BUCKET}`, { method: "POST", headers: h(r), body: JSON.stringify({ expiresIn: seconds, paths }) });
  const rows = await json<Array<{ path: string | null; signedURL: string | null; error?: string | null }>>(res, "Preparing images");
  const out: Record<string, string> = {};
  for (const x of rows) if (x.path && x.signedURL) out[x.path] = `${r.url}/storage/v1${x.signedURL}`;
  return out;
}

/** Count an impression or click. Never throws: a counter must not disturb the desk. */
export function recordAd(r: Remote, id: string, kind: "impression" | "click"): void {
  try {
    void f(r)(`${r.url}/rest/v1/rpc/exitos_ad_record`, { method: "POST", headers: h(r), body: JSON.stringify({ p_campaign: id, p_kind: kind }), keepalive: true }).catch(() => undefined);
  } catch { /* ignored */ }
}

export interface AdStats { readonly impressions: number; readonly clicks: number }
/** Totals per campaign over the last `days` days (operators only; others read nothing). */
export async function loadStats(r: Remote, days = 30): Promise<Record<string, AdStats>> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const rows = await json<Array<{ campaign_id: string; impressions: number; clicks: number }>>(
    await f(r)(`${r.url}/rest/v1/exitos_ad_stats?select=campaign_id,impressions,clicks&day=gte.${since}`, { headers: h(r) }), "Reading counts");
  return sumStats(rows);
}
export function sumStats(rows: ReadonlyArray<{ campaign_id: string; impressions: number; clicks: number }>): Record<string, AdStats> {
  const out: Record<string, { impressions: number; clicks: number }> = {};
  for (const x of rows) { const s = (out[x.campaign_id] ??= { impressions: 0, clicks: 0 }); s.impressions += x.impressions; s.clicks += x.clicks; }
  return out;
}

// ── this browser (no server) ────────────────────────────────────────
const LOCAL_KEY = "exitos.ads.v1";
interface LocalStore { campaigns: Campaign[]; settings: AdSettings; images: Record<string, string>; stats: Record<string, AdStats> }
const readLocal = (): LocalStore => {
  try { const s = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "null") as LocalStore | null; if (s?.campaigns) return { campaigns: s.campaigns, settings: s.settings ?? DEFAULT_SETTINGS, images: s.images ?? {}, stats: s.stats ?? {} }; } catch { /* fall through */ }
  return { campaigns: [], settings: DEFAULT_SETTINGS, images: {}, stats: {} };
};
const writeLocal = (s: LocalStore): void => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch { throw new Error("This browser has no room left to keep the campaign (images are kept here when not connected)."); }
};
export const local = {
  campaigns: (): Campaign[] => readLocal().campaigns,
  settings: (): AdSettings => readLocal().settings,
  stats: (): Record<string, AdStats> => readLocal().stats,
  image: (path: string | null): string | null => (path ? readLocal().images[path] ?? null : null),
  save(d: Partial<CampaignDraft> & { id?: string }): Campaign {
    const s = readLocal(); const now = new Date().toISOString();
    const prev = d.id ? s.campaigns.find((c) => c.id === d.id) : undefined;
    const c = { ...(prev ?? emptyDraft(s.campaigns.length)), ...clean(d), id: prev?.id ?? crypto.randomUUID(), updated_at: now } as Campaign;
    s.campaigns = prev ? s.campaigns.map((x) => (x.id === c.id ? c : x)) : [...s.campaigns, c];
    writeLocal(s); return c;
  },
  saveSettings(x: AdSettings): void { const s = readLocal(); s.settings = x; writeLocal(s); },
  async upload(file: File, video = false): Promise<string> {
    const bad = video ? checkVideo(file) : checkImage(file); if (bad) throw new Error(bad);
    if (file.size > 1_500_000) throw new Error(`Without a server, files are kept in this browser: use ${video ? "a video" : "an image"} of 1.5 MB or less.`);
    const data = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => rej(new Error("The image could not be read.")); fr.readAsDataURL(file); });
    const path = imagePath(file.type); const s = readLocal(); s.images[path] = data; writeLocal(s); return path;
  },
  record(id: string, kind: "impression" | "click"): void {
    try { const s = readLocal(); const c = s.campaigns.find((x) => x.id === id); if (!c || !isLive(c)) return; const t = (s.stats[id] ??= { impressions: 0, clicks: 0 }) as { impressions: number; clicks: number }; if (kind === "click") t.clicks++; else t.impressions++; writeLocal(s); } catch { /* ignored */ }
  },
};

/** The slides for a stage, from the server or this browser. Any failure → no slides (the desk shows its own panel). */
export async function loadSlides(remote: Remote | undefined, stage: AdStage, mobile = false): Promise<{ slides: Slide[]; settings: AdSettings }> {
  try {
    if (!remote) {
      const settings = local.settings();
      const list = selectCampaigns(local.campaigns(), stage, { mobile });
      return { settings, slides: list.map((c) => ({ campaign: c, image: local.image(c.image_path), video: local.image(c.video_path ?? null) })) };
    }
    const [all, settings] = await Promise.all([loadCampaigns(remote), loadSettings(remote).catch(() => DEFAULT_SETTINGS)]);
    const list = selectCampaigns(all, stage, { mobile });
    const urls = await signImages(remote, list.flatMap((c) => [c.image_path, c.video_path].filter((x): x is string => !!x))).catch(() => ({} as Record<string, string>));
    return { settings, slides: list.map((c) => ({ campaign: c, image: c.image_path ? urls[c.image_path] ?? null : null, video: c.video_path ? urls[c.video_path] ?? null : null })) };
  } catch {
    return { slides: [], settings: DEFAULT_SETTINGS };
  }
}
