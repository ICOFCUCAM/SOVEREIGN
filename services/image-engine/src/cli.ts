#!/usr/bin/env node
import { loadConfig } from "./config/loadConfig.js";
import { ImageLibrary } from "./library/imageLibrary.js";
import { Orchestrator } from "./orchestrator.js";
import { createProvider } from "./providers/registry.js";
import { createScorer } from "./scoring/registry.js";
import { composePrompt } from "./engines/promptComposer.js";
import { writeReport } from "./report.js";
import { PATHS } from "./paths.js";
import type { SceneCard } from "./types.js";

function build() {
  const config = loadConfig(PATHS.config);
  const library = new ImageLibrary(PATHS.scenes, PATHS.library);
  const provider = createProvider();
  const scorer = createScorer();
  const orchestrator = new Orchestrator({ config, provider, scorer, library, outDir: PATHS.output });
  return { config, library, provider, scorer, orchestrator };
}

/** Resolve a scene by id, filename stem, or numeric index. */
function resolveScene(library: ImageLibrary, ref: string): SceneCard {
  const byId = library.scene(ref);
  if (byId) return byId;
  const n = Number(ref);
  if (Number.isInteger(n)) {
    const byIndex = library.sceneByIndex(n);
    if (byIndex) return byIndex;
  }
  const partial = library.allScenes().find((s) => s.id.includes(ref));
  if (partial) return partial;
  throw new Error(`No scene matches "${ref}"`);
}

const usage = `Sovereign Dispatch — Art Direction Engine

Usage: dispatch-art <command> [arg]

  status                 Progress across all 30 scenes (1–30)
  next                   Generate the next not-yet-approved scene
  generate <id|index>    Run the full pipeline for one scene
  regenerate <id|index>  Re-run a scene from scratch
  prompt <id|index>      Print the composed prompt (no generation)
  scores <id|index>      Print candidate scores for a scene
  candidates <id|index>  List candidate files for a scene
  approve <id|index>     Approve a scene's selected candidate
  reject <id|index>      Reject a scene (back to pending)
  export                 Copy approved selections to ./export
  report                 Write library/report.html contact sheet

Env:  IMAGE_PROVIDER=mock|openai   SCORER=mock|vision   OPENAI_API_KEY=...`;

async function main() {
  const [cmd, ref] = process.argv.slice(2);
  const { config, library, provider, scorer, orchestrator } = build();

  switch (cmd) {
    case "status": {
      const recs = library.all();
      const approved = recs.filter((r) => r.status === "approved").length;
      console.log(`Provider: ${provider.name} (${provider.model}) · Scorer: ${scorer.name} · Threshold: ${config.quality.threshold}`);
      console.log(`Approved ${approved}/${library.allScenes().length}\n`);
      for (const s of library.allScenes()) {
        const r = library.get(s.id);
        const mark = r?.status === "approved" ? "✔" : r?.status === "in_review" ? "•" : r?.status === "rejected" ? "✗" : "·";
        const score = r?.bestScore ? `best ${r.bestScore.toFixed(1)}` : "";
        console.log(`  ${mark} ${String(s.index).padStart(2, "0")} ${s.id.padEnd(34)} ${(r?.status ?? "pending").padEnd(10)} ${score}`);
      }
      break;
    }
    case "next": {
      const pending = library.allScenes().find((s) => (library.get(s.id)?.status ?? "pending") !== "approved");
      if (!pending) { console.log("All scenes approved."); break; }
      console.log(`Generating ${pending.id} …`);
      const res = await orchestrator.run(pending.id);
      console.log(res.accepted ? `✓ ${res.reason} (attempt ${res.attemptsUsed}) — awaiting approval` : `△ ${res.reason}`);
      break;
    }
    case "generate":
    case "regenerate": {
      if (!ref) throw new Error(`${cmd} requires <id|index>`);
      const scene = resolveScene(library, ref);
      console.log(`Running pipeline for ${scene.id} …`);
      const res = await orchestrator.run(scene.id);
      const r = res.record;
      console.log(`${res.accepted ? "✓" : "△"} ${res.reason}`);
      console.log(`  attempts: ${r.attempts} · prompt versions: ${r.promptVersions.length} · candidates: ${r.candidates.length}`);
      if (r.selectedCandidateId) console.log(`  selected: ${r.selectedCandidateId} (status: ${r.status})`);
      break;
    }
    case "prompt": {
      if (!ref) throw new Error("prompt requires <id|index>");
      const scene = resolveScene(library, ref);
      const p = composePrompt(scene, config);
      console.log(`# ${scene.id} (hash ${p.hash}, ${p.aspectRatio})\n`);
      console.log(p.text);
      break;
    }
    case "scores": {
      if (!ref) throw new Error("scores requires <id|index>");
      const r = library.get(resolveScene(library, ref).id);
      if (!r) { console.log("Not generated yet."); break; }
      for (const s of [...r.scores].sort((a, b) => b.weightedTotal - a.weightedTotal)) {
        const sel = r.selectedCandidateId === s.candidateId ? " ★" : "";
        const flags = s.flags.length ? `  ⚠ ${s.flags.join(",")}` : "";
        console.log(`  ${s.weightedTotal.toFixed(1).padStart(5)}  ${s.candidateId}${sel}${flags}`);
      }
      break;
    }
    case "candidates": {
      if (!ref) throw new Error("candidates requires <id|index>");
      const r = library.get(resolveScene(library, ref).id);
      if (!r) { console.log("Not generated yet."); break; }
      for (const c of r.candidates) console.log(`  ${c.id}  ${c.filePath}`);
      break;
    }
    case "approve": {
      if (!ref) throw new Error("approve requires <id|index>");
      const rec = library.setStatus(resolveScene(library, ref).id, "approved");
      console.log(`Approved ${rec.sceneId} → ${rec.selectedCandidateId ?? "(no selection)"}`);
      break;
    }
    case "reject": {
      if (!ref) throw new Error("reject requires <id|index>");
      const rec = library.setStatus(resolveScene(library, ref).id, "pending");
      console.log(`Rejected ${rec.sceneId} (back to pending)`);
      break;
    }
    case "export": {
      const exported = library.export(PATHS.exportDir);
      console.log(`Exported ${exported.length} approved image(s) to ${PATHS.exportDir}`);
      for (const e of exported) console.log(`  ${e.sceneId} → ${e.file}`);
      break;
    }
    case "report": {
      const out = writeReport(library, PATHS.library);
      console.log(`Wrote ${out}`);
      break;
    }
    default:
      console.log(usage);
      if (cmd && cmd !== "help" && cmd !== "--help") process.exitCode = 1;
  }
}

main().catch((e) => { console.error("Error:", e instanceof Error ? e.message : e); process.exitCode = 1; });
