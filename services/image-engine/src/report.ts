import { writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { ImageLibrary } from "./library/imageLibrary.js";

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/**
 * Static HTML contact sheet — the admin "compare candidates / view scores"
 * surface. Renders every scene with its candidates and weighted scores, the
 * selected candidate highlighted, written to library/report.html.
 */
export function writeReport(library: ImageLibrary, libraryDir: string): string {
  const records = library.all();
  const scenes = library.allScenes();
  const done = records.filter((r) => r.status === "approved").length;

  const sections = scenes.map((scene) => {
    const r = records.find((x) => x.sceneId === scene.id);
    const status = r?.status ?? "pending";
    const cards = (r?.candidates ?? []).map((c) => {
      const rep = r!.scores.find((s) => s.candidateId === c.id);
      const sel = r!.selectedCandidateId === c.id;
      const src = relative(libraryDir, c.filePath);
      return `<figure class="cand ${sel ? "sel" : ""}">
        <img src="${esc(src)}" loading="lazy" alt="${esc(c.id)}"/>
        <figcaption>${rep ? rep.weightedTotal.toFixed(1) : "—"}${sel ? " ★" : ""}${rep && rep.flags.length ? " ⚠" : ""}</figcaption>
      </figure>`;
    }).join("");
    return `<section>
      <h2>${String(scene.index).padStart(2, "0")} · ${esc(scene.title)} <span class="badge ${status}">${status}</span> ${r?.bestScore ? `<span class="best">best ${r.bestScore.toFixed(1)}</span>` : ""}</h2>
      <p class="purpose">${esc(scene.purpose)}</p>
      <div class="row">${cards || '<em class="muted">not generated</em>'}</div>
    </section>`;
  }).join("\n");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Sovereign Dispatch — Art Direction Library</title>
<style>
  body{background:#070707;color:#e9e4d8;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:0;padding:32px}
  h1{font-weight:800;letter-spacing:-.02em}
  .meta{color:#9a937f;margin-bottom:24px}
  section{border-top:1px solid #1c1a16;padding:18px 0}
  h2{font-size:16px;margin:0 0 4px;display:flex;align-items:center;gap:10px}
  .purpose{color:#8a8470;margin:.2em 0 12px}
  .row{display:flex;flex-wrap:wrap;gap:10px}
  .cand{margin:0;width:200px}
  .cand img{width:200px;height:125px;object-fit:cover;border-radius:8px;border:1px solid #2a2720;background:#100f0c}
  .cand.sel img{border-color:#caa45a;box-shadow:0 0 0 2px rgba(202,164,90,.4)}
  figcaption{font-size:12px;color:#b8b09a;text-align:center;margin-top:4px}
  .badge{font-size:11px;text-transform:uppercase;letter-spacing:.1em;padding:2px 8px;border-radius:999px;border:1px solid #2a2720;color:#9a937f}
  .badge.approved{color:#7fd1a3;border-color:#2f5a44}
  .badge.in_review{color:#caa45a;border-color:#5a4a1f}
  .best{font-size:12px;color:#caa45a}
  .muted{color:#6a6453}
</style></head><body>
  <h1>Sovereign Dispatch — Art Direction Library</h1>
  <div class="meta">${done}/${scenes.length} approved · ★ selected · ⚠ flagged · numbers are weighted scores (0–100)</div>
  ${sections}
</body></html>`;

  const out = join(libraryDir, "report.html");
  writeFileSync(out, html);
  return out;
}
