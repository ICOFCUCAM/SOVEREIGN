// AI authoring providers. The platform authors with MULTIPLE models in parallel
// and a selector keeps the best candidate (by quality score). Three providers:
//
//  harness   — how authoring runs INSIDE the agent environment today: emit a
//              prompt spec (prompts/*.md + topic) for a Claude/GPT subagent to
//              fulfil, returning a JSON batch on disk. This is the path that
//              produced Layers 2-5.
//  anthropic — Claude API adapter (POST /v1/messages). Contract documented;
//              requires ANTHROPIC_API_KEY + network egress.
//  openai    — GPT API adapter (POST /v1/chat/completions). Same shape.
//  mock      — deterministic local generator so the full pipeline runs with no
//              network or key (used for tests and dry runs).
const fs = require("fs");
const path = require("path");
const { norm, slugify } = require("./data.cjs");

function promptSpec(type) {
  const f = path.resolve(__dirname, `../prompts/${type}.md`);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
}

// --- mock: build a schema-valid candidate from the topic, locally ---
function mockConcept(topic) {
  const term = topic.title;
  const slug = topic.slug || slugify(term);
  return {
    slug, term, category: topic.category || "Concepts & definitions", kicker: "Concept",
    headline: `${term}: what it means and why it matters.`,
    lead: `${term} is a core idea in governed institutional publication. This page explains it plainly.`,
    definition: `${term} is a concept in institutional publication concerned with making documents provably genuine, authorised and verifiable.`,
    why: [
      `Institutions rely on ${term.toLowerCase()} to keep their published records trustworthy.`,
      `Without it, authority is asserted rather than proven, and disputes become costly.`,
      `Getting it right is the difference between defensible records and fragile ones.`,
    ],
    how: [
      { t: "Governed before release", d: `Sovereign Dispatch handles ${term.toLowerCase()} through an enforced approval chain bound to offices.` },
      { t: "Sealed and verifiable", d: `Each record carries an integrity proof and permanent id anyone can verify.` },
      { t: "Evidence on the record", d: `The supporting evidence is captured as the record is made, not reconstructed later.` },
    ],
    faqs: [
      { q: `What is ${term.toLowerCase()}?`, a: `${term} is a concept in institutional publication concerned with making documents provably genuine, authorised and verifiable.` },
      { q: `Why does ${term.toLowerCase()} matter?`, a: `It lets an institution prove its publications are genuine and authorised — essential for audits, challenges and public trust.` },
      { q: `How does Sovereign Dispatch support it?`, a: `By governing approval, sealing the record, and making it permanently verifiable by anyone.` },
    ],
    relatedIndustries: topic.relatedIndustries || ["government", "regulators"],
    relatedProblems: topic.relatedProblems || [],
    diagram: topic.diagram || "shield",
    metaTitle: `${term} — Definition & Why It Matters`,
    metaDescription: `${term} in institutional publication: what it means, why it matters, and how an institution proves it.`,
  };
}

const PROVIDERS = {
  mock: { name: "mock", async author(topic) { return topic.type === "article" ? null : mockConcept(topic); } },
  harness: {
    name: "harness",
    async author(topic) {
      return { __protocol: "harness", spec: promptSpec(topic.type || "concept"), topic, note: "Hand this spec + topic to a Claude/GPT authoring subagent; it writes a JSON batch the engine then validates and merges." };
    },
  },
  anthropic: {
    name: "anthropic",
    async author(topic) {
      if (!process.env.ANTHROPIC_API_KEY) throw new Error("anthropic: ANTHROPIC_API_KEY not set (adapter requires network + key)");
      // POST https://api.anthropic.com/v1/messages { model: 'claude-opus-4-8', system: promptSpec, messages:[{role:'user',content: JSON.stringify(topic)}] }
      throw new Error("anthropic: live call not available in this environment");
    },
  },
  openai: {
    name: "openai",
    async author(topic) {
      if (!process.env.OPENAI_API_KEY) throw new Error("openai: OPENAI_API_KEY not set (adapter requires network + key)");
      // POST https://api.openai.com/v1/chat/completions { model:'gpt-4o', messages:[{role:'system',content:promptSpec},{role:'user',content:JSON.stringify(topic)}], response_format:{type:'json_object'} }
      throw new Error("openai: live call not available in this environment");
    },
  },
};

function resolve(name) { const p = PROVIDERS[name]; if (!p) throw new Error(`unknown provider ${name}`); return p; }

// Author with several providers in parallel; the caller scores and selects.
async function authorParallel(topic, names) {
  const results = await Promise.allSettled(names.map((n) => resolve(n).author(topic)));
  return results.map((r, i) => ({ provider: names[i], ok: r.status === "fulfilled", value: r.status === "fulfilled" ? r.value : null, error: r.status === "rejected" ? r.reason.message : null }));
}

module.exports = { PROVIDERS, resolve, authorParallel, promptSpec };
