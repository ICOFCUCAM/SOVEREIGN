import type { MediaClass } from './types.js';

// The four sovereign content classes and the director directives that shape each one.
// Canonical typed reference for the platform; the Deno edge runtime keeps a runtime
// mirror at layers/layer-1-media/functions/_shared/media.ts (separate runtime, no shared build).

export interface MediaClassPreset {
  label: string;
  /** Appended to the cinematic director system prompt to shape tone + visual language. */
  directive: string;
  /** Default scene count for this class. */
  scenes: number;
}

export const MEDIA_CLASS_PRESETS: Record<MediaClass, MediaClassPreset> = {
  cinematic: {
    label: 'Cinematic',
    scenes: 5,
    directive:
      'Mode: CINEMATIC. Epic, anamorphic widescreen, volumetric light, deep teal-and-cyan palette. ' +
      'Build an emotional arc with rising inevitability. Narration is restrained but stirring.',
  },
  operational: {
    label: 'Operational',
    scenes: 4,
    directive:
      'Mode: OPERATIONAL. Clear, documentary, procedural. Steady camera, legible composition, ' +
      'systems and process made visible. Narration is precise and instructional, no embellishment.',
  },
  strategic: {
    label: 'Strategic',
    scenes: 4,
    directive:
      'Mode: STRATEGIC. Boardroom-grade, authoritative, data-forward. Controlled motion, ' +
      'executive palette. Narration frames decisions, leverage and consequence at a high altitude.',
  },
  crisis: {
    label: 'Crisis Response',
    scenes: 3,
    directive:
      'Mode: CRISIS RESPONSE. Urgent, high-contrast, decisive. Faster cuts, tighter framing. ' +
      'Narration is calm under pressure, factual, and action-oriented — never alarmist.',
  },
};

export function isMediaClass(value: unknown): value is MediaClass {
  return typeof value === 'string' && value in MEDIA_CLASS_PRESETS;
}

export function mediaDirective(mediaClass: MediaClass): string {
  return MEDIA_CLASS_PRESETS[mediaClass].directive;
}
