// Shared helpers + the content-type registry. The registry is the single source
// of truth for how each SEO layer's data module is shaped, validated, normalized
// and spliced — every stage (author, quality, link, schema, publish) reads it.
const fs = require("fs");
const path = require("path");

const WEB = process.env.DISPATCH_WEB || path.resolve(__dirname, "../../dispatch-web");
const ENGINE = path.resolve(__dirname, "..");
const ORIGIN = "https://dispatch.sovereigndo.com";

const P = (f) => path.join(WEB, f);
const read = (f) => fs.readFileSync(P(f), "utf8");
const exists = (f) => fs.existsSync(P(f));
const norm = (s) => String(s == null ? "" : s).trim();
const slugify = (s) => norm(s).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const slugsIn = (src) => [...src.matchAll(/["']?slug["']?\s*:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
const slugsFromFile = (f) => slugsIn(read(f));
const grab = (src, key) => [...src.matchAll(new RegExp(`["']?${key}["']?\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "g"))].map((m) => m[1].replace(/\\"/g, '"'));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const region = (src, start, end) => src.slice(src.indexOf(start), end ? src.indexOf(end) : undefined);

const DIAGRAMS = ["chain", "seal", "lifecycle", "shield", "ledger", "workflow"];

// Each content type: where its data lives, how to splice, validate and normalize.
const TYPES = {
  concept: {
    layer: 3, label: "Concept", route: "/learn",
    file: "src/lib/problems.ts", arrayStart: "export const PROBLEMS", marker: "];\n\nexport const problemBySlug",
    titleKey: "term", bodyKeys: ["definition", "lead", "why", "how", "faqs"],
    valid: (e) => !!(e.slug && e.term && e.definition && e.headline),
    normalize(raw, slug, ctx) {
      const why = (Array.isArray(raw.why) ? raw.why : []).map(norm).filter(Boolean).slice(0, 4);
      while (why.length < 3) why.push("");
      return {
        slug, term: norm(raw.term), category: norm(raw.category) || "Concepts & definitions",
        kicker: norm(raw.kicker) || "Concept", headline: norm(raw.headline), lead: norm(raw.lead),
        definition: norm(raw.definition), why: why.slice(0, 3),
        how: (Array.isArray(raw.how) ? raw.how : []).map((h) => ({ t: norm(h && h.t), d: norm(h && h.d) })).filter((h) => h.t && h.d).slice(0, 3),
        faqs: (Array.isArray(raw.faqs) ? raw.faqs : []).map((q) => ({ q: norm(q && q.q), a: norm(q && q.a) })).filter((q) => q.q && q.a).slice(0, 4),
        relatedIndustries: [...new Set((Array.isArray(raw.relatedIndustries) ? raw.relatedIndustries : []).map(norm).filter((s) => ctx.validIndustry.has(s)))].slice(0, 4),
        relatedProblems: [...new Set((Array.isArray(raw.relatedProblems) ? raw.relatedProblems : []).map(norm).filter((s) => ctx.catalogue.has(s) && s !== slug))],
        diagram: DIAGRAMS.includes(raw.diagram) ? raw.diagram : "shield",
        metaTitle: norm(raw.metaTitle) || norm(raw.term), metaDescription: norm(raw.metaDescription) || norm(raw.definition).slice(0, 158),
      };
    },
    backfill(out) { const byCat = {}; out.forEach((e) => { (byCat[e.category] = byCat[e.category] || []).push(e.slug); }); for (const e of out) { for (const s of (byCat[e.category] || [])) { if (e.relatedProblems.length >= 4) break; if (s !== e.slug && !e.relatedProblems.includes(s)) e.relatedProblems.push(s); } e.relatedProblems = e.relatedProblems.slice(0, 4); } },
    links: (e) => [...(e.relatedProblems || []).map((s) => ["concept", s]), ...(e.relatedIndustries || []).map((s) => ["industry", s])],
  },
  article: {
    layer: 4, label: "Article", route: "/library",
    file: "src/lib/library.ts", arrayStart: "export const ARTICLES", marker: "];\n\nexport const articleBySlug",
    titleKey: "title", bodyKeys: ["dek", "intro", "sections", "keyPoints", "faqs"],
    valid: (e) => !!(e.slug && e.title && e.dek && Array.isArray(e.sections) && e.sections.length >= 3),
    normalize(raw, slug, ctx) {
      const sections = raw.sections.map((s) => { const o = { h: norm(s.h), p: (Array.isArray(s.p) ? s.p : []).map(norm).filter(Boolean) }; if (Array.isArray(s.list) && s.list.length) o.list = s.list.map(norm).filter(Boolean); return o; }).filter((s) => s.h && s.p.length);
      const wc = (raw.intro || []).join(" ").split(/\s+/).length + sections.reduce((n, s) => n + s.p.join(" ").split(/\s+/).length, 0);
      return {
        slug, title: norm(raw.title), dek: norm(raw.dek), category: norm(raw.category) || "Foundations",
        kicker: norm(raw.kicker) || norm(raw.category) || "Guide", updated: ctx.today, readingMinutes: Number(raw.readingMinutes) || Math.max(4, Math.round(wc / 200)),
        intro: (Array.isArray(raw.intro) ? raw.intro : []).map(norm).filter(Boolean).slice(0, 3), sections,
        keyPoints: (Array.isArray(raw.keyPoints) ? raw.keyPoints : []).map(norm).filter(Boolean).slice(0, 6),
        faqs: (Array.isArray(raw.faqs) ? raw.faqs : []).map((q) => ({ q: norm(q && q.q), a: norm(q && q.a) })).filter((q) => q.q && q.a).slice(0, 5),
        relatedConcepts: [...new Set((Array.isArray(raw.relatedConcepts) ? raw.relatedConcepts : []).map(norm).filter((s) => ctx.validConcept.has(s)))].slice(0, 4),
        relatedIndustries: [...new Set((Array.isArray(raw.relatedIndustries) ? raw.relatedIndustries : []).map(norm).filter((s) => ctx.validIndustry.has(s)))].slice(0, 4),
        relatedArticles: [...new Set((Array.isArray(raw.relatedArticles) ? raw.relatedArticles : []).map(norm).filter((s) => ctx.catalogue.has(s) && s !== slug))].slice(0, 3),
        metaTitle: norm(raw.metaTitle) || norm(raw.title), metaDescription: norm(raw.metaDescription) || norm(raw.dek).slice(0, 158),
      };
    },
    backfill(out) { const byCat = {}; out.forEach((a) => { (byCat[a.category] = byCat[a.category] || []).push(a.slug); }); for (const a of out) { if (a.relatedArticles.length >= 2) continue; for (const s of (byCat[a.category] || [])) { if (a.relatedArticles.length >= 3) break; if (s !== a.slug && !a.relatedArticles.includes(s)) a.relatedArticles.push(s); } } },
    links: (e) => [...(e.relatedArticles || []).map((s) => ["article", s]), ...(e.relatedConcepts || []).map((s) => ["concept", s]), ...(e.relatedIndustries || []).map((s) => ["industry", s])],
  },
};

function buildCtx() {
  return {
    today: "2026-06-27",
    validIndustry: new Set(slugsFromFile("src/lib/industries.ts")),
    validConcept: new Set(slugsFromFile("src/lib/problems.ts")),
    validArticle: new Set(slugsFromFile("src/lib/library.ts")),
  };
}

module.exports = { fs, path, WEB, ENGINE, ORIGIN, P, read, exists, norm, slugify, slugsIn, slugsFromFile, grab, esc, region, DIAGRAMS, TYPES, buildCtx };
