// First-class versioning. Not "Homepage V1/V2" — every published page is a
// versioned record: Knowledge / Publication / Policy / Standard / API /
// Documentation / Language version, each with Current, Archive, full history,
// Last reviewed and Next review. Especially for standards and documentation,
// where "which version was in force when" is the whole point.
//
// Backed by the append-only version log (store.versions); this module adds the
// version-number, review-schedule and current/archive views on top.
const store = require("./store.cjs");

const DAY = 864e5;
function addDays(iso, days) { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }

// Record a new published version of a page (called at publish time).
function snapshot({ slug, type, locale = "en", topic = null, payload = null, provider = null, score = null, reviewEveryDays = 180, at = "2026-06-27" }) {
  const prior = store.versions.forSlug(slug).filter((v) => v.stage === "published" && (v.locale || "en") === locale);
  const version = prior.length + 1;
  const rec = { slug, type, locale, topic, stage: "published", version, provider, score, payload, lastReviewed: at, nextReview: addDays(at, reviewEveryDays), at };
  store.versions.append(rec);
  return { slug, locale, version, lastReviewed: rec.lastReviewed, nextReview: rec.nextReview };
}

const published = (slug, locale = "en") => store.versions.forSlug(slug).filter((v) => v.stage === "published" && (v.locale || "en") === locale).sort((a, b) => (a.version || 0) - (b.version || 0));

function current(slug, locale = "en") { const p = published(slug, locale); return p[p.length - 1] || null; }
function archive(slug, locale = "en") { const p = published(slug, locale); return p.slice(0, -1); }
function history(slug, locale = "en") {
  const p = published(slug, locale);
  return { slug, locale, versions: p.length, current: p.length ? p[p.length - 1].version : 0, timeline: p.map((v) => ({ version: v.version, at: v.at, provider: v.provider, score: v.score, lastReviewed: v.lastReviewed, nextReview: v.nextReview })) };
}

// Pages whose Next review date has passed → feed back into the editorial queue.
function due({ today = "2026-06-27" } = {}) {
  const latest = {};
  for (const v of store.versions.all()) { if (v.stage !== "published" || !v.nextReview) continue; const k = `${v.slug}@${v.locale || "en"}`; if (!latest[k] || (v.version || 0) > (latest[k].version || 0)) latest[k] = v; }
  return Object.values(latest).filter((v) => v.nextReview <= today).map((v) => ({ slug: v.slug, locale: v.locale, version: v.version, lastReviewed: v.lastReviewed, nextReview: v.nextReview }));
}

module.exports = { snapshot, current, archive, history, due, addDays };
