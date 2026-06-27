// The publishing pipeline orchestrator. Runs a topic through every stage and
// records the outcome as a version. Mirrors the flow the user specified:
//   topic → AI author (parallel) → fact verify → quality score → internal links
//        → schema → version history → (human review gate) → publish → index.
const providers = require("./providers.cjs");
const stages = require("./stages.cjs");
const store = require("./store.cjs");

async function run(topic, { providerNames = ["mock"], autopublish = false, qualityGate = 70 } = {}) {
  const type = topic.type || "concept";
  const report = { topic: topic.id, type, stages: {} };

  // 1. AI authoring — parallel models
  const candidates = await providers.authorParallel(topic, providerNames);
  const usable = candidates.filter((c) => c.ok && c.value && !c.value.__protocol);
  report.stages.author = { providers: candidates.map((c) => ({ provider: c.provider, ok: c.ok, error: c.error })) };
  if (!usable.length) {
    report.stages.author.note = "No model returned a publishable candidate (harness/api stages run outside this process).";
    store.versions.append({ slug: topic.slug, topic: topic.id, stage: "author", status: "deferred" });
    return report;
  }

  // 2-4. score every candidate, select the best
  const scored = usable.map((c) => ({ provider: c.provider, candidate: c.value, ...stages.qualityScore(c.value, type) }));
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  report.stages.select = { winner: best.provider, scores: scored.map((s) => ({ provider: s.provider, score: s.score })) };

  // 2. fact verification (gate)
  const fact = stages.factCheck(best.candidate);
  report.stages.factCheck = fact;

  // 5. internal linking — fill/repair related links from the graph
  const links = stages.linkSuggest(best.candidate, type);
  report.stages.linking = links;

  // 6. schema
  report.stages.schema = { types: stages.schemaFor(best.candidate, type)["@graph"].map((g) => g["@type"]) };

  // 8/9. translation architecture
  report.stages.translate = stages.translatePlan(best.candidate, type);

  // 7. quality
  report.stages.quality = { score: best.score, breakdown: best.breakdown };

  // version history
  store.versions.append({ slug: best.candidate.slug, topic: topic.id, stage: "drafted", provider: best.provider, score: best.score, factPassed: fact.passed });

  // publish gate
  const ready = fact.passed && best.score >= qualityGate;
  report.ready = ready;
  if (autopublish && ready) {
    const merged = stages.mergeEntries(type, [best.candidate]);
    store.versions.append({ slug: best.candidate.slug, topic: topic.id, stage: "published", provider: best.provider, score: best.score });
    store.topics.transition(topic.id, "published", `auto-published by ${best.provider} (score ${best.score})`);
    report.stages.publish = merged;
  } else {
    report.stages.publish = { skipped: true, reason: autopublish ? `quality ${best.score} < gate ${qualityGate} or fact flags` : "human review required" };
    if (topic.status === "drafting") store.topics.transition(topic.id, "in_review", `drafted by ${best.provider} (score ${best.score})`);
  }
  return report;
}

module.exports = { run };
