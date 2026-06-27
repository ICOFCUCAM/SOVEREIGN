// Persistence for the publishing platform: the Topic database, append-only
// Version history, and ranking snapshots. File-backed (JSON / JSONL) so it runs
// with no external dependency; the same interface maps onto the production
// Postgres schema in schema/M30__content_engine.sql.
const fs = require("fs");
const path = require("path");
const DATA = path.resolve(__dirname, "../data");
const TOPICS = path.join(DATA, "topics.json");
const VERSIONS = path.join(DATA, "versions.jsonl");
const RANKINGS = path.join(DATA, "rankings.jsonl");

function ensure() { if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true }); if (!fs.existsSync(TOPICS)) fs.writeFileSync(TOPICS, "[]\n"); }
const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const readJsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const appendJsonl = (f, o) => { ensure(); fs.appendFileSync(f, JSON.stringify(o) + "\n"); };

// Editorial workflow states — the lifecycle of a topic through the platform.
const STATES = ["idea", "queued", "drafting", "in_review", "approved", "published", "live", "needs_refresh", "retired"];

const topics = {
  all() { ensure(); return readJson(TOPICS, []); },
  get(id) { return topics.all().find((t) => t.id === id); },
  byStatus(s) { return topics.all().filter((t) => t.status === s); },
  save(list) { ensure(); fs.writeFileSync(TOPICS, JSON.stringify(list, null, 2) + "\n"); },
  upsert(t) {
    const list = topics.all(); const i = list.findIndex((x) => x.id === t.id);
    const now = "2026-06-27";
    if (i >= 0) list[i] = { ...list[i], ...t, updatedAt: now };
    else list.push({ status: "idea", locale: "en", type: "concept", priority: 3, createdAt: now, updatedAt: now, reviewEveryDays: 180, ...t });
    topics.save(list); return topics.get(t.id);
  },
  transition(id, status, note) {
    if (!STATES.includes(status)) throw new Error(`unknown status ${status}`);
    const t = topics.get(id); if (!t) throw new Error(`no topic ${id}`);
    const hist = t.history || []; hist.push({ at: "2026-06-27", from: t.status, to: status, note: note || "" });
    return topics.upsert({ id, status, history: hist });
  },
};

const versions = {
  append(rec) { appendJsonl(VERSIONS, { at: "2026-06-27", ...rec }); },
  forSlug(slug) { return readJsonl(VERSIONS).filter((v) => v.slug === slug); },
  all() { return readJsonl(VERSIONS); },
};

const rankings = {
  append(rec) { appendJsonl(RANKINGS, { at: "2026-06-27", ...rec }); },
  all() { return readJsonl(RANKINGS); },
  latestBySlug() { const m = {}; for (const r of readJsonl(RANKINGS)) m[r.slug] = r; return m; },
};

module.exports = { STATES, topics, versions, rankings, paths: { DATA, TOPICS, VERSIONS, RANKINGS } };
