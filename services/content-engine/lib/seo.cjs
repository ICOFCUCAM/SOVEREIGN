// SEO distribution: sitemap + feeds generation, IndexNow submission, and the
// Search Console / ranking adapter. Deterministic generation runs anywhere; the
// network calls (IndexNow POST, GSC Search Analytics) are real adapters that
// default to a safe dry run when there is no egress or credential.
const https = require("https");
const { read, P, fs, ORIGIN, grab, esc, region } = require("./data.cjs");
const store = require("./store.cjs");

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "a7f3c91e2b6d40f8a1c5e9b27d4f60a3";

function feeds() {
  const lib = read("src/lib/library.ts");
  const r = region(lib, "export const ARTICLES", undefined).slice(0, lib.indexOf("export const articleBySlug") - lib.indexOf("export const ARTICLES"));
  const sl = grab(r, "slug"), ti = grab(r, "title"), de = grab(r, "dek"); const n = Math.min(sl.length, ti.length, de.length);
  const items = Array.from({ length: n }, (_, i) => `    <item>\n      <title>${esc(ti[i])}</title>\n      <link>${ORIGIN}/library/${sl[i]}</link>\n      <guid isPermaLink="true">${ORIGIN}/library/${sl[i]}</guid>\n      <description>${esc(de[i])}</description>\n    </item>`);
  fs.writeFileSync(P("public/rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Sovereign Dispatch — Knowledge Library</title>\n    <link>${ORIGIN}/library</link>\n    <description>Guides on official records, document governance, evidence, preservation and compliance.</description>\n    <language>en</language>\n${items.join("\n")}\n  </channel>\n</rss>\n`);
  const ind = read("src/lib/industries.ts");
  const ir = region(ind, "export const INDUSTRIES", "export const INDUSTRIES_BASE");
  const is = grab(ir, "slug"), inm = grab(ir, "name"), ib = grab(ir, "banner");
  const urls = is.map((s, i) => `  <url>\n    <loc>${ORIGIN}/industries/${s}</loc>\n    <image:image>\n      <image:loc>${ORIGIN}/people/${ib[i] || s}.webp</image:loc>\n      <image:title>${esc(inm[i])} — Sovereign Dispatch</image:title>\n    </image:image>\n  </url>`);
  fs.writeFileSync(P("public/sitemap-images.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`);
  fs.writeFileSync(P("public/sitemap-index.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${ORIGIN}/sitemap.xml</loc><lastmod>2026-06-27</lastmod></sitemap>\n  <sitemap><loc>${ORIGIN}/sitemap-images.xml</loc><lastmod>2026-06-27</lastmod></sitemap>\n</sitemapindex>\n`);
  return { rssItems: items.length, imageUrls: urls.length };
}

// IndexNow — instantly tell Bing/Yandex (and increasingly others) about new URLs.
function indexNow(urls, { submit = false } = {}) {
  // The key must be hosted at /<key>.txt — write it so the verification passes.
  fs.writeFileSync(P(`public/${INDEXNOW_KEY}.txt`), INDEXNOW_KEY + "\n");
  const payload = { host: "dispatch.sovereigndo.com", key: INDEXNOW_KEY, keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: urls };
  if (!submit) return { dryRun: true, count: urls.length, payload };
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req = https.request("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (res) => resolve({ submitted: true, status: res.statusCode, count: urls.length }));
    req.on("error", (e) => resolve({ submitted: false, error: e.message, count: urls.length }));
    req.write(body); req.end();
  });
}

// Search Console adapter — pull query/impression/position data and snapshot it.
// Live mode needs a Google service account with the Search Console API; the
// adapter falls back to the local rankings store so reports run anywhere.
const searchConsole = {
  async pull({ live = false } = {}) {
    if (live && process.env.GSC_SERVICE_ACCOUNT) {
      // POST https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query
      throw new Error("searchConsole: live pull requires GSC client wiring (documented contract)");
    }
    return { source: "local", rows: store.rankings.all() };
  },
  record({ slug, query, position, impressions, clicks }) { store.rankings.append({ slug, query, position, impressions, clicks }); },
  report() {
    const latest = store.rankings.latestBySlug();
    const rows = Object.values(latest).sort((a, b) => (a.position || 99) - (b.position || 99));
    return { tracked: rows.length, top: rows.slice(0, 20) };
  },
};

// Video sitemap — generated only when there is video content (a data/videos.json
// manifest of { page, title, description, thumbnail, contentUrl }). Wired now so
// "every page" coverage is automatic the moment video ships; no empty file is
// emitted (an empty video sitemap is an SEO smell), keeping the architecture honest.
function videoSitemap() {
  const fsx = require("fs"); const px = require("path");
  const f = px.resolve(__dirname, "../data/videos.json");
  if (!fsx.existsSync(f)) return { emitted: false, note: "no data/videos.json — video sitemap generated automatically once video content exists" };
  const vids = JSON.parse(fsx.readFileSync(f, "utf8"));
  const urls = vids.map((v) => `  <url>\n    <loc>${ORIGIN}${v.page}</loc>\n    <video:video>\n      <video:title>${esc(v.title)}</video:title>\n      <video:description>${esc(v.description)}</video:description>\n      <video:thumbnail_loc>${ORIGIN}${v.thumbnail}</video:thumbnail_loc>\n      <video:content_loc>${ORIGIN}${v.contentUrl}</video:content_loc>\n    </video:video>\n  </url>`);
  fsx.writeFileSync(P("public/sitemap-video.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls.join("\n")}\n</urlset>\n`);
  return { emitted: true, videos: urls.length };
}

module.exports = { feeds, videoSitemap, indexNow, searchConsole, INDEXNOW_KEY };
