// Cover Package composition — Polished Pages' publishing layer. We do NOT
// generate artwork here (OpenAI does the cover); we compose the production and
// marketing derivatives from that cover + the book's metadata, entirely in the
// browser via canvas: spine, marketplace thumbnail, audiobook cover, social
// square and marketing banner.

export interface ComposedAsset { key: string; label: string; src: string; filename: string; w: number; h: number; note?: string }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the cover image."));
    img.src = src;
  });
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  return [c, ctx];
}

// Draw an image to fill a rect, cropping overflow (object-fit: cover).
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height, rr = w / h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > rr) { sh = img.height; sw = sh * rr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / rr; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Draw an image to fit inside a rect, centered (object-fit: contain).
function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): { w: number; h: number } {
  const ir = img.width / img.height, rr = w / h;
  let dw: number, dh: number;
  if (ir > rr) { dw = w; dh = w / ir; } else { dh = h; dw = h * ir; }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  return { w: dw, h: dh };
}

function averageColor(img: HTMLImageElement): { r: number; g: number; b: number; lum: number } {
  const [c, ctx] = makeCanvas(1, 1);
  ctx.drawImage(img, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  const lum = 0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2];
  return { r: d[0], g: d[1], b: d[2], lum };
}

function inkOn(lum: number): string { return lum > 140 ? "#11151c" : "#ffffff"; }

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Spine width comes from the shared print system (print-sizes.ts) so there's a
// single source of truth for paper thickness and trim across cover + interior.
import { getTrim, PAPER_MM_PER_PAGE } from "@/lib/print-sizes";
const MM_PER_IN = 25.4;
export const spineWidthInches = (pages: number, paper: string): number =>
  (pages * (PAPER_MM_PER_PAGE[paper] ?? PAPER_MM_PER_PAGE["White"])) / MM_PER_IN;

// Print spine: width derived from page count + paper, height from trim. The
// background is sampled from the cover so the wrap reads as one piece.
async function composeSpine(front: HTMLImageElement, o: { title: string; author?: string; pages: number; trimHeightIn: number; paper: string }): Promise<ComposedAsset> {
  const dpi = 300;
  const wIn = spineWidthInches(o.pages, o.paper);
  const W = Math.max(36, Math.round(wIn * dpi));
  const H = Math.round((o.trimHeightIn || 9) * dpi);
  const [c, ctx] = makeCanvas(W, H);
  const avg = averageColor(front);
  ctx.fillStyle = `rgb(${avg.r},${avg.g},${avg.b})`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(0, 0, W, H);
  const ink = inkOn(avg.lum);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  const fs = Math.min(W * 0.4, 72);
  ctx.font = `600 ${fs}px Georgia, 'Times New Roman', serif`;
  ctx.fillText(o.title.toUpperCase(), -H * 0.04, 0, H * 0.66);
  if (o.author) {
    ctx.font = `400 ${fs * 0.62}px Georgia, serif`;
    ctx.fillText(o.author, H * 0.4, 0, H * 0.24);
  }
  ctx.restore();
  return { key: "spine", label: "Spine", src: c.toDataURL("image/png"), filename: "spine.png", w: W, h: H, note: `${wIn.toFixed(3)} in · ${o.pages} pages` };
}

async function composeThumb(front: HTMLImageElement): Promise<ComposedAsset> {
  const W = 600, H = 900;
  const [c, ctx] = makeCanvas(W, H);
  drawCover(ctx, front, 0, 0, W, H);
  return { key: "thumb", label: "Marketplace thumbnail", src: c.toDataURL("image/png"), filename: "marketplace-thumbnail.png", w: W, h: H, note: "600 × 900" };
}

async function composeAudiobook(front: HTMLImageElement): Promise<ComposedAsset> {
  const S = 1600;
  const [c, ctx] = makeCanvas(S, S);
  ctx.filter = "blur(48px) brightness(0.7)";
  drawCover(ctx, front, -40, -40, S + 80, S + 80);
  ctx.filter = "none";
  const pad = S * 0.12;
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  drawContain(ctx, front, pad, pad, S - pad * 2, S - pad * 2);
  ctx.shadowColor = "transparent";
  return { key: "audiobook", label: "Audiobook cover", src: c.toDataURL("image/png"), filename: "audiobook-cover.png", w: S, h: S, note: "1600 × 1600 (square)" };
}

async function composeSocial(front: HTMLImageElement, o: { title: string; author?: string }): Promise<ComposedAsset> {
  const S = 1080;
  const [c, ctx] = makeCanvas(S, S);
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, "#0e1726"); g.addColorStop(1, "#1c2740");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // cover on the right, text on the left
  const cw = S * 0.42, ch = cw * 1.5, cx = S - cw - S * 0.07, cy = (S - ch) / 2;
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 12;
  drawContain(ctx, front, cx, cy, cw, ch);
  ctx.shadowColor = "transparent";
  const tx = S * 0.08, tw = cx - tx - S * 0.04;
  ctx.fillStyle = "#fff"; ctx.textBaseline = "top";
  ctx.font = `700 ${S * 0.058}px Georgia, serif`;
  let y = S * 0.3;
  for (const line of wrapText(ctx, o.title, tw)) { ctx.fillText(line, tx, y, tw); y += S * 0.07; }
  if (o.author) { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = `400 ${S * 0.034}px Georgia, serif`; ctx.fillText(o.author, tx, y + S * 0.02, tw); }
  return { key: "social", label: "Social post (square)", src: c.toDataURL("image/png"), filename: "social-square.png", w: S, h: S, note: "1080 × 1080" };
}

async function composeBanner(front: HTMLImageElement, o: { title: string; author?: string; subtitle?: string }): Promise<ComposedAsset> {
  const W = 1500, H = 500;
  const [c, ctx] = makeCanvas(W, H);
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "#0e1726"); g.addColorStop(1, "#243355");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const ch = H * 0.78, cw = ch / 1.5, cx = W - cw - W * 0.05, cy = (H - ch) / 2;
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  drawContain(ctx, front, cx, cy, cw, ch);
  ctx.shadowColor = "transparent";
  const tx = W * 0.05, tw = cx - tx - W * 0.04;
  ctx.fillStyle = "#fff"; ctx.textBaseline = "top";
  ctx.font = `700 ${H * 0.13}px Georgia, serif`;
  let y = H * 0.22;
  for (const line of wrapText(ctx, o.title, tw)) { ctx.fillText(line, tx, y, tw); y += H * 0.15; }
  ctx.fillStyle = "rgba(255,255,255,0.72)"; ctx.font = `400 ${H * 0.066}px Georgia, serif`;
  if (o.subtitle) { ctx.fillText(o.subtitle.slice(0, 80), tx, y + H * 0.02, tw); y += H * 0.1; }
  if (o.author) ctx.fillText(o.author, tx, y + H * 0.03, tw);
  return { key: "banner", label: "Marketing banner", src: c.toDataURL("image/png"), filename: "marketing-banner.png", w: W, h: H, note: "1500 × 500" };
}

// Build the whole package from a front cover + metadata. Spine is included only
// when a page count is available (its width depends on it).
export async function composeCoverPackage(o: {
  frontSrc: string;
  title: string;
  author?: string;
  subtitle?: string;
  pages?: number;
  trimId?: string;
  paper?: string;
}): Promise<ComposedAsset[]> {
  const front = await loadImage(o.frontSrc);
  const out: ComposedAsset[] = [];
  const trimHeightIn = getTrim(o.trimId ?? "6x9").hmm / MM_PER_IN;
  if (o.pages && o.pages > 0) {
    out.push(await composeSpine(front, { title: o.title, author: o.author, pages: o.pages, trimHeightIn, paper: o.paper ?? "Cream" }));
  }
  out.push(await composeThumb(front));
  out.push(await composeAudiobook(front));
  out.push(await composeSocial(front, { title: o.title, author: o.author }));
  out.push(await composeBanner(front, { title: o.title, author: o.author, subtitle: o.subtitle }));
  return out;
}
