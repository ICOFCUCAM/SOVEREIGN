import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve package directories relative to this compiled file (dist/src/paths.js → pkg root).
const here = dirname(fileURLToPath(import.meta.url));
export const PKG_ROOT = join(here, "..", "..");

export const PATHS = {
  config: join(PKG_ROOT, "config"),
  scenes: join(PKG_ROOT, "scenes"),
  library: join(PKG_ROOT, "library"),
  output: join(PKG_ROOT, "output"),
  exportDir: join(PKG_ROOT, "export"),
};
