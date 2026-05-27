import { MEDIA_CLASS_PRESETS } from '@sovereign/core/media';
import type { MediaClass } from '@sovereign/core/types';
import { Panel } from './Panel';

const ACCENT: Record<MediaClass, string> = {
  cinematic: 'text-sov-cyan border-sov-cyan/40',
  operational: 'text-sov-teal border-sov-teal/40',
  strategic: 'text-sov-amber border-sov-amber/40',
  crisis: 'text-sov-rose border-sov-rose/40',
};

export function MediaClassBar() {
  const classes = Object.entries(MEDIA_CLASS_PRESETS) as [MediaClass, (typeof MEDIA_CLASS_PRESETS)[MediaClass]][];
  return (
    <Panel title="CONTENT CLASSES" hint="Layer 1 director presets">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {classes.map(([key, preset]) => (
          <div key={key} className={`rounded border bg-sov-bg/50 p-3 ${ACCENT[key]}`}>
            <div className="text-sm font-semibold">{preset.label}</div>
            <div className="mt-1 text-[10px] leading-snug text-sov-mute">
              {preset.directive.replace(/^Mode: [^.]+\. /, '')}
            </div>
            <div className="mt-2 text-[10px] text-sov-mute">default {preset.scenes} scenes</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
