// What this runner can do, so the Studio can tell when the deployed runner is older than the site
// (DESIGN-SPEC.md §21). Raise RUNNER_LEVEL whenever the site starts relying on something new here;
// the site's RUNNER_LEVEL_NEEDED (src/lib/claude-studio.ts) must not be higher (a test checks).
import fs from "node:fs";

export const RUNNER_LEVEL = 5;
export const FEATURES = ["gzip-bodies", "page-images", "raw-files", "library-tools", "organise", "rewrite-approval", "rewrite-audit", "scan-adopt","scan-batches","continue-runs","section-goals"];

/** pdftoppm (poppler-utils) is what Claude Code needs to read PDF pages. */
export function capabilities() {
  const poppler = ["/usr/bin/pdftoppm", "/usr/local/bin/pdftoppm", "/opt/homebrew/bin/pdftoppm"].some((p) => { try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; } });
  return { level: RUNNER_LEVEL, features: FEATURES, poppler, node: process.version };
}
