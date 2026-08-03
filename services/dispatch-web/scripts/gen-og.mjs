import { chromium } from "playwright";

// Social-share card (1200×630) for dispatch.sovereigndo.com — regenerate with
// `node scripts/gen-og.mjs` whenever the positioning line changes. Mirrors the
// original card's design language: dark field, gold tracked eyebrow, serif
// headline, gold shield badge with faint concentric rings, mark + byline foot.
const OUT = new URL("../public/og.png", import.meta.url).pathname;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; position:relative; overflow:hidden;
    background:#0a0a09; font-family:Helvetica,Arial,sans-serif;
    background-image:radial-gradient(60% 55% at 78% 42%, rgba(233,200,120,0.07), transparent 70%),
                     linear-gradient(160deg, #100e0a 0%, #0a0a09 55%, #070707 100%); }
  .bar { position:absolute; left:0; right:0; height:14px; background:#c9a24b; }
  .bar.top { top:0; } .bar.bot { bottom:0; }
  .eyebrow { position:absolute; left:80px; top:74px; color:#d4af5c; font-weight:700;
    font-size:21px; letter-spacing:0.42em; }
  h1 { position:absolute; left:76px; top:210px; width:760px;
    font-family:Georgia,"Times New Roman",serif; font-weight:700;
    font-size:76px; line-height:1.18; color:#f7f3e8; letter-spacing:-0.01em; }
  h1 .g { color:#d4af5c; }
  .badge { position:absolute; right:130px; top:180px; width:260px; height:260px; }
  .ring { position:absolute; border:1px solid rgba(212,175,92,0.18); border-radius:50%; }
  .r1 { inset:-36px; } .r2 { inset:-72px; border-color:rgba(212,175,92,0.10); }
  .coin { position:absolute; inset:0; border-radius:50%;
    background:radial-gradient(120% 120% at 30% 22%, #f4dc9c 0%, #e0bb66 45%, #b9903c 100%);
    box-shadow:0 30px 80px -30px rgba(0,0,0,0.9), inset 0 2px 6px rgba(255,255,255,0.5);
    display:flex; align-items:center; justify-content:center; }
  .foot { position:absolute; left:80px; bottom:64px; display:flex; align-items:center; gap:16px;
    color:#b9bdc4; font-size:24px; }
  .foot svg { width:34px; height:34px; }
</style></head><body>
  <div class="bar top"></div>
  <div class="eyebrow">INSTITUTIONAL TRUST INFRASTRUCTURE</div>
  <h1>From Information<br/>to <span class="g">Official Record.</span></h1>
  <div class="badge">
    <span class="ring r1"></span><span class="ring r2"></span>
    <div class="coin">
      <svg viewBox="0 0 32 32" width="120" height="120" fill="none">
        <path d="M16 4l9.5 3.5v7.8c0 6-4 10.6-9.5 12.9-5.5-2.3-9.5-6.9-9.5-12.9V7.5L16 4z" stroke="#4b3a12" stroke-width="1.9"/>
        <path d="M11.5 16.2l3.2 3.2 6-6.4" stroke="#4b3a12" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
  <div class="foot">
    <svg viewBox="0 0 32 32" fill="none"><path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="#c9a24b" stroke-width="1.6"/><path d="M16 9v9m-4-5l4-4 4 4" stroke="#c9a24b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>Sovereign Dispatch — institutional trust infrastructure</span>
  </div>
  <div class="bar bot"></div>
</body></html>`;

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: "networkidle" });
await p.screenshot({ path: OUT, type: "png" });
await b.close();
console.log("wrote", OUT);
