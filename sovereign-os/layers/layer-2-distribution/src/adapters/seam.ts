import type { DistributionPlatform, PlatformAdapter } from '../types.js';
import { dormant } from '../types.js';

// Declares a platform whose adapter is not yet implemented. It reports dormant so the
// grid surface is complete and typed before every integration is wired.
export function seam(platform: DistributionPlatform, requires: string[]): PlatformAdapter {
  return {
    platform,
    requires,
    ready: () => false,
    async publish() {
      return { ...dormant(platform, requires), error: `${platform} adapter not yet implemented` };
    },
  };
}
