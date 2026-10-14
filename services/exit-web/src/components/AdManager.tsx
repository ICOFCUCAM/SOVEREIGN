import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Section, Provenance, XO_INPUT, XO_LABEL } from "./xo";
import { notify } from "../lib/ui";
import type { Remote } from "../lib/documents/store";
import {
  AD_STAGES, AD_STAGE_LABEL, DEFAULT_SETTINGS, LIMITS, IMAGE_TYPES, campaignState, emptyDraft, validateCampaign, checkImage,
  loadCampaigns, loadSettings, loadStats, saveCampaign, saveSettings, signImages, uploadImage, local,
  type AdSettings, type AdStage, type AdState, type AdStats, type Campaign, type CampaignDraft,
} from "../lib/ads";
import { SOVEREIGN_PRODUCTS } from "../lib/sovereign-intel";
import { AdPanel } from "./AdPanel";
import { DeskRail } from "./ListingDesk";

// ── ADVERTISING MANAGER (admin console) ─────────────────────────────
// Where an operator runs the listing desk's promotions: create and edit campaigns (text, an image
// with its focal point, an https destination), preview them in the real sidebar and on a phone,
// order them, schedule them, publish, pause and archive them, set the slideshow, and read the counts.
// The server enforces every rule here (only operators write; founders see live campaigns only); this
// page only makes the rules visible. Without a server, campaigns are kept in this browser.

const BTN = "rounded-sm bg-deal-700 px-3 py-2 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";
const GHOST = "rounded-sm border border-xo-line px-2.5 py-1.5 text-[12px] font-medium text-xo-text hover:border-xo-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-40";
const STATE_STYLE: Record<AdState, string> = {
  Draft: "border-xo-line text-xo-muted", Scheduled: "border-xo-action/50 text-xo-action", Published: "border-xo-verified/50 text-xo-verified",
  Paused: "border-xo-caution/50 text-xo-caution", Expired: "border-xo-line text-xo-faint", Archived: "border-xo-line text-xo-faint",
};

// <input type="datetime-local"> works in local time; the server stores instants
const toLocalInput = (iso: string | null): string => { if (!iso) return ""; const d = new Date(iso); const p = (n: number): string => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null);
const when = (iso: string | null): string => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

/** A product of the owner's portfolio as a starting draft: its own catalogue words, never a price or a claim. */
function fromProduct(id: string, position: number): CampaignDraft {
  const p = SOVEREIGN_PRODUCTS.find((x) => x.id === id);
  if (!p) return emptyDraft(position);
  const sentences = p.description.match(/[^.!?]+[.!?]+/g) ?? [p.description];
  let body = ""; for (const s of sentences) { if ((body + s).trim().length > LIMITS.body) break; body += s; }
  return { ...emptyDraft(position), name: `${p.name} · desk promotion`, eyebrow: p.label.slice(0, LIMITS.eyebrow), headline: p.name, body: body.trim() || null, attribution: "Sovereign portfolio" };
}

export const AdManager: React.FC<{ remote?: Remote }> = ({ remote }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<AdSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Record<string, AdStats>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<CampaignDraft | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!remote) {
        const list = local.campaigns();
        setCampaigns(list); setSettings(local.settings()); setStats(local.stats());
        setImages(Object.fromEntries(list.flatMap((c) => { const u = local.image(c.image_path); return c.image_path && u ? [[c.image_path, u]] : []; })));
      } else {
        const [list, s, st] = await Promise.all([loadCampaigns(remote), loadSettings(remote), loadStats(remote).catch(() => ({}))]);
        setCampaigns(list); setSettings(s); setStats(st);
        setImages(await signImages(remote, list.flatMap((c) => (c.image_path ? [c.image_path] : []))).catch(() => ({})));
      }
    } catch (e) { setError((e as Error).message); }
    setLoading(false);
  }, [remote]);
  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (what: () => Promise<unknown>, done: string): Promise<boolean> => {
    setBusy(true); setError(null);
    try { await what(); notify(done); await refresh(); return true; } catch (e) { setError((e as Error).message); return false; } finally { setBusy(false); }
  };
  const save = (d: Partial<CampaignDraft> & { id?: string }): Promise<Campaign> => (remote ? saveCampaign(remote, d) : Promise.resolve(local.save(d)));

  const ordered = useMemo(() => [...campaigns].sort((a, b) => a.position - b.position), [campaigns]);
  const shown = ordered.filter((c) => showArchived || c.status !== "archived");
  const active = ordered.filter((c) => c.status !== "archived");

  const move = (c: Campaign, d: -1 | 1): void => {
    const i = active.findIndex((x) => x.id === c.id), j = i + d; const other = active[j];
    if (i < 0 || !other) return;
    // write a clean sequence so positions never collide
    const seq = active.map((x) => x.id); seq[i] = other.id; seq[j] = c.id;
    void run(() => Promise.all(seq.map((id, k) => (campaigns.find((x) => x.id === id)?.position === k ? null : save({ id, position: k })))), "Order saved");
  };
  const setStatus = (c: Campaign, status: Campaign["status"]): void => {
    if (status === "published") {
      const errs = validateCampaign(c, true);
      if (Object.keys(errs).length) { setError(`“${c.name}” cannot be published yet: ${Object.values(errs).join(" ")}`); return; }
    }
    const label = { published: "Published", paused: "Paused", archived: "Archived", draft: "Moved back to draft" }[status];
    void run(() => save({ id: c.id, status }), `${label} · ${c.name}`);
  };

  const live = campaigns.filter((c) => campaignState(c) === "Published").length;
  return (
    <Section title="Advertising manager" eyebrow="Listing desk promotions" className="border border-xo-line"
      right={<>{!remote && <Provenance kind="demo">This browser</Provenance>}<span className="text-xo-muted">{live} live · {active.length} total</span></>}
      foot={remote ? "Only operators can change campaigns: the server refuses anyone else, and founders only ever receive published campaigns inside their schedule." : "Not connected to the server: campaigns are kept in this browser and shown on this browser's listing desk only."}>
      <div className="space-y-4 p-4">
        {error && <p role="alert" className="border border-xo-risk/50 px-3 py-2 text-[12px] text-xo-risk">{error}</p>}

        <SettingsBar settings={settings} disabled={busy} onSave={(s) => void run(() => (remote ? saveSettings(remote, s) : Promise.resolve(local.saveSettings(s))), "Slideshow settings saved")} />

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={BTN} disabled={busy} onClick={() => setEditing(emptyDraft(active.length))}>New campaign</button>
          <label className="flex items-center gap-2 text-[12px] text-xo-muted">
            <span>Start from a product</span>
            <select className={`${XO_INPUT} w-auto py-1.5`} value="" onChange={(e) => e.target.value && setEditing(fromProduct(e.target.value, active.length))}>
              <option value="">Choose…</option>
              {SOVEREIGN_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="ml-auto flex items-center gap-2 text-[12px] text-xo-muted"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived</label>
        </div>

        {loading ? <p className="text-[12px] text-xo-muted">Loading campaigns…</p> : shown.length === 0 ? (
          <p className="border border-dashed border-xo-line px-4 py-6 text-center text-[12.5px] text-xo-muted">No campaigns yet. The listing desk shows its own quiet panel until one is published.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead className="text-[11px] text-xo-faint"><tr className="border-b border-xo-line">
                <th className="py-2 pr-3 font-medium">Order</th><th className="py-2 pr-3 font-medium">Campaign</th><th className="py-2 pr-3 font-medium">State</th>
                <th className="py-2 pr-3 font-medium">Shown on</th><th className="py-2 pr-3 font-medium">Schedule</th><th className="py-2 pr-3 text-right font-medium">30 days</th><th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {shown.map((c) => {
                  const st = campaignState(c), s = stats[c.id], k = active.findIndex((x) => x.id === c.id);
                  return (
                    <tr key={c.id} className="border-b border-xo-line align-top">
                      <td className="py-2.5 pr-3">
                        {c.status !== "archived" && <span className="flex gap-1">
                          <button type="button" className={GHOST} disabled={busy || k <= 0} onClick={() => move(c, -1)} aria-label={`Move ${c.name} up`}>↑</button>
                          <button type="button" className={GHOST} disabled={busy || k >= active.length - 1} onClick={() => move(c, 1)} aria-label={`Move ${c.name} down`}>↓</button>
                        </span>}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-start gap-2.5">
                          {c.image_path && images[c.image_path] ? <img src={images[c.image_path]} alt="" className="h-10 w-14 shrink-0 rounded-sm object-cover" style={{ objectPosition: `${c.focal_x}% ${c.focal_y}%` }} /> : <span aria-hidden className="grid h-10 w-14 shrink-0 place-items-center rounded-sm border border-dashed border-xo-line text-[10px] text-xo-faint">no image</span>}
                          <div className="min-w-0"><div className="font-semibold">{c.name}</div><div className="truncate text-xo-muted">{c.headline}</div>{c.priority !== 0 && <div className="text-[11px] text-xo-faint">priority {c.priority}</div>}</div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3"><span className={`rounded-sm border px-1.5 py-px text-[11px] font-semibold ${STATE_STYLE[st]}`}>{st}</span></td>
                      <td className="py-2.5 pr-3 text-xo-muted">{c.stages.map((x) => AD_STAGE_LABEL[x]).join(", ")}{c.mobile ? " · phone" : ""}</td>
                      <td className="py-2.5 pr-3 text-xo-muted">{c.starts_at || c.ends_at ? `${when(c.starts_at)} → ${when(c.ends_at)}` : "Always"}</td>
                      <td className="py-2.5 pr-3 text-right font-mono">{s ? <>{s.impressions} shown · {s.clicks} clicks{s.impressions ? <span className="text-xo-muted"> · {((s.clicks / s.impressions) * 100).toFixed(1)}%</span> : null}</> : <span className="text-xo-faint">—</span>}</td>
                      <td className="py-2.5">
                        <span className="flex flex-wrap justify-end gap-1">
                          <button type="button" className={GHOST} disabled={busy} onClick={() => setEditing(c)}>Edit</button>
                          {(st === "Draft" || st === "Paused") && <button type="button" className={GHOST} disabled={busy} onClick={() => setStatus(c, "published")}>{st === "Paused" ? "Resume" : "Publish"}</button>}
                          {(st === "Published" || st === "Scheduled" || st === "Expired") && <button type="button" className={GHOST} disabled={busy} onClick={() => setStatus(c, "paused")}>Pause</button>}
                          {st !== "Archived" ? <button type="button" className={GHOST} disabled={busy} onClick={() => setStatus(c, "archived")}>Archive</button>
                            : <button type="button" className={GHOST} disabled={busy} onClick={() => setStatus(c, "draft")}>Restore as draft</button>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <Editor key={editing.id ?? "new"} initial={editing} images={images} remote={remote} settings={settings} busy={busy}
            onCancel={() => setEditing(null)}
            onUploaded={(path, url) => setImages((m) => ({ ...m, [path]: url }))}
            onSave={async (d, publish) => {
              const ok = await run(() => save({ ...d, status: publish ? "published" : d.id ? d.status : "draft" }), publish ? "Campaign published" : "Campaign saved");
              if (ok) setEditing(null);
            }} />
        )}
      </div>
    </Section>
  );
};

const SettingsBar: React.FC<{ settings: AdSettings; disabled: boolean; onSave: (s: AdSettings) => void }> = ({ settings, disabled, onSave }) => {
  const [s, setS] = useState(settings);
  useEffect(() => setS(settings), [settings]);
  const changed = s.rotation_seconds !== settings.rotation_seconds || s.mobile_enabled !== settings.mobile_enabled;
  return (
    <div className="flex flex-wrap items-end gap-4 border border-xo-line px-3 py-2.5">
      <label className="text-[12px]"><span className={XO_LABEL}>Seconds per slide</span>
        <input type="number" min={4} max={30} className={`${XO_INPUT} w-24`} value={s.rotation_seconds} onChange={(e) => setS({ ...s, rotation_seconds: Math.min(30, Math.max(4, Number(e.target.value) || 7)) })} />
      </label>
      <label className="flex items-center gap-2 pb-2 text-[12px] text-xo-text"><input type="checkbox" checked={s.mobile_enabled} onChange={(e) => setS({ ...s, mobile_enabled: e.target.checked })} /> Show a compact card on phones (after the form, never above it)</label>
      <button type="button" className={GHOST} disabled={disabled || !changed} onClick={() => onSave(s)}>Save slideshow settings</button>
    </div>
  );
};

const Editor: React.FC<{
  initial: CampaignDraft; images: Record<string, string>; remote?: Remote; settings: AdSettings; busy: boolean;
  onCancel: () => void; onUploaded: (path: string, url: string) => void; onSave: (d: CampaignDraft, publish: boolean) => void | Promise<void>;
}> = ({ initial, images, remote, settings, busy, onCancel, onUploaded, onSave }) => {
  const [d, setD] = useState<CampaignDraft>(initial);
  const [tried, setTried] = useState<"save" | "publish" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stage, setStage] = useState<AdStage>(initial.stages[0] ?? "identity");
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]): void => setD((x) => ({ ...x, [k]: v }));
  const text = (k: "name" | "eyebrow" | "headline" | "body" | "cta_label" | "cta_url" | "attribution" | "image_alt", v: string): void => set(k, (k === "name" || k === "headline" ? v : v || null) as never);
  const errs = validateCampaign(d, tried === "publish");
  const show = tried ? errs : {};
  const img = d.image_path ? images[d.image_path] ?? null : null;
  const previewCampaign = { ...d, id: d.id ?? "preview", headline: d.headline || "Your headline", status: "published" as const, starts_at: null, ends_at: null };

  const pick = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    const bad = checkImage(file); if (bad) { setUploadError(bad); return; }
    setUploading(true); setUploadError(null);
    try {
      const path = remote ? await uploadImage(remote, file) : await local.upload(file);
      const url = remote ? (await signImages(remote, [path]))[path] ?? URL.createObjectURL(file) : local.image(path) ?? URL.createObjectURL(file);
      onUploaded(path, url); set("image_path", path);
    } catch (e) { setUploadError((e as Error).message); }
    setUploading(false);
  };
  const submit = (publish: boolean): void => {
    setTried(publish ? "publish" : "save");
    if (Object.keys(validateCampaign(d, publish)).length) return;
    void onSave(d, publish);
  };
  const field = (k: "name" | "eyebrow" | "headline" | "cta_label" | "cta_url" | "attribution" | "image_alt", label: string, hint?: string): React.ReactNode => (
    <label className="block text-[12px]"><span className={XO_LABEL}>{label}</span>
      <input className={XO_INPUT} value={(d[k] as string | null) ?? ""} maxLength={LIMITS[k]} onChange={(e) => text(k, e.target.value)} aria-invalid={!!show[k] || undefined} />
      {show[k] ? <span className="mt-1 block text-[11px] text-xo-risk">{show[k]}</span> : hint && <span className="mt-1 block text-[11px] text-xo-faint">{hint}</span>}
    </label>
  );

  return (
    <section aria-label={d.id ? "Edit campaign" : "New campaign"} className="grid gap-5 border border-xo-action/40 p-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-4">
        <h3 className="text-[13px] font-semibold">{d.id ? `Edit · ${initial.name}` : "New campaign"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("name", "Internal name", "Only operators see it.")}
          {field("eyebrow", "Eyebrow", "Small label above the headline, e.g. “Sovereign Dispatch”.")}
        </div>
        {field("headline", "Headline")}
        <label className="block text-[12px]"><span className={XO_LABEL}>Supporting text <span className="text-xo-faint">· optional, {(d.body ?? "").length}/{LIMITS.body}</span></span>
          <textarea className={`${XO_INPUT} min-h-[72px]`} maxLength={LIMITS.body} value={d.body ?? ""} onChange={(e) => text("body", e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("cta_label", "Button text", "e.g. “Explore Dispatch”. Shown on the slide.")}
          {field("cta_url", "Slide link · https", "Where the whole slide leads when clicked. Required to publish.")}
        </div>
        {field("attribution", "Attribution · optional", "e.g. “Sovereign portfolio”. Shown after “Promotion”.")}

        <fieldset className="space-y-2">
          <legend className={XO_LABEL}>Image · WebP, JPEG, PNG or AVIF, 5 MB at most</legend>
          <div className="flex flex-wrap items-start gap-4">
            {img ? (
              <button type="button" className="relative block w-56 overflow-hidden rounded-sm border border-xo-line" aria-label="Set the focal point: click the part of the picture that must stay in view"
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setD((x) => ({ ...x, focal_x: Math.round(((e.clientX - r.left) / r.width) * 100), focal_y: Math.round(((e.clientY - r.top) / r.height) * 100) })); }}>
                <img src={img} alt="" className="block h-auto w-full" />
                <span aria-hidden className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${d.focal_x}%`, top: `${d.focal_y}%` }} />
              </button>
            ) : <span className="grid h-28 w-56 place-items-center border border-dashed border-xo-line text-[11px] text-xo-faint">No image</span>}
            <div className="space-y-2 text-[12px]">
              <input type="file" accept={IMAGE_TYPES.join(",")} disabled={uploading} onChange={(e) => void pick(e.target.files?.[0])} className="block text-[12px]" aria-label="Upload an image" />
              {uploading && <p className="text-xo-muted">Uploading…</p>}
              {uploadError && <p role="alert" className="text-xo-risk">{uploadError}</p>}
              {show.image_path && <p className="text-xo-risk">{show.image_path}</p>}
              {img && <p className="text-xo-faint">Click the picture to set its focal point ({d.focal_x}%, {d.focal_y}%).</p>}
              {img && <button type="button" className={GHOST} onClick={() => set("image_path", null)}>Remove image</button>}
            </div>
          </div>
          {d.image_path && field("image_alt", "Image description", "For people who use a screen reader.")}
        </fieldset>

        <fieldset><legend className={XO_LABEL}>Show on these stages</legend>
          <div className="flex flex-wrap gap-3 text-[12px]">
            {AD_STAGES.map((s) => <label key={s} className="flex items-center gap-1.5"><input type="checkbox" checked={d.stages.includes(s)} onChange={(e) => set("stages", e.target.checked ? AD_STAGES.filter((x) => x === s || d.stages.includes(x)) : d.stages.filter((x) => x !== s))} />{AD_STAGE_LABEL[s]}</label>)}
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={d.mobile} onChange={(e) => set("mobile", e.target.checked)} />Also on phones</label>
          </div>
          {show.stages && <span className="mt-1 block text-[11px] text-xo-risk">{show.stages}</span>}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-[12px]"><span className={XO_LABEL}>Starts · optional</span><input type="datetime-local" className={XO_INPUT} value={toLocalInput(d.starts_at)} onChange={(e) => set("starts_at", fromLocalInput(e.target.value))} /></label>
          <label className="block text-[12px]"><span className={XO_LABEL}>Ends · optional</span><input type="datetime-local" className={XO_INPUT} value={toLocalInput(d.ends_at)} onChange={(e) => set("ends_at", fromLocalInput(e.target.value))} /></label>
          <label className="block text-[12px]"><span className={XO_LABEL}>Priority (−100 to 100)</span><input type="number" min={-100} max={100} className={XO_INPUT} value={d.priority} onChange={(e) => set("priority", Math.max(-100, Math.min(100, Math.round(Number(e.target.value) || 0))))} /></label>
        </div>
        {show.schedule && <p className="text-[11px] text-xo-risk">{show.schedule}</p>}
        <p className="text-[11px] text-xo-faint">Higher priority shows first; equal priority follows the order in the list. Plain text only: nothing typed here is rendered as markup. Make no claims about returns, demand or volumes.</p>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={BTN} disabled={busy || uploading} onClick={() => submit(true)}>{d.status === "published" ? "Save and keep published" : "Save and publish"}</button>
          <button type="button" className={GHOST} disabled={busy || uploading} onClick={() => submit(false)}>{d.id ? "Save changes" : "Save as draft"}</button>
          <button type="button" className={GHOST} disabled={busy} onClick={onCancel}>Cancel</button>
        </div>
      </div>

      {/* the real sidebar and the phone card, with this draft in them */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] text-xo-muted">
          <span>Preview as</span>
          {AD_STAGES.map((s) => <button key={s} type="button" onClick={() => setStage(s)} aria-pressed={stage === s} className={`rounded-sm border px-1.5 py-0.5 ${stage === s ? "border-xo-action text-xo-text" : "border-xo-line"}`}>{AD_STAGE_LABEL[s]}</button>)}
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <div aria-label="Desktop sidebar preview" className="flex h-[860px] w-[300px] flex-col overflow-hidden rounded-[14px] border border-[#C9A86A]/50">
            <DeskRail stage={AD_STAGES.indexOf(stage) as 0 | 1 | 2} stageDone={[stage !== "identity", stage === "review", false]} canReview={stage === "review"} pagesDone={stage === "review" ? 3 : 1} onGo={() => undefined} onClose={() => undefined}>
              {d.stages.includes(stage)
                ? <AdPanel preview slides={[{ campaign: previewCampaign, image: img }]} settings={settings} className="mt-6 flex flex-1" />
                : <p className="m-5 mt-auto rounded-sm border border-white/10 p-3 text-[11.5px] text-ex-ivory/60">Not shown on this stage.</p>}
            </DeskRail>
          </div>
          <div aria-label="Phone preview" className="w-[300px] rounded-[18px] border border-xo-line bg-[#FBF8F2] p-3">
            <p className="mb-2 text-[10.5px] text-[#8A8378]">Phone · after the form</p>
            {d.mobile && settings.mobile_enabled ? <AdPanel preview variant="compact" slides={[{ campaign: previewCampaign, image: img }]} settings={settings} />
              : <p className="text-[11.5px] text-[#8A8378]">{settings.mobile_enabled ? "This campaign is not shown on phones." : "Phone placement is switched off in the slideshow settings."}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};
