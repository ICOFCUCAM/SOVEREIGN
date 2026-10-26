import { getUserId, EntitlementError } from "../_shared/entitlements.ts";
import { allowedImageHost, fromOpenverse, fromPexels, fromPixabay, fromUnsplash, searchUrl, validId, type CoverImage, type Source } from "../_shared/cover-images.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const MAX_BYTES = 15 * 1024 * 1024;

// Free images for Cover Studio. action "search" queries Openverse (no key) and
// any of Pexels / Unsplash / Pixabay whose key is set, returning only images
// licensed for commercial use and adaptation (see _shared/cover-images.ts).
// action "fetch" takes a source + id, looks the image up at the provider
// (never a client-supplied URL), downloads it and returns it inline, so the
// browser can draw it on the cover canvas and print it.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    getUserId(req); // signed-in users only
    const b = await req.json().catch(() => ({}));
    const keys = { pexels: Deno.env.get("PEXELS_API_KEY")?.trim(), unsplash: Deno.env.get("UNSPLASH_ACCESS_KEY")?.trim(), pixabay: Deno.env.get("PIXABAY_API_KEY")?.trim() };
    const sources: Source[] = ["openverse", ...(["pexels", "unsplash", "pixabay"] as const).filter((s) => keys[s])];

    if (b.action === "search") {
      const q = String(b.q ?? "").trim().slice(0, 100);
      const page = Math.max(1, Math.min(20, Number(b.page) || 1));
      if (!q) return json({ sources, results: [] });
      const want = (Array.isArray(b.sources) ? b.sources : sources).filter((s: Source) => sources.includes(s)) as Source[];
      const run = async (s: Source): Promise<CoverImage[]> => {
        const ac = AbortSignal.timeout(12000);
        if (s === "openverse") {
          const r = await fetch(searchUrl.openverse(q, page), { signal: ac, headers: { "User-Agent": "PolishedPages-CoverStudio/1.0" } });
          if (!r.ok) throw new Error(`Openverse ${r.status}`);
          return ((await r.json()).results ?? []).map(fromOpenverse).filter(Boolean) as CoverImage[];
        }
        if (s === "pexels") {
          const r = await fetch(searchUrl.pexels(q, page), { signal: ac, headers: { Authorization: keys.pexels! } });
          if (!r.ok) throw new Error(`Pexels ${r.status}`);
          return ((await r.json()).photos ?? []).map(fromPexels);
        }
        if (s === "unsplash") {
          const r = await fetch(searchUrl.unsplash(q, page), { signal: ac, headers: { Authorization: `Client-ID ${keys.unsplash}`, "Accept-Version": "v1" } });
          if (!r.ok) throw new Error(`Unsplash ${r.status}`);
          return ((await r.json()).results ?? []).map(fromUnsplash);
        }
        const r = await fetch(searchUrl.pixabay(q, page, keys.pixabay!), { signal: ac });
        if (!r.ok) throw new Error(`Pixabay ${r.status}`);
        return ((await r.json()).hits ?? []).map(fromPixabay);
      };
      const settled = await Promise.allSettled(want.map(run));
      const results: CoverImage[] = [];
      const errors: string[] = [];
      // Interleave the sources so one doesn't fill the page.
      const lists = settled.map((x, i) => { if (x.status === "rejected") { errors.push(`${want[i]}: ${x.reason?.message ?? x.reason}`); return []; } return x.value; });
      for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (l[i]) results.push(l[i]);
      return json({ sources, results, errors });
    }

    if (b.action === "fetch") {
      const source = String(b.source) as Source;
      const id = String(b.id ?? "");
      if (!sources.includes(source) || !validId(source, id)) return json({ error: "Unknown image." }, 400);
      let url = "";
      let fallback = "";
      if (source === "openverse") {
        const r = await fetch(`https://api.openverse.org/v1/images/${id}/`, { headers: { "User-Agent": "PolishedPages-CoverStudio/1.0" } });
        if (!r.ok) return json({ error: "That image is no longer available." }, 404);
        const d = await r.json();
        if (!fromOpenverse(d)) return json({ error: "That image's licence doesn't allow use on a cover." }, 400);
        url = String(d.url ?? "");
        fallback = `https://api.openverse.org/v1/images/${id}/thumb/`;
      } else if (source === "pexels") {
        const r = await fetch(`https://api.pexels.com/v1/photos/${id}`, { headers: { Authorization: keys.pexels! } });
        if (!r.ok) return json({ error: "That image is no longer available." }, 404);
        const d = await r.json();
        url = `${String(d.src?.original ?? "").split("?")[0]}?auto=compress&cs=tinysrgb&h=3000`;
      } else if (source === "unsplash") {
        const h = { Authorization: `Client-ID ${keys.unsplash}`, "Accept-Version": "v1" };
        const r = await fetch(`https://api.unsplash.com/photos/${id}`, { headers: h });
        if (!r.ok) return json({ error: "That image is no longer available." }, 404);
        const d = await r.json();
        // Unsplash's API terms: register the download when a photo is used.
        if (d.links?.download_location) await fetch(String(d.links.download_location), { headers: h }).catch(() => {});
        url = `${String(d.urls?.raw ?? d.urls?.full ?? "")}&h=3000&q=85&fm=jpg`;
      } else {
        const r = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(keys.pixabay!)}&id=${id}`);
        if (!r.ok) return json({ error: "That image is no longer available." }, 404);
        url = String((await r.json()).hits?.[0]?.largeImageURL ?? "");
      }
      const tryGet = async (start: string) => {
        let u = start;
        // Follow redirects by hand, so every hop is checked against the allowed hosts.
        let r: Response | null = null;
        for (let hop = 0; hop < 4; hop++) {
          if (!u || !allowedImageHost(u)) return null;
          r = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(25000), headers: { "User-Agent": "PolishedPages-CoverStudio/1.0" } });
          if (r.status < 300 || r.status >= 400) break;
          u = new URL(r.headers.get("location") ?? "", u).toString();
          r = null;
        }
        if (!r) return null;
        const type = r.headers.get("content-type") ?? "";
        const len = Number(r.headers.get("content-length") ?? 0);
        if (!r.ok || !/^image\/(jpeg|png|webp)/.test(type) || len > MAX_BYTES) return null;
        const buf = new Uint8Array(await r.arrayBuffer());
        if (buf.length > MAX_BYTES) return null;
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return `data:${type.split(";")[0]};base64,${btoa(bin)}`;
      };
      const image = (await tryGet(url)) ?? (await tryGet(fallback));
      if (!image) return json({ error: "Couldn't download that image (too large or unavailable). Try another." }, 502);
      return json({ image });
    }

    return json({ sources });
  } catch (e) {
    console.error("search-cover-images error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, status);
  }
});
