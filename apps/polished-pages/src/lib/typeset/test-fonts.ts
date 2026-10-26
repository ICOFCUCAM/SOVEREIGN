// Test helper: reads the font files from node_modules instead of fetching them.
import fs from "node:fs";
import path from "node:path";
export const nodeFetchFont = async (url: string): Promise<Uint8Array> => {
  const cdn = /cdn\.jsdelivr\.net\/npm\/(@expo-google-fonts\/[^@]+)@[^/]+\/(.+)$/.exec(url);
  const rel = cdn ? `node_modules/${cdn[1]}/${cdn[2]}` : url.replace(/^\/@fs/, "").replace(/\?.*$/, "");
  const p = path.isAbsolute(rel) && fs.existsSync(rel) ? rel : path.join(process.cwd(), rel.replace(/^\//, ""));
  return new Uint8Array(fs.readFileSync(p));
};
