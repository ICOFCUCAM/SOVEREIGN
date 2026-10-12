// Share card (HOMEPAGE.md CC2): renders public/og/exitos-card.png, 1200×630,
// from the running homepage's own figures and edition date, so the card never
// states a number the site does not. Re-run before each release:
//   npx vite --port 5180 &  then  node scripts/og-card.mjs
// Uses Playwright's Chromium (PLAYWRIGHT_BROWSERS_PATH or CHROMIUM_PATH).
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Playwright is not a project dependency: use a local install if present,
// otherwise the global one (npm i -g playwright).
let chromium;
try { ({ chromium } = await import("playwright")); }
catch {
  try { ({ chromium } = await import(pathToFileURL(`${execSync("npm root -g").toString().trim()}/playwright/index.mjs`).href)); }
  catch { console.error("og-card: Playwright not found — install it (npm i -g playwright) and re-run."); process.exit(1); }
}
const OUT = new URL("../public/og/exitos-card.png", import.meta.url).pathname;
const BASE = process.env.SITE_URL ?? "http://127.0.0.1:5180";
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await p.goto(`${BASE}/`); await p.waitForTimeout(2500);
const facts = await p.evaluate(() => {
  const hero = document.querySelector("#ch-01");
  const figs = [...hero.querySelectorAll(".hero-rule + div")].map((d) => ({ v: d.querySelector(".sr-only")?.textContent ?? d.textContent, l: d.nextElementSibling?.childNodes[0]?.textContent?.trim() }));
  const ed = hero.querySelector(".justify-end")?.textContent?.trim();
  return { figs, ed };
});
console.log(JSON.stringify(facts));
const fig = facts.figs.map((f) => `<div class="f"><div class="v">${f.v}</div><div class="l">${f.l}</div></div>`).join("");
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,600;1,8..60,600&display=block" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box} body{width:1200px;height:630px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;
background:radial-gradient(ellipse 70% 90% at 85% 10%,rgba(37,99,235,.35),transparent 60%),linear-gradient(180deg,#030a15 0%,#06182E 70%,#05101f 100%)}
.grid{position:absolute;inset:0;opacity:.06;background-image:repeating-linear-gradient(90deg,#a0bee6 0 1px,transparent 1px 100px),repeating-linear-gradient(0deg,#a0bee6 0 1px,transparent 1px 100px)}
.wrap{position:absolute;inset:56px 64px 0 64px}
.top{display:flex;justify-content:space-between;font:500 14px ui-monospace,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:rgba(219,234,254,.75);border-bottom:1px solid rgba(255,255,255,.2);padding-bottom:16px}
.top b{color:#fff;font:600 22px Inter;letter-spacing:-.01em;text-transform:none}
h1{margin-top:40px;max-width:600px;font:600 80px/0.93 "Source Serif 4",serif;letter-spacing:-.045em}
h1 em{display:block;font-style:italic;color:#93c5fd}
.route{position:absolute;right:60px;top:150px;width:440px;height:235px}
.figs{position:absolute;left:64px;right:64px;bottom:56px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(255,255,255,.18)}
.f{padding-top:20px}.f+.f{border-left:1px solid rgba(255,255,255,.15);padding-left:28px}
.v{font:600 52px/1 "Source Serif 4",serif;letter-spacing:-.03em}.l{margin-top:8px;font-size:17px;color:rgba(219,234,254,.8)}
.bar{position:absolute;left:0;right:0;bottom:0;height:8px;background:#2563eb}
.ed{position:absolute;right:64px;bottom:198px;font:500 13px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:rgba(219,234,254,.65)}
</style></head><body><div class="grid"></div>
<svg class="route" viewBox="0 0 470 250"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#93c5fd"/><stop offset=".6" stop-color="#60a5fa"/><stop offset="1" stop-color="#45E38A"/></linearGradient></defs>
<path d="M10 150 C 60 150, 90 230, 130 220 S 170 40, 200 60 S 230 180, 250 170 S 300 70, 340 60 S 400 200, 420 190 S 450 110, 460 110" fill="none" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>
${[[10,150],[130,220],[200,60],[250,170],[340,60],[420,190],[460,110]].map(([x,y],i,a)=>`<circle cx="${x}" cy="${y}" r="7" fill="${i===a.length-1?'#45E38A':'#60a5fa'}" stroke="#e8f1ff" stroke-width="2"/><circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${i===a.length-1?'#45E38A':'#93c5fd'}" opacity=".5"/>`).join("")}
</svg>
<div class="wrap"><div class="top"><b>ExitOS</b><span>The global acquisition exchange</span></div>
<h1>Institutional acquisition<em>infrastructure</em></h1></div>
<div class="ed">${facts.ed ?? ""}</div>
<div class="figs">${fig}</div><div class="bar"></div></body></html>`;
const c = await b.newPage({ viewport: { width: 1200, height: 630 } });
await c.setContent(html); await c.waitForTimeout(1800);
await c.screenshot({ path: OUT, type: "png" });
console.log("card written");
await b.close();
