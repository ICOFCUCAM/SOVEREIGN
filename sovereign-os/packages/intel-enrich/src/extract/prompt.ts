import type { EnrichSignalInput, ExtractedEntity } from '../types.js';
import { isEntityType } from '@sovereign/intel-core';

// Extraction prompt + response schema shared by the Claude / OpenAI
// adapters. Conservative — asks for at most 12 entities per signal,
// strict entity_type vocabulary, salience in [0, 1].

export const ENTITY_TYPES_LIST = [
  'person', 'organization', 'place', 'product',
  'topic', 'event', 'asset', 'document',
] as const;

export function extractionPrompt(input: EnrichSignalInput): { system: string; user: string } {
  const system = `You are an institutional intelligence analyst extracting structured entities from a single news / social signal. Return entities as strict JSON only.

Rules:
- Return at most 12 entities.
- entity_type must be one of: ${ENTITY_TYPES_LIST.join(', ')}.
- Use canonical names (e.g. "United Nations" not "UN" — alias goes in aliases[]).
- salience ∈ [0, 1] — how central the entity is to this signal.
- role ∈ {subject, mentioned, source, target} where defensible.
- Only include sentiment when the signal expresses a clear stance toward the entity.
- Do not invent facts. Skip if no entities are identifiable.

Output schema:
{
  "entities": [
    {
      "entity_type": "organization",
      "mention": "Ministry of Finance",
      "aliases": ["Finance Ministry"],
      "salience": 0.9,
      "role": "subject",
      "external_ids": { "wikidata": "Q..." },
      "attributes": { "jurisdiction": "pt" }
    }
  ]
}`;

  const body = [
    input.title ? `TITLE: ${input.title}` : '',
    input.bodyExcerpt ? `BODY: ${input.bodyExcerpt}` : '',
    `CLASS: ${input.signalClass}`,
    input.canonicalUrl ? `URL: ${input.canonicalUrl}` : '',
  ].filter(Boolean).join('\n');

  return { system, user: body };
}

// Parse the JSON the model returns. Tolerant — strips ```json``` fences
// if present, accepts an array under either {entities} or top-level.
export function parseExtractionResponse(raw: string): readonly ExtractedEntity[] {
  if (!raw) return [];
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) cleaned = fence[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).entities))
      ? ((parsed as Record<string, unknown>).entities as unknown[])
      : [];

  const out: ExtractedEntity[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const v = item as Record<string, unknown>;
    const entityType = v.entity_type ?? v.entityType;
    const mention = typeof v.mention === 'string' ? v.mention.trim() : '';
    if (!isEntityType(entityType) || !mention) continue;
    const salience = typeof v.salience === 'number'
      ? Math.max(0, Math.min(1, v.salience))
      : 0.5;
    const role = ['subject','mentioned','source','target'].includes(v.role as string)
      ? (v.role as 'subject' | 'mentioned' | 'source' | 'target')
      : undefined;
    const aliasesIn = v.aliases;
    const aliases = Array.isArray(aliasesIn)
      ? aliasesIn.filter((a) => typeof a === 'string').map((a) => (a as string).trim()).filter(Boolean).slice(0, 8)
      : undefined;
    const externalIdsIn = v.external_ids ?? v.externalIds;
    const externalIds = (externalIdsIn && typeof externalIdsIn === 'object' && !Array.isArray(externalIdsIn))
      ? Object.fromEntries(Object.entries(externalIdsIn as Record<string, unknown>).filter(([, val]) => typeof val === 'string')) as Record<string, string>
      : undefined;
    const attributesIn = v.attributes;
    const attributes = (attributesIn && typeof attributesIn === 'object' && !Array.isArray(attributesIn))
      ? attributesIn as Record<string, unknown>
      : undefined;

    out.push({
      entityType,
      mention,
      salience,
      ...(aliases !== undefined ? { aliases } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(externalIds !== undefined ? { externalIds } : {}),
      ...(attributes !== undefined ? { attributes } : {}),
    });
    if (out.length >= 12) break;
  }
  return out;
}
