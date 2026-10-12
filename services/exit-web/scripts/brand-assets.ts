// Writes the ExitOS insignia's static files from the master geometry in
// src/lib/insignia.ts (HX2). Run after changing the insignia:
//   npx vite-node scripts/brand-assets.ts
// SVGs are written directly; the PNG app icons are rasterised with Playwright
// (the repo's own, else the global install) when it is available.
import fs from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { BRAND_FILES, insigniaSvg } from "../src/lib/insignia";


const run = async (): Promise<void> => {
  const pub = new URL("../public/", import.meta.url).pathname;
  for (const [f, svg] of Object.entries(BRAND_FILES)) fs.writeFileSync(pub + f, svg + "\n");
  let chromium: typeof import("playwright").chromium | undefined;
  try { ({ chromium } = await import("playwright")); }
  catch { try { ({ chromium } = await import(pathToFileURL(`${execSync("npm root -g").toString().trim()}/playwright/index.mjs`).href)); } catch { /* no rasteriser */ } }
  if (!chromium) { console.log("svg written; playwright not found, PNG icons skipped"); return; }
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  for (const [name, px, tier] of [["apple-touch-icon.png", 180, "standard"], ["favicon-32.png", 32, "micro"]] as const) {
    const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent(`<body style="margin:0;background:transparent">${insigniaSvg({ tier, variant: "tile", size: px })}</body>`);
    await p.screenshot({ path: pub + name, omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
    await p.close();
  }
  await b.close();
  console.log("svg and png brand assets written");
};

void run();
