// Content relationship graph. Parses every layer's data module into nodes and
// the internal-link edges between them, then reports structure: hubs (most
// linked-to), orphans (no inbound links — an SEO smell), and per-node neighbours.
const { read, slugify } = require("./data.cjs");

// Split a data module into per-entry slices and pull the slug + related arrays.
function parseEntries(file, fields) {
  const src = read(file);
  const idxs = [...src.matchAll(/["']?slug["']?\s*:\s*"([a-z0-9-]+)"/g)];
  const out = [];
  for (let i = 0; i < idxs.length; i++) {
    const start = idxs[i].index;
    const end = i + 1 < idxs.length ? idxs[i + 1].index : src.length;
    const slice = src.slice(start, end);
    const slug = idxs[i][1];
    const edges = {};
    for (const f of fields) {
      const m = slice.match(new RegExp(`["']?${f}["']?\\s*:\\s*\\[([^\\]]*)\\]`));
      edges[f] = m ? [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]) : [];
    }
    out.push({ slug, edges });
  }
  return out;
}

function build() {
  const nodes = new Map(); // key `${type}:${slug}` -> {type, slug, in:0, out:0}
  const edges = []; // {from, to, kind}
  const node = (type, slug) => { const k = `${type}:${slug}`; if (!nodes.has(k)) nodes.set(k, { type, slug, in: 0, out: 0 }); return k; };

  // industries — nodes only (their page cross-links to all others implicitly)
  for (const e of parseEntries("src/lib/industries.ts", [])) node("industry", e.slug);
  // concepts
  for (const e of parseEntries("src/lib/problems.ts", ["relatedProblems", "relatedIndustries"])) {
    const from = node("concept", e.slug);
    for (const s of e.edges.relatedProblems) { edges.push([from, node("concept", s), "concept"]); }
    for (const s of e.edges.relatedIndustries) { edges.push([from, node("industry", s), "industry"]); }
  }
  // articles
  for (const e of parseEntries("src/lib/library.ts", ["relatedArticles", "relatedConcepts", "relatedIndustries"])) {
    const from = node("article", e.slug);
    for (const s of e.edges.relatedArticles) edges.push([from, node("article", s), "article"]);
    for (const s of e.edges.relatedConcepts) edges.push([from, node("concept", s), "concept"]);
    for (const s of e.edges.relatedIndustries) edges.push([from, node("industry", s), "industry"]);
  }
  // docs
  for (const e of parseEntries("src/lib/docs.ts", [])) node("doc", e.slug);

  for (const [from, to] of edges) { if (nodes.has(from)) nodes.get(from).out++; if (nodes.has(to)) nodes.get(to).in++; }
  return { nodes, edges };
}

function report() {
  const { nodes, edges } = build();
  const arr = [...nodes.values()];
  const byType = {}; arr.forEach((n) => { byType[n.type] = (byType[n.type] || 0) + 1; });
  const orphans = arr.filter((n) => n.in === 0 && (n.type === "concept" || n.type === "article"));
  const hubs = arr.filter((n) => n.in > 0).sort((a, b) => b.in - a.in).slice(0, 10);
  return { nodeCount: nodes.size, edgeCount: edges.length, byType, orphanCount: orphans.length, orphans: orphans.slice(0, 20).map((n) => `${n.type}:${n.slug}`), hubs: hubs.map((n) => `${n.type}:${n.slug} (${n.in} in)`) };
}

module.exports = { build, report, parseEntries };
