#!/usr/bin/env node
// Sovereign Dispatch — Content Engine CLI. The first-class Publishing & Knowledge
// Platform that is the foundation for all SEO and every language. See README.md.
//
// Topic database & editorial workflow
//   topic add <id> --title "..." [--type concept|article] [--keywords a,b] [--priority 1-5]
//   topic list [--status <state>]        topic show <id>
//   queue                                 review <id> --approve|--reject [--note "..."]
//   refresh-due                           # evergreen review scheduling
// Authoring & pipeline (parallel models → verify → score → link → schema → publish)
//   author <id> [--providers mock,harness,anthropic,openai]
//   pipeline <id> [--providers ...] [--autopublish] [--gate 70]
// Quality, linking, graph, schema, translation
//   quality <type> <batch.json>           link <type> <batch.json>
//   graph                                 schema <type> <batch.json>
//   translate <type> <batch.json>         # multi-language architecture (no MT yet)
// Publish & distribute
//   validate <type> <batch.json>          merge <type> <scratch-dir> [--glob l3-batch]
//   feeds                                 sitemap                       # = feeds
//   indexnow [--submit]                   # IndexNow ping (dry-run default)
//   rankings pull|report                  # Search Console / ranking tracking
//   stats
const fs = require("fs");
const D = require("../lib/data.cjs");
const store = require("../lib/store.cjs");
const stages = require("../lib/stages.cjs");
const providers = require("../lib/providers.cjs");
const seo = require("../lib/seo.cjs");
const graph = require("../lib/graph.cjs");
const pipeline = require("../lib/pipeline.cjs");

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const has = (n) => args.includes(`--${n}`);
const J = (o) => console.log(JSON.stringify(o, null, 2));
const loadBatch = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

async function main() {
  const [cmd, sub, arg2] = args;
  switch (cmd) {
    case "topic": {
      if (sub === "add") { const t = store.topics.upsert({ id: arg2, title: flag("title", arg2), type: flag("type", "concept"), keywords: String(flag("keywords", "")).split(",").filter(Boolean), priority: Number(flag("priority", 3)), status: "queued" }); J(t); }
      else if (sub === "list") { const s = flag("status"); const l = s ? store.topics.byStatus(s) : store.topics.all(); l.forEach((t) => console.log(`  ${t.status.padEnd(11)} ${t.type.padEnd(8)} ${t.id.padEnd(34)} ${t.title}`)); console.log(`  (${l.length} topics)`); }
      else if (sub === "show") J(store.topics.get(arg2));
      else console.log("topic add|list|show");
      break;
    }
    case "queue": { store.STATES.forEach((s) => { const n = store.topics.byStatus(s).length; if (n) console.log(`  ${s.padEnd(13)} ${n}`); }); break; }
    case "review": {
      const decision = has("approve") ? "approved" : has("reject") ? "idea" : null;
      if (!decision) { console.log("review <id> --approve|--reject"); break; }
      J(store.topics.transition(sub, decision, flag("note", "")));
      break;
    }
    case "refresh-due": {
      const today = new Date("2026-06-27").getTime();
      const due = store.topics.all().filter((t) => t.status === "live").filter((t) => { const last = new Date(t.lastReviewed || t.updatedAt).getTime(); return today - last >= (t.reviewEveryDays || 180) * 864e5; });
      due.forEach((t) => console.log(`  due  ${t.id}  (last ${t.lastReviewed || t.updatedAt})`)); console.log(`  (${due.length} due for evergreen review)`);
      break;
    }
    case "author": {
      const t = store.topics.get(sub); if (!t) { console.log("no such topic"); break; }
      const out = await providers.authorParallel(t, String(flag("providers", "mock")).split(","));
      out.forEach((o) => console.log(`  ${o.provider.padEnd(10)} ${o.ok ? "ok" : "—"} ${o.error || (o.value && o.value.__protocol ? "(harness protocol)" : "candidate")}`));
      break;
    }
    case "pipeline": {
      const t = store.topics.get(sub); if (!t) { console.log("no such topic"); break; }
      if (t.status === "queued") store.topics.transition(t.id, "drafting");
      const rep = await pipeline.run(store.topics.get(sub), { providerNames: String(flag("providers", "mock")).split(","), autopublish: has("autopublish"), qualityGate: Number(flag("gate", 70)) });
      J(rep);
      break;
    }
    case "quality": { const r = loadBatch(arg2).map((e) => ({ slug: e.slug, ...stages.qualityScore(e, sub) })); r.forEach((x) => console.log(`  ${String(x.score).padStart(3)}  ${x.slug}${x.factFlags.length ? "  ⚠ " + x.factFlags.join("; ") : ""}`)); break; }
    case "link": { loadBatch(arg2).forEach((e) => { const s = stages.linkSuggest(e, sub); console.log(`  ${e.slug || e.term}: ${JSON.stringify(s)}`); }); break; }
    case "schema": J(stages.schemaFor(loadBatch(arg2)[0], sub)); break;
    case "translate": J(stages.translatePlan(loadBatch(arg2)[0], sub)); break;
    case "graph": J(graph.report()); break;
    case "validate": { const arr = loadBatch(arg2); const t = D.TYPES[sub]; const bad = arr.filter((e) => !t.valid(e)); const slugs = arr.map((e) => D.slugify(e.slug)); const dups = slugs.filter((s, i) => slugs.indexOf(s) !== i); console.log(`${arg2}: ${arr.length} entries, ${bad.length} malformed, ${dups.length} dup slugs`); if (bad.length || dups.length) process.exit(1); break; }
    case "merge": {
      const glob = flag("glob", sub === "article" ? "l4-batch" : "l3-batch");
      const re = new RegExp(`^${glob}-\\d+\\.json$`); const files = fs.readdirSync(arg2).filter((f) => re.test(f)).sort();
      const raw = []; files.forEach((f) => { try { const a = JSON.parse(fs.readFileSync(`${arg2}/${f}`, "utf8")); if (Array.isArray(a)) { raw.push(...a); console.log(`${f}: ${a.length}`); } } catch (e) { console.error(`SKIP ${f}: ${e.message}`); } });
      J(stages.mergeEntries(sub, raw));
      break;
    }
    case "feeds": case "sitemap": J(seo.feeds()); break;
    case "indexnow": {
      const slugs = []; // default: all content URLs
      const urls = [`${D.ORIGIN}/`, `${D.ORIGIN}/library`, `${D.ORIGIN}/learn`, `${D.ORIGIN}/industries`, `${D.ORIGIN}/docs`];
      J(await seo.indexNow(urls, { submit: has("submit") }));
      break;
    }
    case "rankings": {
      if (sub === "report") J(seo.searchConsole.report());
      else if (sub === "pull") J(await seo.searchConsole.pull({ live: has("live") }));
      else console.log("rankings pull|report");
      break;
    }
    case "stats": {
      const count = (f, start) => { const s = D.read(f); return D.slugsIn(s.slice(s.indexOf(start))).length; };
      const rows = [["Layer 2 — Industries", count("src/lib/industries.ts", "export const INDUSTRIES")], ["Layer 3 — Concepts", count("src/lib/problems.ts", "export const PROBLEMS")], ["Layer 4 — Library", count("src/lib/library.ts", "export const ARTICLES")], ["Layer 5 — Docs", count("src/lib/docs.ts", "export const DOCS")]];
      const total = rows.reduce((n, r) => n + r[1], 0);
      rows.forEach((r) => console.log(`  ${r[0].padEnd(26)} ${r[1]}`));
      console.log(`  ${"TOTAL content pages".padEnd(26)} ${total}`);
      console.log(`  ${"Topics in database".padEnd(26)} ${store.topics.all().length}`);
      break;
    }
    default: console.log("usage: content.cjs <topic|queue|review|refresh-due|author|pipeline|quality|link|schema|translate|graph|validate|merge|feeds|indexnow|rankings|stats>");
  }
}
main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
