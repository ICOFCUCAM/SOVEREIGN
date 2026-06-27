// Orphan repair — the internal-linking engine's corrective pass. The graph
// surfaces pages with zero inbound links (an SEO smell). This adds each orphan to
// the related-links array of its best-matching sibling pages, creating inbound
// links. Works for concepts (relatedProblems) and articles (relatedArticles).
// Edits the data module in place; dry-run by default.
const { read, P, fs, norm } = require("./data.cjs");
const graph = require("./graph.cjs");

const TYPES = {
  concept: { type: "concept", file: "src/lib/problems.ts", title: "term", field: "relatedProblems" },
  article: { type: "article", file: "src/lib/library.ts", title: "title", field: "relatedArticles" },
};
const STOP = new Set("the a an of for and to in on with is are as by from that this its".split(" "));
const toks = (s) => norm(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));

function parseEntries(cfg) {
  const src = read(cfg.file);
  const idxs = [...src.matchAll(/["']?slug["']?\s*:\s*"([a-z0-9-]+)"/g)];
  const out = [];
  for (let i = 0; i < idxs.length; i++) {
    const start = idxs[i].index, end = i + 1 < idxs.length ? idxs[i + 1].index : src.length;
    const slice = src.slice(start, end), slug = idxs[i][1];
    const cat = (slice.match(/"?category"?\s*:\s*"([^"]+)"/) || [])[1] || "";
    const title = (slice.match(new RegExp(`"?${cfg.title}"?\\s*:\\s*"([^"]+)"`)) || [])[1] || slug.replace(/-/g, " ");
    const rel = (slice.match(new RegExp(`"?${cfg.field}"?\\s*:\\s*\\[([^\\]]*)\\]`)) || [])[1] || "";
    out.push({ slug, category: cat, bag: new Set(toks(title + " " + slug.replace(/-/g, " "))), related: [...rel.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]) });
  }
  return out;
}

function plan(typeKey, { perOrphan = 3, cap = 6 } = {}) {
  const cfg = TYPES[typeKey];
  const { nodes } = graph.build();
  const orphans = [...nodes.values()].filter((n) => n.type === cfg.type && n.in === 0).map((n) => n.slug);
  const entries = parseEntries(cfg);
  const bySlug = Object.fromEntries(entries.map((c) => [c.slug, c]));
  const orphanSet = new Set(orphans);
  const edits = {}; const added = {};
  for (const o of orphans) {
    const oc = bySlug[o]; if (!oc) continue;
    const cands = entries
      .filter((c) => c.slug !== o && !c.related.includes(o))
      .map((c) => ({ slug: c.slug, sameCat: c.category === oc.category, overlap: [...c.bag].filter((w) => oc.bag.has(w)).length, load: (edits[c.slug] || []).length + c.related.length }))
      .filter((c) => c.load < cap)
      .sort((a, b) => (b.sameCat - a.sameCat) || (b.overlap - a.overlap) || (a.load - b.load));
    const ranked = [...cands.filter((c) => !orphanSet.has(c.slug)), ...cands.filter((c) => orphanSet.has(c.slug))];
    for (const c of ranked.slice(0, perOrphan)) { (edits[c.slug] = edits[c.slug] || []).push(o); added[o] = (added[o] || 0) + 1; }
  }
  return { typeKey, orphans, edits, fixed: Object.keys(added).length, unresolved: orphans.filter((o) => !added[o]) };
}

function apply(p) {
  const cfg = TYPES[p.typeKey];
  const src = read(cfg.file);
  const idxs = [...src.matchAll(/["']?slug["']?\s*:\s*"([a-z0-9-]+)"/g)];
  const head = src.slice(0, idxs[0].index);
  const parts = [];
  const rx = new RegExp(`("?${cfg.field}"?\\s*:\\s*\\[)([^\\]]*)(\\])`);
  for (let i = 0; i < idxs.length; i++) {
    const start = idxs[i].index, end = i + 1 < idxs.length ? idxs[i + 1].index : src.length;
    let slice = src.slice(start, end); const adds = p.edits[idxs[i][1]];
    if (adds && adds.length) {
      slice = slice.replace(rx, (m, a, inner, c) => {
        const have = new Set([...inner.matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]));
        const fresh = adds.filter((s) => !have.has(s)).map((s) => `"${s}"`);
        if (!fresh.length) return m;
        return a + inner.replace(/\s*$/, "") + (inner.trim() ? ", " : "") + fresh.join(", ") + c;
      });
    }
    parts.push(slice);
  }
  fs.writeFileSync(P(cfg.file), head + parts.join(""));
  return { editedEntries: Object.keys(p.edits).length };
}

module.exports = { plan, apply, TYPES };
