import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, extname } from "node:path";
import type { LibraryRecord, ScoreReport, SceneCard, SceneStatus } from "../types.js";
import { loadScenes } from "../config/loadConfig.js";

/**
 * Image Library. Loads the scene definitions and persists one record per scene
 * (prompt versions, every candidate, every score, the selected candidate,
 * status and revision history) to library/records.json.
 */
export class ImageLibrary {
  private readonly records = new Map<string, LibraryRecord>();
  private readonly scenes: SceneCard[];
  private readonly file: string;

  constructor(scenesDir: string, libraryDir: string) {
    mkdirSync(libraryDir, { recursive: true });
    this.file = join(libraryDir, "records.json");
    this.scenes = loadScenes(scenesDir);
    if (existsSync(this.file)) {
      const arr = JSON.parse(readFileSync(this.file, "utf8")) as LibraryRecord[];
      for (const r of arr) this.records.set(r.sceneId, r);
    }
  }

  allScenes(): SceneCard[] { return this.scenes; }
  scene(id: string): SceneCard | undefined { return this.scenes.find((s) => s.id === id); }
  sceneByIndex(index: number): SceneCard | undefined { return this.scenes.find((s) => s.index === index); }

  get(id: string): LibraryRecord | undefined { return this.records.get(id); }
  all(): LibraryRecord[] { return [...this.records.values()].sort((a, b) => a.index - b.index); }

  /** The selected score reports of every approved scene — the continuity baseline. */
  approvedReports(): ScoreReport[] {
    const out: ScoreReport[] = [];
    for (const r of this.records.values()) {
      if (r.status === "approved" && r.selectedCandidateId) {
        const rep = r.scores.find((s) => s.candidateId === r.selectedCandidateId);
        if (rep) out.push(rep);
      }
    }
    return out;
  }

  save(record: LibraryRecord): void {
    record.updatedAt = new Date().toISOString();
    this.records.set(record.sceneId, record);
    this.flush();
  }

  setStatus(id: string, status: SceneStatus): LibraryRecord {
    const rec = this.records.get(id);
    if (!rec) throw new Error(`No record for scene ${id}; generate it first`);
    rec.status = status;
    this.save(rec);
    return rec;
  }

  /** Copy each approved scene's selected candidate to destDir as <sceneId><ext>. */
  export(destDir: string): { sceneId: string; file: string }[] {
    mkdirSync(destDir, { recursive: true });
    const exported: { sceneId: string; file: string }[] = [];
    for (const r of this.all()) {
      if (r.status !== "approved" || !r.selectedCandidateId) continue;
      const cand = r.candidates.find((c) => c.id === r.selectedCandidateId);
      if (!cand) continue;
      const dest = join(destDir, `${r.sceneId}${extname(cand.filePath)}`);
      copyFileSync(cand.filePath, dest);
      exported.push({ sceneId: r.sceneId, file: dest });
    }
    return exported;
  }

  private flush(): void {
    writeFileSync(this.file, JSON.stringify(this.all(), null, 2));
  }
}
