import type { EntityExtractor } from './extractor.js';
import type { EnrichSignalInput, ExtractedEntity, ExtractionResult } from '../types.js';

// Deterministic mock extractor for tests + the reference dev surface.
// Pulls capitalized multi-word spans as Organization candidates and
// single capitalized tokens as Person candidates. Honest reference: a
// real model is wildly better.

const ORG_RE = /\b([A-Z][a-zA-Z]+(?:\s+(?:of\s+)?[A-Z][a-zA-Z]+){1,4})\b/g;
const PERSON_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;

const STOP_PREFIX = new Set([
  'The','A','An','This','That','It','But','And','Or','For','With','At','In','On',
  'From','To','By','As','Is','Was','Are','Were','Be','Been','Being','Have','Has','Had',
]);

function looksLikeOrg(name: string): boolean {
  if (STOP_PREFIX.has(name.split(' ')[0] ?? '')) return false;
  // Heuristic: orgs often contain Ministry/Office/Bureau/Inc/Ltd/Group/etc.
  return /\b(Ministry|Office|Bureau|Department|Agency|Council|Commission|Bank|Group|Corp|Corporation|Inc|Ltd|LLC|Foundation|University|Court|Cabinet|Parliament|Senate|Congress)\b/.test(name);
}

function looksLikePerson(name: string): boolean {
  if (STOP_PREFIX.has(name.split(' ')[0] ?? '')) return false;
  // Heuristic: 2–3 capitalized tokens, no org keyword.
  if (looksLikeOrg(name)) return false;
  return /^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/.test(name);
}

export class MockExtractor implements EntityExtractor {
  readonly name = 'mock-extractor';
  readonly version = '0.1.0';

  async extract(input: EnrichSignalInput): Promise<ExtractionResult> {
    const text = `${input.title ?? ''}\n${input.bodyExcerpt ?? ''}`.trim();
    const seen = new Map<string, ExtractedEntity>();

    const tryMatch = (re: RegExp, type: ExtractedEntity['entityType'], predicate: (n: string) => boolean) => {
      let m: RegExpExecArray | null;
      const fresh = new RegExp(re.source, re.flags);
      while ((m = fresh.exec(text))) {
        const name = (m[1] ?? '').trim();
        if (!name || !predicate(name)) continue;
        const key = `${type}::${name.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.set(key, {
          entityType: type,
          mention: name,
          salience: 0.6,
          role: type === 'organization' ? 'subject' : 'mentioned',
        });
        if (seen.size >= 12) return;
      }
    };

    tryMatch(ORG_RE, 'organization', looksLikeOrg);
    tryMatch(PERSON_RE, 'person', looksLikePerson);

    return {
      signalId: input.signalId,
      entities: Array.from(seen.values()),
      model: `${this.name}@${this.version}`,
      extractedAt: new Date().toISOString(),
    };
  }
}
