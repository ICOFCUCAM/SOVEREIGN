// Free cover images: search and licence rules shared by the search-cover-images
// function (and its tests). Only images free for commercial use AND for
// adaptation are offered, since a cover crops and sets type over the image:
//   • Openverse (no key): CC0, Public Domain Mark and CC BY only. CC BY needs a
//     credit line; share-alike (BY-SA) and non-commercial/no-derivatives
//     licences are excluded, since they'd bind or forbid the cover.
//   • Pexels, Unsplash, Pixabay (free API keys): their own licences allow
//     commercial use and changes without credit (Unsplash asks that its
//     photographers be credited where practical; the credit is kept).

export type Source = "openverse" | "pexels" | "unsplash" | "pixabay";

export interface CoverImage {
  source: Source;
  id: string;
  title: string;
  thumb: string;
  width: number;
  height: number;
  creator: string;
  /** Short licence name, e.g. "CC BY 4.0", "Pexels License". */
  license: string;
  licenseUrl: string;
  /** Page for the image on its site. */
  page: string;
  /** Whether the licence requires the credit to be printed. */
  creditRequired: boolean;
  credit: string;
}

const LICENSES: Record<string, string> = { cc0: "CC0", pdm: "Public Domain", by: "CC BY" };

// deno-lint-ignore no-explicit-any
type Json = any;

export function fromOpenverse(r: Json): CoverImage | null {
  const lic = String(r?.license ?? "").toLowerCase();
  if (!(lic in LICENSES)) return null; // never offer a licence we didn't ask for
  const name = `${LICENSES[lic]}${lic === "by" && r.license_version ? ` ${r.license_version}` : ""}`;
  const creator = String(r.creator ?? "").trim() || "Unknown";
  const title = String(r.title ?? "").trim() || "Untitled";
  const where = String(r.source ?? r.provider ?? "").replace(/_/g, " ");
  return {
    source: "openverse", id: String(r.id), title, thumb: String(r.thumbnail ?? ""), width: Number(r.width) || 0, height: Number(r.height) || 0,
    creator, license: name, licenseUrl: String(r.license_url ?? ""), page: String(r.foreign_landing_url ?? ""),
    creditRequired: lic === "by",
    credit: lic === "by" ? `“${title}” by ${creator}${where ? ` (${where})` : ""}, ${name}` : `“${title}” by ${creator}, ${name}`,
  };
}

export function fromPexels(p: Json): CoverImage {
  return {
    source: "pexels", id: String(p.id), title: String(p.alt ?? "").trim() || "Pexels photo", thumb: String(p.src?.medium ?? p.src?.small ?? ""),
    width: Number(p.width) || 0, height: Number(p.height) || 0, creator: String(p.photographer ?? "Unknown"),
    license: "Pexels License", licenseUrl: "https://www.pexels.com/license/", page: String(p.url ?? ""),
    creditRequired: false, credit: `Photo by ${p.photographer ?? "Unknown"} on Pexels`,
  };
}

export function fromUnsplash(u: Json): CoverImage {
  const name = String(u.user?.name ?? "Unknown");
  return {
    source: "unsplash", id: String(u.id), title: String(u.alt_description ?? u.description ?? "").trim() || "Unsplash photo", thumb: String(u.urls?.small ?? u.urls?.thumb ?? ""),
    width: Number(u.width) || 0, height: Number(u.height) || 0, creator: name,
    license: "Unsplash License", licenseUrl: "https://unsplash.com/license", page: String(u.links?.html ?? ""),
    creditRequired: false, credit: `Photo by ${name} on Unsplash`,
  };
}

export function fromPixabay(h: Json): CoverImage {
  return {
    source: "pixabay", id: String(h.id), title: String(h.tags ?? "").trim() || "Pixabay image", thumb: String(h.webformatURL ?? h.previewURL ?? ""),
    width: Number(h.imageWidth) || 0, height: Number(h.imageHeight) || 0, creator: String(h.user ?? "Unknown"),
    license: "Pixabay Content License", licenseUrl: "https://pixabay.com/service/license-summary/", page: String(h.pageURL ?? ""),
    creditRequired: false, credit: `Image by ${h.user ?? "Unknown"} from Pixabay`,
  };
}

export const searchUrl = {
  openverse: (q: string, page: number) => `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=cc0,pdm,by&page_size=20&page=${page}&mature=false`,
  pexels: (q: string, page: number) => `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=20&page=${page}`,
  unsplash: (q: string, page: number) => `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&orientation=portrait&per_page=20&page=${page}&content_filter=high`,
  pixabay: (q: string, page: number, key: string) => `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&image_type=photo&orientation=vertical&per_page=20&page=${page}&safesearch=true`,
};

/** Ids must look like the provider's: the download is then looked up from the provider, never from a client-given URL. */
export function validId(source: Source, id: string): boolean {
  if (source === "openverse") return /^[0-9a-f-]{36}$/i.test(id);
  if (source === "unsplash") return /^[A-Za-z0-9_-]{6,20}$/.test(id);
  return /^\d{1,14}$/.test(id);
}

/** Only these hosts are fetched for the image itself. */
export function allowedImageHost(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return /(^|\.)(wikimedia\.org|staticflickr\.com|flickr\.com|pexels\.com|unsplash\.com|pixabay\.com|openverse\.org|rawpixel\.com|smithsonianmag\.com|si\.edu|metmuseum\.org|nypl\.org|europeana\.eu|stocksnap\.io|nasa\.gov|clevelandart\.org|artic\.edu|rijksmuseum\.nl|loc\.gov)$/i.test(u.hostname);
  } catch { return false; }
}
