import { createHash, randomUUID } from 'node:crypto';

export function newId(): string {
  return randomUUID();
}

export function contentHash(body: string | Uint8Array): string {
  return createHash('sha256').update(body).digest('hex');
}

// Deterministic UUID derived from a content hash. Used so re-ingesting
// the same document content produces the same documentId.
export function deterministicId(seed: string): string {
  const h = createHash('sha256').update(seed).digest('hex');
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    '5' + h.slice(13, 16),
    '8' + h.slice(17, 20),
    h.slice(20, 32),
  ].join('-');
}
