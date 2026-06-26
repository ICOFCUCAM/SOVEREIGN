// Central type contracts for the Sovereign Dispatch Art Direction Engine.
//
// Core principle: a prompt is COMPOSED from layered configuration — Brand DNA ·
// Style · Camera · Lighting · Composition · Scene · Quality · Negative — and is
// NEVER handwritten. Every scene is generated as multiple candidates, each
// scored 0–100 against weighted criteria, continuity-checked against the
// approved set, and only the best (above threshold) is selected. Below
// threshold, the prompt is refined programmatically and regenerated.

export type AspectRatio = "16:10" | "16:9" | "3:2" | "4:3" | "1:1" | "4:5";

export type PeopleProminence = "none" | "distant" | "present" | "central";

// ─── Configuration layers (config/*.json) ────────────────────────────────────

export interface BrandConfig {
  name: string;
  dna: string[];           // immutable brand principles (institutional, editorial…)
  positioning: string;     // one-line institutional positioning
  avoid: string[];         // brand-level anti-patterns (no stock, no AI look…)
  gradeSignature: string;  // the consistent colour-grade sentence applied everywhere
}

export interface StyleConfig {
  palette: string[];
  materials: string[];
  textures: string[];
  renderingQuality: string[];
  lens: string;
  depthOfField: string;
  perspective: string;
  mood: string;
  atmosphere: string;
}

export interface CameraPreset {
  id: string;
  angle: string;
  lens: string;
  height: string;
  distance: string;
  framing: string;
  composition: string;
}
export interface CameraConfig {
  default: string;            // preset id used when a scene omits one
  presets: CameraPreset[];
}

export interface LightingPreset {
  id: string;
  description: string;
}
export interface LightingConfig {
  default: string;
  presets: LightingPreset[];
}

export interface CompositionConfig {
  rules: string[];
  defaultAspectRatio: AspectRatio;
}

export interface QualityCriterion {
  key: string;
  label: string;
  weight: number;             // relative weight; need not sum to 100
  critical?: boolean;         // a near-zero score here fails the candidate outright
}
export interface QualityConfig {
  criteria: QualityCriterion[];
  threshold: number;          // 0–100 weighted total required to accept
  maxAttempts: number;        // regeneration attempts before giving up
  candidatesPerScene: number; // candidates generated per attempt
  continuityFloor: number;    // min brand/lighting consistency vs approved set
}

export interface NegativeConfig {
  global: string[];           // never-allow tokens, appended to every prompt
}

export interface EngineConfig {
  brand: BrandConfig;
  style: StyleConfig;
  camera: CameraConfig;
  lighting: LightingConfig;
  composition: CompositionConfig;
  quality: QualityConfig;
  negative: NegativeConfig;
}

// ─── Scene cards (scenes/*.json) ──────────────────────────────────────────────

export interface SceneCard {
  id: string;                 // "scene-01-government-cabinet"
  index: number;              // 1..30
  title: string;
  purpose: string;            // what the illustration is for on the product
  story: string;              // the narrative moment to depict
  environment: string;
  architecture: string;
  people: { prominence: PeopleProminence; notes?: string };
  camera?: string;            // camera preset id (else camera.default)
  lighting?: string;          // lighting preset id (else lighting.default)
  composition?: string;       // scene-specific composition emphasis
  materials: string[];
  objects: string[];
  negativeExtra: string[];    // scene-specific negatives
  continuityNotes: string;    // how this must visually match the set
  aspectRatio?: AspectRatio;
}

// ─── Composed prompt ──────────────────────────────────────────────────────────

export interface ComposedPrompt {
  sceneId: string;
  version: number;
  text: string;
  negativeText: string;
  aspectRatio: AspectRatio;
  hash: string;
  layers: Record<string, string>;  // every layer, for inspection/debugging
}

// ─── Generation (provider abstraction) ────────────────────────────────────────

export interface GenerateOptions {
  candidates: number;
  outDir: string;
}
export interface GenerationCandidate {
  id: string;
  sceneId: string;
  promptVersion: number;
  provider: string;
  model: string;
  filePath: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}
export interface ImageProvider {
  readonly name: string;
  readonly model: string;
  generate(prompt: ComposedPrompt, opts: GenerateOptions): Promise<GenerationCandidate[]>;
}

// ─── Scoring (evaluator abstraction) ──────────────────────────────────────────

export interface ScoreReport {
  candidateId: string;
  sceneId: string;
  scores: Record<string, number>;  // criterion key -> 0–100
  weightedTotal: number;           // 0–100
  flags: string[];                 // prohibited elements / artifacts detected
  notes: string;
}
export interface Scorer {
  readonly name: string;
  score(candidate: GenerationCandidate, scene: SceneCard, config: EngineConfig): Promise<ScoreReport>;
}

// ─── Continuity ───────────────────────────────────────────────────────────────

export interface ContinuityVerdict {
  ok: boolean;
  reasons: string[];
}

// ─── Library (persistent record per scene) ────────────────────────────────────

export type SceneStatus = "pending" | "in_review" | "approved" | "rejected";

export interface PromptVersionRecord {
  version: number;
  hash: string;
  refinementReason?: string;
  createdAt: string;
}
export interface LibraryRecord {
  sceneId: string;
  index: number;
  status: SceneStatus;
  attempts: number;
  revisionCount: number;
  promptVersions: PromptVersionRecord[];
  candidates: GenerationCandidate[];
  scores: ScoreReport[];
  selectedCandidateId?: string;
  bestScore?: number;
  continuity?: ContinuityVerdict;
  createdAt: string;
  updatedAt: string;
}

// ─── Orchestration result ─────────────────────────────────────────────────────

export interface OrchestrationResult {
  record: LibraryRecord;
  accepted: boolean;          // a candidate passed threshold + continuity
  attemptsUsed: number;
  reason: string;
}
