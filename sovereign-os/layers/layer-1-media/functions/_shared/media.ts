// Runtime mirror of @sovereign/core/media for the Deno edge runtime.
// Canonical typed source: packages/core/src/media.ts. Keep in sync.

export type MediaClass = 'cinematic' | 'operational' | 'strategic' | 'crisis';

interface Preset { label: string; directive: string; scenes: number; }

export const MEDIA_CLASS_PRESETS: Record<MediaClass, Preset> = {
  cinematic: {
    label: 'Cinematic', scenes: 5,
    directive:
      'Mode: CINEMATIC. Epic, anamorphic widescreen, volumetric light, deep teal-and-cyan palette. ' +
      'Build an emotional arc with rising inevitability. Narration is restrained but stirring.',
  },
  operational: {
    label: 'Operational', scenes: 4,
    directive:
      'Mode: OPERATIONAL. Clear, documentary, procedural. Steady camera, legible composition, ' +
      'systems and process made visible. Narration is precise and instructional, no embellishment.',
  },
  strategic: {
    label: 'Strategic', scenes: 4,
    directive:
      'Mode: STRATEGIC. Boardroom-grade, authoritative, data-forward. Controlled motion, ' +
      'executive palette. Narration frames decisions, leverage and consequence at a high altitude.',
  },
  crisis: {
    label: 'Crisis Response', scenes: 3,
    directive:
      'Mode: CRISIS RESPONSE. Urgent, high-contrast, decisive. Faster cuts, tighter framing. ' +
      'Narration is calm under pressure, factual, and action-oriented — never alarmist.',
  },
};

export function isMediaClass(v: unknown): v is MediaClass {
  return typeof v === 'string' && v in MEDIA_CLASS_PRESETS;
}

export function mediaDirective(mediaClass: MediaClass): string {
  return MEDIA_CLASS_PRESETS[mediaClass].directive;
}
