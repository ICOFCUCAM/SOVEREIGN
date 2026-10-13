import type { DiligenceArtifact, DiligenceDocumentKind, DiligenceDocumentSpec } from './engine.js';

// ── DATA-ROOM COMPLETENESS ──────────────────────────────────────────
// A file counts towards completeness only when it is tagged with the artifact it is
// meant to satisfy, belongs to this company, and has been accepted by a reviewer.
// An untagged upload, a file for another company, a file awaiting review and a
// rejected file all leave the artifact missing. Nothing is matched by filename.

export type ReviewState = 'submitted' | 'accepted' | 'rejected';

export interface RoomFile {
  readonly id: string;
  readonly artifactId: string | null;
  readonly companyId: string | null;
  readonly reviewState: ReviewState;
  readonly filename: string;
  readonly uploadedAt: string;
}

export type ArtifactStatus = 'accepted' | 'in_review' | 'rejected' | 'missing';

export interface ArtifactProgress {
  readonly artifact: DiligenceArtifact;
  readonly status: ArtifactStatus;
  /** Files tagged with this artifact, newest first. */
  readonly files: readonly RoomFile[];
}

export interface PackageProgress {
  readonly kind: DiligenceDocumentKind;
  readonly title: string;
  readonly required: number;
  readonly accepted: number;
  readonly pct: number;
  readonly artifacts: readonly ArtifactProgress[];
}

export interface RoomProgress {
  readonly required: number;
  readonly accepted: number;
  /** Accepted required artifacts over all required artifacts (not an average of packages). */
  readonly pct: number;
  readonly packages: readonly PackageProgress[];
  /** Files for this company not tagged with any known artifact: they count for nothing. */
  readonly untagged: readonly RoomFile[];
}

const statusOf = (files: readonly RoomFile[]): ArtifactStatus =>
  files.some((f) => f.reviewState === 'accepted') ? 'accepted'
    : files.some((f) => f.reviewState === 'submitted') ? 'in_review'
      : files.length ? 'rejected' : 'missing';

const pctOf = (a: number, r: number): number => (r === 0 ? 100 : Math.round((a / r) * 100));

export function roomProgress(packages: readonly DiligenceDocumentSpec[], files: readonly RoomFile[], companyId: string | null): RoomProgress {
  const mine = files.filter((f) => companyId == null || f.companyId === companyId);
  const known = new Set(packages.flatMap((p) => p.artifacts.map((a) => a.id)));
  const byArtifact = new Map<string, RoomFile[]>();
  for (const f of mine) if (f.artifactId && known.has(f.artifactId)) (byArtifact.get(f.artifactId) ?? byArtifact.set(f.artifactId, []).get(f.artifactId)!).push(f);
  for (const list of byArtifact.values()) list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const pkgs = packages.map((p): PackageProgress => {
    const artifacts = p.artifacts.map((a): ArtifactProgress => { const fl = byArtifact.get(a.id) ?? []; return { artifact: a, status: statusOf(fl), files: fl }; });
    const req = artifacts.filter((x) => x.artifact.required);
    const acc = req.filter((x) => x.status === 'accepted').length;
    return { kind: p.kind, title: p.title, required: req.length, accepted: acc, pct: pctOf(acc, req.length), artifacts };
  });
  const required = pkgs.reduce((s, p) => s + p.required, 0);
  const accepted = pkgs.reduce((s, p) => s + p.accepted, 0);
  return { required, accepted, pct: pctOf(accepted, required), packages: pkgs, untagged: mine.filter((f) => !f.artifactId || !known.has(f.artifactId)) };
}

/** Readable name for an artifact's suggested filename: drops the folder, fills {n} with the period. */
export function suggestedName(a: DiligenceArtifact, period: string): string {
  return (a.filename.split('/').pop() ?? a.filename).replace(/\{n(-\d+)?\}/g, (_m, off: string | undefined) => {
    const y = Number(period); return Number.isFinite(y) && off ? String(y + Number(off)) : period;
  });
}
