// Pipeline stages. Each is a pure-ish function over a candidate or batch. These
// are the deterministic gates the platform enforces between AI authoring and
// publication: fact verification, quality scoring, internal linking, schema,
// translation planning, and the splice into the live data modules.
const { TYPES, buildCtx, norm, slugify, read, P, fs, ORIGIN } = require("./data.cjs");

// --- fact / claims verification ----------------------------------------------
// Encodes Sovereign Dispatch's honesty rules so no AI draft can over-claim.
const RISK = [
  { re: /\bguarantee(d|s)?\b/i, msg: "absolute guarantee — Dispatch does not promise guaranteed outcomes" },
  { re: /\btamper[\s-]?proof\b/i, msg: "'tamper-proof' — prefer 'tamper-evident' (changes are detectable, not preventable)" },
  { re: /\b(is|are)\s+(iso|nist|soc\s?2)[\s-]?\w*\s+certified\b/i, msg: "claims certification — frameworks are alignment, not certification" },
  { re: /\b100%\s+(secure|safe|accurate)\b/i, msg: "absolute security/accuracy claim" },
  { re: /\bnever\s+fails?\b/i, msg: "'never fails' — unfounded absolute" },
  { re: /\beliminat(e|es)\s+(all|every)\b/i, msg: "claims elimination of all risk" },
];
function factCheck(candidate) {
  const text = JSON.stringify(candidate).toLowerCase();
  const flags = RISK.filter((r) => r.re.test(text)).map((r) => r.msg);
  return { passed: flags.length === 0, flags };
}

// --- content quality scoring (0-100) -----------------------------------------
function qualityScore(candidate, typeKey) {
  const b = {};
  if (typeKey === "concept") {
    b.definitionStartsWithTerm = candidate.definition && candidate.term && candidate.definition.toLowerCase().startsWith(candidate.term.toLowerCase().split(" ")[0]) ? 15 : 0;
    b.hasThreeWhy = (candidate.why || []).filter(Boolean).length >= 3 ? 15 : 0;
    b.hasThreeHow = (candidate.how || []).length >= 3 ? 15 : 0;
    b.hasFaqs = (candidate.faqs || []).length >= 3 ? 15 : 0;
    b.hasInternalLinks = (candidate.relatedProblems || []).length + (candidate.relatedIndustries || []).length >= 4 ? 15 : 0;
    b.metaLengths = candidate.metaTitle && candidate.metaTitle.length <= 62 && candidate.metaDescription && candidate.metaDescription.length <= 160 ? 10 : 0;
    const wc = ((candidate.definition || "") + (candidate.lead || "") + (candidate.why || []).join(" ") + (candidate.how || []).map((h) => h.d).join(" ")).split(/\s+/).length;
    b.depth = wc >= 180 ? 15 : Math.round((wc / 180) * 15);
  } else {
    const wc = (candidate.intro || []).join(" ").split(/\s+/).length + (candidate.sections || []).reduce((n, s) => n + (s.p || []).join(" ").split(/\s+/).length, 0);
    b.depth = wc >= 900 ? 30 : Math.round((wc / 900) * 30);
    b.sections = (candidate.sections || []).length >= 5 ? 20 : Math.round(((candidate.sections || []).length / 5) * 20);
    b.hasKeyPoints = (candidate.keyPoints || []).length >= 4 ? 12 : 0;
    b.hasFaqs = (candidate.faqs || []).length >= 3 ? 13 : 0;
    b.hasInternalLinks = (candidate.relatedConcepts || []).length + (candidate.relatedArticles || []).length >= 3 ? 15 : 0;
    b.metaLengths = candidate.metaTitle && candidate.metaTitle.length <= 62 ? 10 : 0;
  }
  const fc = factCheck(candidate);
  b.factCheck = fc.passed ? 0 : -25;
  const score = Math.max(0, Math.min(100, Object.values(b).reduce((n, v) => n + v, 0)));
  return { score, breakdown: b, factFlags: fc.flags };
}

// --- internal linking suggestions (graph by keyword overlap) ------------------
const STOP = new Set("the a an of for and to in on with is are as by from that this its".split(" "));
const toks = (s) => norm(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
function linkSuggest(candidate, typeKey, opts = {}) {
  const ctx = buildCtx();
  const want = new Set(toks((candidate.term || candidate.title || "") + " " + (candidate.definition || candidate.dek || "")));
  const score = (slug) => { const t = toks(slug.replace(/-/g, " ")); return t.filter((w) => want.has(w)).length; };
  const rank = (set, self) => [...set].filter((s) => s !== self).map((s) => [s, score(s)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([s]) => s);
  if (typeKey === "concept") return { concepts: rank(ctx.validConcept, candidate.slug).slice(0, 4), industries: rank(ctx.validIndustry).slice(0, 4) };
  return { articles: rank(ctx.validArticle, candidate.slug).slice(0, 3), concepts: rank(ctx.validConcept).slice(0, 4), industries: rank(ctx.validIndustry).slice(0, 4) };
}

// --- schema generation (the JSON-LD the page will emit) -----------------------
function schemaFor(candidate, typeKey) {
  const url = `${ORIGIN}${typeKey === "concept" ? "/learn" : "/library"}/${candidate.slug}`;
  const faq = { "@type": "FAQPage", mainEntity: (candidate.faqs || []).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const crumb = { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: typeKey === "concept" ? "Learn" : "Library", item: `${ORIGIN}${typeKey === "concept" ? "/learn" : "/library"}` }, { "@type": "ListItem", position: 2, name: candidate.term || candidate.title, item: url }] };
  const main = typeKey === "concept"
    ? { "@type": "DefinedTerm", name: candidate.term, description: candidate.definition, inDefinedTermSet: `${ORIGIN}/learn` }
    : { "@type": "Article", headline: candidate.title, description: candidate.metaDescription, articleSection: candidate.category, url, author: { "@type": "Organization", name: "Sovereign Dispatch" } };
  return { "@context": "https://schema.org", "@graph": [main, faq, crumb] };
}

// --- multi-language architecture (no translation yet) -------------------------
const LOCALES = [
  { code: "en", name: "English", dir: "ltr", default: true },
  { code: "fr", name: "Français", dir: "ltr" }, { code: "es", name: "Español", dir: "ltr" },
  { code: "de", name: "Deutsch", dir: "ltr" }, { code: "ar", name: "العربية", dir: "rtl" },
  { code: "pt", name: "Português", dir: "ltr" }, { code: "no", name: "Norsk", dir: "ltr" },
  { code: "nl", name: "Nederlands", dir: "ltr" }, { code: "it", name: "Italiano", dir: "ltr" },
  { code: "ja", name: "日本語", dir: "ltr" }, { code: "zh", name: "中文", dir: "ltr" },
];
function translatePlan(candidate, typeKey) {
  const base = `${typeKey === "concept" ? "/learn" : "/library"}/${candidate.slug}`;
  return {
    strategy: "locale-prefixed path; slug stays stable across locales for clean hreflang",
    alternates: LOCALES.map((l) => ({ locale: l.code, dir: l.dir, path: l.default ? base : `/${l.code}${base}`, hreflang: l.code })),
    xDefault: base,
    note: "Architecture only — real localized content is produced by re-running the authoring stage per locale with a translation system prompt; hreflang is emitted from this map.",
  };
}

// --- publish: normalize, dedupe, backfill links, splice into the data module ---
function mergeEntries(typeKey, rawEntries) {
  const t = TYPES[typeKey]; if (!t) throw new Error(`unknown type ${typeKey}`);
  const ctx = buildCtx(); ctx.catalogue = new Set([...read(t.file).matchAll(/["']?slug["']?\s*:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
  const existing = new Set(ctx.catalogue); const seen = new Set(existing); const kept = [];
  for (const e of rawEntries) { const slug = slugify(e.slug); if (!slug || seen.has(slug) || !t.valid({ ...e, slug })) continue; seen.add(slug); ctx.catalogue.add(slug); kept.push({ raw: e, slug }); }
  if (!kept.length) return { inserted: 0, total: existing.size };
  const out = kept.map(({ raw, slug }) => t.normalize(raw, slug, ctx));
  t.backfill(out);
  const src = read(t.file);
  if (!src.includes(t.marker)) throw new Error("marker not found in " + t.file);
  const block = out.map((e) => "  " + JSON.stringify(e, null, 2).split("\n").join("\n  ")).join(",\n") + ",\n";
  fs.writeFileSync(P(t.file), src.replace(t.marker, block + t.marker));
  let sm = read("public/sitemap.xml");
  const have = new Set([...sm.matchAll(new RegExp(`${t.route}/([a-z0-9-]+)<`, "g"))].map((m) => m[1]));
  const urls = out.filter((e) => !have.has(e.slug)).map((e) => `  <url><loc>${ORIGIN}${t.route}/${e.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join("\n");
  if (urls) fs.writeFileSync(P("public/sitemap.xml"), sm.replace("</urlset>", urls + "\n</urlset>"));
  return { inserted: out.length, total: existing.size + out.length, slugs: out.map((e) => e.slug) };
}

module.exports = { factCheck, qualityScore, linkSuggest, schemaFor, translatePlan, mergeEntries, LOCALES };
