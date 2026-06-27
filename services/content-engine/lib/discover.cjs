// The autonomous SEO engine. The loop most companies never build:
//   Search Console → keyword discovery → competitor monitoring → missing topics
//   → generate topics → (pipeline) → publish → track ranking → improve → repeat.
//
// This module owns DISCOVERY: it finds what to write next. It never auto-
// publishes — discovered topics enter the topic database as `idea`s for the
// pipeline (which keeps the human-review gate).
const fs = require("fs");
const path = require("path");
const { read, slugsFromFile, slugify, norm } = require("./data.cjs");
const store = require("./store.cjs");
const seo = require("./seo.cjs");

const KEYWORDS = path.resolve(__dirname, "../data/keywords.json");
const readKeywords = () => (fs.existsSync(KEYWORDS) ? JSON.parse(fs.readFileSync(KEYWORDS, "utf8")) : []);

const STOP = new Set("the a an of for and to in on with is are as by from that this its what how why".split(" "));
const toks = (s) => norm(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));

function allContentSlugs() {
  return {
    industry: new Set(slugsFromFile("src/lib/industries.ts")),
    concept: new Set(region(read("src/lib/problems.ts"), "export const PROBLEMS")),
    article: new Set(region(read("src/lib/library.ts"), "export const ARTICLES")),
  };
}
function region(src, start) { return [...src.slice(src.indexOf(start)).matchAll(/["']?slug["']?\s*:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]); }

// coverage: best token-overlap of a keyword against every existing slug
function coverage(keyword) {
  const want = toks(keyword);
  let best = 0, bestSlug = null;
  const sets = allContentSlugs();
  for (const [type, set] of Object.entries(sets)) {
    for (const slug of set) {
      const t = toks(slug.replace(/-/g, " "));
      const overlap = t.filter((w) => want.includes(w)).length / Math.max(1, want.length);
      if (overlap > best) { best = overlap; bestSlug = `${type}:${slug}`; }
    }
  }
  return { score: +best.toFixed(2), match: bestSlug };
}

// MISSING TOPICS — keywords whose best coverage is below threshold.
function gaps({ threshold = 0.5 } = {}) {
  return readKeywords().map((k) => ({ ...k, ...coverage(k.keyword) })).filter((k) => k.score < threshold).sort((a, b) => a.score - b.score);
}

// STRIKING DISTANCE — GSC queries ranking just off page one (improve, don't create).
function opportunities() {
  const rows = store.rankings.all();
  return rows.filter((r) => r.position > 8 && r.position <= 25 && (r.impressions || 0) >= 50).sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).map((r) => ({ slug: r.slug, query: r.query, position: r.position, impressions: r.impressions, action: "improve existing page (add depth + internal links)" }));
}

// COMPETITOR MONITORING — adapter. Live mode would crawl/parse competitor
// sitemaps or a SERP API; here it reads an optional local competitors manifest.
function competitors() {
  const f = path.resolve(__dirname, "../data/competitors.json");
  if (!fs.existsSync(f)) return { source: "none", note: "Drop data/competitors.json (topics they rank for) to enable gap-vs-competitor analysis." };
  const theirs = JSON.parse(fs.readFileSync(f, "utf8"));
  const missing = theirs.filter((t) => coverage(t.keyword || t).score < 0.5);
  return { source: "manifest", theyCover: theirs.length, weMiss: missing.length, missing };
}

// Turn the top gaps into topic-database entries (status: idea) for the pipeline.
function propose({ limit = 10 } = {}) {
  const g = gaps().slice(0, limit);
  const created = [];
  for (const k of g) {
    const id = `${k.type || "concept"}-${slugify(k.keyword)}`;
    if (store.topics.get(id)) continue;
    store.topics.upsert({ id, title: titleCase(k.keyword), type: k.type || "concept", status: "idea", priority: k.priority || 3, keywords: [k.keyword], source: "seo-discovery" });
    created.push(id);
  }
  return { discovered: g.length, created };
}
function titleCase(s) { return norm(s).replace(/\b\w/g, (c) => c.toUpperCase()); }

// The autonomous cycle — discovery half of the loop, as a single report.
function cycle({ propose: doPropose = false } = {}) {
  const g = gaps();
  const opp = opportunities();
  const comp = competitors();
  const proposal = doPropose ? propose({ limit: 10 }) : { note: "run with --propose to seed topics" };
  return {
    missingTopics: g.length, topGaps: g.slice(0, 10).map((k) => `${k.keyword} (cov ${k.score})`),
    strikingDistance: opp.length, opportunities: opp.slice(0, 10),
    competitors: comp, proposal,
    next: "review proposed topics, then: content.cjs pipeline <id> (human-review gate before publish)",
  };
}

module.exports = { gaps, opportunities, competitors, propose, cycle, coverage, readKeywords };
