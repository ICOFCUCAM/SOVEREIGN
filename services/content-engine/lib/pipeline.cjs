// The publishing pipeline orchestrator. Runs a topic through every stage and
// records the outcome as a version. Mirrors the flow the user specified:
//   topic → AI author (parallel) → fact verify → quality score → internal links
//        → schema → version history → (human review gate) → publish → index.
const providers = require("./providers.cjs");
const stages = require("./stages.cjs");
const store = require("./store.cjs");
const versioning = require("./versioning.cjs");

async function run(topic, { providerNames = ["mock"], autopublish = false, qualityGate = 70, seoGate = 72 } = {}) {
  const type = topic.type || "concept";
  const report = { topic: topic.id, type, stages: {} };

  // 1. AI authoring — parallel models (Claude / GPT / …)
  const candidates = await providers.authorParallel(topic, providerNames);
  const usable = candidates.filter((c) => c.ok && c.value && !c.value.__protocol);
  report.stages.author = { providers: candidates.map((c) => ({ provider: c.provider, ok: c.ok, error: c.error })) };
  if (!usable.length) {
    report.stages.author.note = "No model returned a publishable candidate (harness/api stages run outside this process).";
    store.versions.append({ slug: topic.slug, topic: topic.id, stage: "author", status: "deferred" });
    return report;
  }

  // select best of the first pass by quality
  const scored = usable.map((c) => ({ provider: c.provider, candidate: c.value, ...stages.qualityScore(c.value, type) })).sort((a, b) => b.score - a.score);
  let best = scored[0];
  report.stages.select = { winner: best.provider, scores: scored.map((s) => ({ provider: s.provider, score: s.score })) };

  // 2. refine — a second model improves the winning draft (Claude → GPT)
  const refineProvider = providerNames.find((p) => p !== best.provider) || best.provider;
  const refined = await stages.refine(best.candidate, type, refineProvider);
  report.stages.refine = { applied: refined.applied, provider: refined.provider, note: refined.note || refined.error };
  best = { ...best, candidate: refined.candidate, ...stages.qualityScore(refined.candidate, type) };

  // 3. fact verification (gate)
  const fact = stages.factCheck(best.candidate);
  report.stages.factCheck = fact;

  // 4. quality
  report.stages.quality = { score: best.score, breakdown: best.breakdown };

  // 5. SEO review (gate distinct from quality)
  const seo = stages.seoReview(best.candidate, type);
  report.stages.seoReview = seo;

  // 6. internal linking
  report.stages.linking = stages.linkSuggest(best.candidate, type);

  // 7. schema
  report.stages.schema = { types: stages.schemaFor(best.candidate, type)["@graph"].map((g) => g["@type"]) };

  // 8. translation architecture
  report.stages.translate = stages.translatePlan(best.candidate, type);

  // draft version record
  store.versions.append({ slug: best.candidate.slug, topic: topic.id, stage: "drafted", provider: best.provider, score: best.score, factPassed: fact.passed, seoScore: seo.score });

  // publish gate — quality AND seo AND fact must pass
  const ready = fact.passed && best.score >= qualityGate && seo.score >= seoGate;
  report.ready = ready;
  if (autopublish && ready) {
    const merged = stages.mergeEntries(type, [best.candidate]);
    const ver = versioning.snapshot({ slug: best.candidate.slug, type, topic: topic.id, payload: best.candidate, provider: best.provider, score: best.score, reviewEveryDays: topic.reviewEveryDays || 180 });
    store.topics.transition(topic.id, "published", `auto-published by ${best.provider} (q${best.score}/seo${seo.score}) — v${ver.version}, next review ${ver.nextReview}`);
    report.stages.publish = { ...merged, version: ver.version, nextReview: ver.nextReview };
  } else {
    const why = !fact.passed ? "fact-check flags" : best.score < qualityGate ? `quality ${best.score}<${qualityGate}` : seo.score < seoGate ? `seo ${seo.score}<${seoGate}` : "human review required";
    report.stages.publish = { skipped: true, reason: why };
    if (topic.status === "drafting") store.topics.transition(topic.id, "in_review", `drafted by ${best.provider} (q${best.score}/seo${seo.score})`);
  }
  return report;
}

module.exports = { run };
