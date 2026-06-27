// Platform snapshot — assembles the live state of every Publishing & Knowledge
// Platform capability into one plain object the internal CMS (Publishing Console
// in dispatch-web) renders. This is the bridge between the engine (source of
// truth, file/Postgres-backed) and its face. Read-only: it never mutates content
// or rewrites public files — it reports what already exists.
const D = require("./data.cjs");
const store = require("./store.cjs");
const graph = require("./graph.cjs");
const discover = require("./discover.cjs");
const versioning = require("./versioning.cjs");
const seo = require("./seo.cjs");
const providers = require("./providers.cjs");
const stages = require("./stages.cjs");

const TODAY = "2026-06-27";
const countIn = (file, start) => { try { const s = D.read(file); return D.slugsIn(s.slice(s.indexOf(start))).length; } catch { return 0; } };
const xmlCount = (file, tag) => { try { const s = D.fs.readFileSync(D.P(file), "utf8"); return (s.match(new RegExp(`<${tag}[ >]`, "g")) || []).length; } catch { return 0; } };
const fileExists = (f) => D.fs.existsSync(D.P(f));

// Languages: scan the web translation registry for concepts.<locale>.ts files
// and count how many concept slugs each carries — real coverage, not promises.
function languages() {
  const dir = D.path.join(D.WEB, "src/lib/translations");
  const totalConcepts = countIn("src/lib/problems.ts", "export const PROBLEMS");
  let active = ["en"];
  try {
    const i18n = D.read("src/lib/i18n.ts");
    const m = i18n.match(/ACTIVE_LOCALES\s*=\s*\[([^\]]*)\]/);
    if (m) active = [...m[1].matchAll(/"([a-z]{2})"/g)].map((x) => x[1]);
  } catch {}
  const targets = stages.LOCALES || [];
  const coverage = {};
  try {
    for (const f of D.fs.readdirSync(dir)) {
      const mm = f.match(/^concepts\.([a-z]{2})\.ts$/);
      if (!mm) continue;
      const src = D.fs.readFileSync(D.path.join(dir, f), "utf8");
      // translations are keyed by slug ("official-publication": { ... }) — count
      // the top-level slug keys, not a slug field (which these records don't have).
      const body = src.slice(src.indexOf("= {"));
      coverage[mm[1]] = [...body.matchAll(/^\s{2}"([a-z0-9-]+)":\s*\{/gm)].length;
    }
  } catch {}
  return {
    totalConcepts,
    active,
    targets: targets.map((l) => (typeof l === "string" ? { code: l } : l)),
    coverage, // locale -> concept count
    note: "A page exists in a locale only when a real translation exists; hreflang derives from this.",
  };
}

function build() {
  const topics = store.topics.all();
  const byState = {};
  store.STATES.forEach((s) => { byState[s] = topics.filter((t) => t.status === s).length; });
  const g = graph.report();
  const versionsAll = store.versions.all();
  const due = (() => { try { return versioning.due({ today: TODAY }); } catch { return []; } })();
  const ranking = seo.searchConsole.report();
  const gaps = (() => { try { return discover.gaps(); } catch { return []; } })();
  const opportunities = (() => { try { return discover.opportunities(); } catch { return []; } })();

  const totals = {
    industries: countIn("src/lib/industries.ts", "export const INDUSTRIES"),
    concepts: countIn("src/lib/problems.ts", "export const PROBLEMS"),
    articles: countIn("src/lib/library.ts", "export const ARTICLES"),
    docs: countIn("src/lib/docs.ts", "export const DOCS"),
  };
  totals.total = totals.industries + totals.concepts + totals.articles + totals.docs;

  return {
    generatedAt: TODAY,
    origin: D.ORIGIN,
    // 1 — content totals (the published surface)
    totals,
    // 2 — topic database + editorial workflow
    topics: {
      count: topics.length,
      states: store.STATES,
      byState,
      list: topics.slice(0, 60).map((t) => ({ id: t.id, title: t.title, type: t.type, status: t.status, locale: t.locale || "en", priority: t.priority || 3, keywords: t.keywords || [], source: t.source || "manual", updatedAt: t.updatedAt, reviewEveryDays: t.reviewEveryDays || 180 })),
    },
    // 3 — human review queue
    review: { pending: topics.filter((t) => t.status === "in_review").map((t) => ({ id: t.id, title: t.title, type: t.type })) },
    // 4 — AI authoring (parallel models)
    authoring: {
      parallel: true,
      providers: Object.keys(providers.PROVIDERS).map((name) => {
        const live = name === "anthropic" ? !!process.env.ANTHROPIC_API_KEY
          : name === "openai" ? !!process.env.OPENAI_API_KEY
          : name === "mock" || name === "harness";
        return { name, live, kind: name === "mock" ? "deterministic" : name === "harness" ? "agent-protocol" : "api-adapter" };
      }),
    },
    // 5 — fact verification + 16 — content quality scoring
    quality: { gate: 70, factVerification: true, scorer: "stages.qualityScore (length, structure, link density, fact flags)" },
    // 6 — internal linking engine + 18 — content relationships & graph
    graph: { nodes: g.nodeCount, edges: g.edgeCount, byType: g.byType, orphanCount: g.orphanCount, orphans: g.orphans, hubs: g.hubs },
    // 7 — schema generation
    schema: { types: Object.keys(D.TYPES), emits: { concept: ["Article", "DefinedTerm", "FAQPage", "BreadcrumbList"], article: ["Article", "FAQPage", "BreadcrumbList"], industry: ["Service", "BreadcrumbList"], doc: ["TechArticle", "BreadcrumbList"] } },
    // 8 — version history
    versions: { records: versionsAll.length, due: due.map((d) => ({ slug: d.slug || d.id, locale: d.locale || "en", nextReview: d.nextReview || null })) },
    // 9 — multi-language
    languages: languages(),
    // 10 — publishing pipeline
    pipeline: { stages: ["author", "factCheck", "qualityScore", "seoReview", "link", "schema", "humanReview", "publish"], gate: 70, humanGate: true },
    // 11 + 15 — Search Console / analytics & ranking tracking
    searchConsole: { connected: !!process.env.GSC_SERVICE_ACCOUNT, source: process.env.GSC_SERVICE_ACCOUNT ? "live" : "local-store", tracked: ranking.tracked, top: ranking.top.slice(0, 10) },
    // 12 — sitemap generation + 13 — RSS + 14 — IndexNow + video
    distribution: {
      sitemap: { exists: fileExists("public/sitemap.xml"), urls: xmlCount("public/sitemap.xml", "loc") },
      imageSitemap: { exists: fileExists("public/sitemap-images.xml"), urls: xmlCount("public/sitemap-images.xml", "image:loc") },
      videoSitemap: { exists: fileExists("public/sitemap-video.xml") },
      rss: { exists: fileExists("public/rss.xml"), items: xmlCount("public/rss.xml", "item") },
      indexNow: { key: seo.INDEXNOW_KEY, keyHosted: fileExists(`public/${seo.INDEXNOW_KEY}.txt`), endpoint: "https://api.indexnow.org/indexnow" },
    },
    // 17 — evergreen review scheduling
    evergreen: { defaultCadenceDays: 180, dueCount: store.topics.all().filter((t) => t.status === "live").length === 0 ? 0 : due.length },
    // autonomous SEO discovery loop
    discovery: { missingTopics: gaps.length, topGaps: gaps.slice(0, 8).map((k) => ({ keyword: k.keyword, coverage: k.score })), strikingDistance: opportunities.length, opportunities: opportunities.slice(0, 8) },
  };
}

module.exports = { build };
