// Draws a CoverDesign onto a canvas: front, back, spine or the full print wrap.
// Everything is laid out in millimetres (the canvas is scaled by px-per-mm), so
// the same code makes the live preview, the 300 dpi print file and the ebook
// cover. Type is set here, never painted by the image model.
import {
  SAFE_MM, fontOf, fontWeight, SPINE_MARGIN_MM, ean13Modules, inkFor, isGuard, isbnLabel, templateById, toIsbn13, wrapGeometry,
  type CoverDesign, type CoverTemplate, type Rect,
} from "@/lib/cover-design";
import "@/lib/cover-fonts";

export type CoverPart = "wrap" | "front" | "back" | "spine";
export interface CoverImages { front: HTMLImageElement | null; back: HTMLImageElement | null; photo: HTMLImageElement | null }
export interface RenderOptions { guides?: boolean; /** Draw the barcode bars into the image (off for the print PDF, which draws them as vectors). */ rasterBarcode?: boolean }
export interface RenderResult { overflow: boolean }

const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => { cache.delete(src); reject(new Error("Could not load an image.")); };
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}
export async function loadCoverImages(d: CoverDesign): Promise<CoverImages> {
  const get = (s: string | null) => (s ? loadImage(s).catch(() => null) : Promise.resolve(null));
  const [front, back, photo] = await Promise.all([get(d.frontArt), get(d.backArt), get(d.authorPhoto)]);
  return { front, back, photo };
}

/** Waits for the cover typefaces, so the first render isn't set in a fallback font. */
export async function loadCoverFonts(d: CoverDesign) {
  if (typeof document === "undefined" || !document.fonts) return;
  const t = templateById(d.template);
  const keys = [d.titleFont ?? t.titleFont, d.bodyFont ?? t.bodyFont];
  await Promise.all(keys.flatMap((k) => {
    const f = fontOf(k);
    return [...f.weights.map((w) => `${w} 40px ${f.family}`), ...(f.italic ? [`italic 400 20px ${f.family}`] : [])].map((spec) => document.fonts.load(spec).catch(() => []));
  }));
}

/** Re-encodes an uploaded or generated image as a JPEG no taller than maxH, to keep saved covers small. */
export async function shrinkImage(src: string, maxH = 2400, quality = 0.9): Promise<string> {
  const img = await loadImage(src);
  const k = Math.min(1, maxH / img.height);
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

// ── Drawing helpers ──────────────────────────────────────────────────────────

type Ctx = CanvasRenderingContext2D;

function cover(ctx: Ctx, img: HTMLImageElement, r: Rect) {
  const ir = img.width / img.height, rr = r.w / r.h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > rr) { sh = img.height; sw = sh * rr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / rr; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
}

/** The image's average colour, or (edge) that of its left edge, which meets the spine. */
function averageHex(img: HTMLImageElement, edge = false): string {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 1;
  const x = c.getContext("2d");
  if (!x) return "#1d2b45";
  if (edge) x.drawImage(img, 0, 0, Math.max(1, img.width * 0.06), img.height, 0, 0, 1, 1);
  else x.drawImage(img, 0, 0, 1, 1);
  const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
  // Darken a little: a spine/back in the cover's own colour, but deep enough to carry type.
  const k = 0.72;
  return `#${[r, g, b].map((v) => Math.round(v * k).toString(16).padStart(2, "0")).join("")}`;
}

function font(weight: number | string, size: number, family: string, italic = false) { return `${italic ? "italic " : ""}${weight} ${size}px ${family}`; }
function spacing(ctx: Ctx, em: number, size: number) {
  const c = ctx as Ctx & { letterSpacing?: string };
  if ("letterSpacing" in c) c.letterSpacing = `${em * size}px`;
}

function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

/** The largest size (≤ max) at which text fits in maxLines lines no wider than maxW. */
function fit(ctx: Ctx, text: string, f: (size: number) => string, maxW: number, max: number, maxLines: number, min = max * 0.35) {
  for (let size = max; size >= min; size *= 0.94) {
    ctx.font = f(size);
    const lines = wrap(ctx, text, maxW);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) return { size, lines };
  }
  ctx.font = f(min);
  return { size: min, lines: wrap(ctx, text, maxW) };
}

function textLines(ctx: Ctx, lines: string[], x: number, y: number, lh: number, align: CanvasTextAlign) {
  ctx.textAlign = align;
  for (const l of lines) { ctx.fillText(l, x, y); y += lh; }
  return y;
}

function scrim(ctx: Ctx, r: Rect, where: CoverTemplate["scrim"], strength: number) {
  if (where === "none" || strength <= 0) return;
  const a = Math.min(0.92, strength);
  const band = (y0: number, y1: number, fromTop: boolean) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(fromTop ? 0 : 1, `rgba(0,0,0,${a})`);
    g.addColorStop(fromTop ? 1 : 0, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(r.x, y0, r.w, y1 - y0);
  };
  if (where === "top" || where === "both") band(r.y, r.y + r.h * 0.5, true);
  if (where === "bottom" || where === "both") band(r.y + r.h * 0.45, r.y + r.h, false);
}

function ornament(ctx: Ctx, cx: number, y: number, w: number, color: string, lw: number) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - lw * 4, y); ctx.moveTo(cx + lw * 4, y); ctx.lineTo(cx + w / 2, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, y - lw * 2.4); ctx.lineTo(cx + lw * 2.4, y); ctx.lineTo(cx, y + lw * 2.4); ctx.lineTo(cx - lw * 2.4, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ── Panels ───────────────────────────────────────────────────────────────────

function palette(d: CoverDesign, imgs: CoverImages) {
  const t = templateById(d.template);
  const hasArt = Boolean(imgs.front);
  const ink = d.ink ?? (hasArt ? t.ink : t.ink === "#ffffff" ? inkFor(t.bg[0]) : t.ink);
  const titleKey = d.titleFont ?? t.titleFont, bodyKey = d.bodyFont ?? t.bodyFont;
  const tfam = fontOf(titleKey), bfam = fontOf(bodyKey);
  return {
    t, hasArt, ink, accent: d.accent ?? t.accent, title: tfam.family, body: bfam.family, pos: d.titlePos ?? t.titlePos,
    /** Capitals only where the template wants them and the title face reads well in them. */
    upper: t.upper && !tfam.noCaps, bodyCaps: !bfam.noCaps,
    tf: (w: number, size: number) => font(fontWeight(titleKey, w), size, tfam.family),
    bf: (w: number, size: number, italic = false) => font(fontWeight(bodyKey, w), size, bfam.family, italic && bfam.italic),
  };
}

function fillBg(ctx: Ctx, r: Rect, t: CoverTemplate) {
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w * 0.4, r.y + r.h);
  g.addColorStop(0, t.bg[0]); g.addColorStop(1, t.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawFront(ctx: Ctx, d: CoverDesign, imgs: CoverImages, panel: Rect, T: Rect) {
  const p = palette(d, imgs);
  const { t } = p;
  if (imgs.front) cover(ctx, imgs.front, panel); else fillBg(ctx, panel, t);
  const S = SAFE_MM;
  const x0 = T.x + S, w = T.w - 2 * S;
  const cx = p.t.align === "center" ? T.x + T.w / 2 : x0;
  const align: CanvasTextAlign = t.align === "center" ? "center" : "left";

  let bandBottom = 0;
  if (t.band) {
    bandBottom = T.y + T.h * 0.38;
    if (p.hasArt) scrim(ctx, panel, "bottom", d.shade * 0.8); // keeps the author legible over the art
    ctx.fillStyle = t.bg[0];
    ctx.fillRect(panel.x, panel.y, panel.w, bandBottom - panel.y);
    ctx.fillStyle = p.accent; ctx.fillRect(panel.x, bandBottom, panel.w, Math.max(0.8, T.h * 0.006));
  } else if (p.hasArt) {
    scrim(ctx, panel, p.pos === "middle" ? "both" : t.scrim === "none" ? "none" : p.pos === "top" ? (t.scrim === "bottom" ? "both" : t.scrim) : t.scrim, d.shade);
  }

  ctx.textBaseline = "alphabetic";
  const shadow = p.hasArt && !t.band;
  const withShadow = (fn: () => void) => {
    ctx.save();
    if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = T.w * 0.012; ctx.shadowOffsetY = T.w * 0.003; }
    fn(); ctx.restore();
  };

  // Title block: series line, title, ornament, subtitle, tagline.
  const titleText = p.upper ? d.title.toUpperCase() : d.title;
  const maxSize = t.titleSize * T.w * d.titleScale * 1.35;
  const tf = (s: number) => p.tf(t.titleWeight, s);
  const fitted = fit(ctx, titleText || " ", tf, w, maxSize, 4);
  const tlh = fitted.size * 1.06;
  const seriesSize = T.w * 0.03, subSize = T.w * 0.046, tagSize = T.w * 0.034, authorSize = T.w * 0.052 * Math.min(1.2, Math.max(0.85, d.titleScale));
  ctx.font = p.bf(400, subSize, true);
  const subLines = d.subtitle ? wrap(ctx, d.subtitle, w * 0.92).slice(0, 3) : [];
  ctx.font = p.bf(400, tagSize);
  const tagLines = d.tagline ? wrap(ctx, d.tagline, w * 0.9).slice(0, 2) : [];

  const blockH = (d.seriesLine ? seriesSize * 2 : 0) + fitted.lines.length * tlh + (t.ornament ? T.w * 0.06 : 0) + (subLines.length ? subSize * 0.6 + subLines.length * subSize * 1.3 : 0) + (tagLines.length ? tagSize + tagLines.length * tagSize * 1.35 : 0);
  const authorBand = authorSize * 2.2;
  let y = p.pos === "top" ? T.y + S + T.h * 0.035 : p.pos === "middle" ? T.y + T.h * 0.44 - blockH / 2 : T.y + T.h - S - authorBand - blockH - T.h * 0.02;
  if (t.band) y = Math.max(T.y + S, Math.min(y, bandBottom - blockH - T.h * 0.03));

  withShadow(() => {
    ctx.fillStyle = p.ink;
    if (d.seriesLine) {
      ctx.font = p.bf(600, seriesSize); spacing(ctx, 0.18, seriesSize);
      ctx.fillStyle = p.accent;
      textLines(ctx, [d.seriesLine.toUpperCase()], cx, y + seriesSize, 0, align);
      spacing(ctx, 0, seriesSize);
      y += seriesSize * 2; ctx.fillStyle = p.ink;
    }
    ctx.font = tf(fitted.size); spacing(ctx, t.letterSpacing, fitted.size);
    y = textLines(ctx, fitted.lines, cx, y + fitted.size * 0.9, tlh, align) - tlh + fitted.size * 0.25;
    spacing(ctx, 0, fitted.size);
    if (t.ornament) { y += T.w * 0.03; ornament(ctx, cx, y, T.w * 0.32, p.accent, T.w * 0.004); y += T.w * 0.03; }
    if (subLines.length) {
      ctx.font = p.bf(400, subSize, true);
      y = textLines(ctx, subLines, cx, y + subSize * 1.5, subSize * 1.3, align) - subSize * 1.3;
    }
    if (tagLines.length) {
      ctx.font = p.bf(400, tagSize);
      ctx.globalAlpha = 0.9;
      textLines(ctx, tagLines, cx, y + tagSize * 2.1, tagSize * 1.35, align);
      ctx.globalAlpha = 1;
    }
  });

  // Author: opposite end from a bottom title, otherwise at the foot.
  if (d.author) {
    const ay = p.pos === "bottom" ? T.y + S + authorSize : T.y + T.h - S - authorSize * 0.4;
    withShadow(() => {
      const caps = p.bodyCaps && (t.upper || t.id === "academic");
      ctx.font = t.id === "classic" || t.id === "devotional" ? p.tf(600, authorSize) : p.bf(600, authorSize);
      spacing(ctx, caps ? 0.12 : 0.04, authorSize);
      ctx.fillStyle = t.band && p.pos !== "bottom" ? "#ffffff" : p.ink;
      ctx.textAlign = align;
      ctx.fillText(caps ? d.author.toUpperCase() : d.author, cx, ay, w);
      spacing(ctx, 0, authorSize);
    });
  }
}

function drawBack(ctx: Ctx, d: CoverDesign, imgs: CoverImages, panel: Rect, T: Rect, barcode: Rect, o: RenderOptions): boolean {
  const p = palette(d, imgs);
  const { t } = p;
  const solid = imgs.front ? averageHex(imgs.front) : t.bg[0];
  let ink: string;
  if (imgs.back) {
    cover(ctx, imgs.back, panel);
    ctx.fillStyle = `rgba(0,0,0,${0.2 + d.shade * 0.45})`; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ink = "#ffffff";
  } else if (d.backFill === "front-blur" && imgs.front) {
    ctx.save();
    ctx.filter = `blur(${T.w * 0.04}px)`;
    cover(ctx, imgs.front, { x: panel.x - 10, y: panel.y - 10, w: panel.w + 20, h: panel.h + 20 });
    ctx.restore();
    ctx.fillStyle = `rgba(0,0,0,${0.35 + d.shade * 0.4})`; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ink = "#ffffff";
  } else {
    if (imgs.front) { ctx.fillStyle = solid; ctx.fillRect(panel.x, panel.y, panel.w, panel.h); } else fillBg(ctx, panel, t);
    ink = d.ink ?? inkFor(imgs.front ? solid : t.bg[0]);
  }

  const S = SAFE_MM;
  const x = T.x + S + T.w * 0.02, w = T.w - 2 * S - T.w * 0.04;
  const top = T.y + S + T.h * 0.02;
  const limit = barcode.y - T.h * 0.03;
  const body = p.body;

  // Lay out at a scale; shrink until everything fits above the barcode line.
  const layout = (k: number, draw: boolean) => {
    let y = top;
    const bs = Math.min(4.4, Math.max(3.1, T.w * 0.024)) * k; // ~9–12.5 pt
    if (d.backHeadline.trim()) {
      const hs = T.w * 0.05 * k;
      ctx.font = p.tf(t.titleWeight, hs);
      const lines = wrap(ctx, d.backHeadline, w);
      if (draw) { ctx.fillStyle = d.accent ?? (ink === "#ffffff" ? t.accent : ink); textLines(ctx, lines, x, y + hs, hs * 1.15, "left"); }
      y += lines.length * hs * 1.15 + bs * 1.2;
    }
    if (d.blurb.trim()) {
      ctx.font = p.bf(400, bs);
      if (draw) ctx.fillStyle = ink;
      for (const para of d.blurb.trim().split(/\n\s*\n/)) {
        const lines = wrap(ctx, para.replace(/\n/g, " "), w);
        if (draw) textLines(ctx, lines, x, y + bs, bs * 1.45, "left");
        y += lines.length * bs * 1.45 + bs * 0.7;
      }
    }
    const ends = d.endorsements.filter((e) => e.quote.trim());
    if (ends.length) {
      y += bs * 0.4;
      for (const e of ends) {
        ctx.font = p.bf(400, bs * 0.95, true);
        const lines = wrap(ctx, `“${e.quote.trim()}”`, w * 0.94);
        if (draw) { ctx.fillStyle = ink; textLines(ctx, lines, x, y + bs, bs * 1.4, "left"); }
        y += lines.length * bs * 1.4;
        if (e.by.trim()) {
          ctx.font = p.bf(600, bs * 0.82);
          if (draw) { ctx.fillStyle = ink === "#ffffff" ? t.accent : ink; ctx.textAlign = "left"; ctx.fillText(`— ${e.by.trim()}`, x + w * 0.04, y + bs * 0.95, w * 0.9); }
          y += bs * 1.4;
        }
        y += bs * 0.5;
      }
    }
    if (d.bio.trim() || imgs.photo) {
      y += bs * 0.6;
      if (draw) { ctx.fillStyle = ink === "#ffffff" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)"; ctx.fillRect(x, y, w * 0.3, 0.35); }
      y += bs * 1.1;
      const ph = imgs.photo ? Math.min(24, T.w * 0.17) * k : 0;
      const tx = imgs.photo ? x + ph + bs * 1.2 : x, tw = imgs.photo ? w - ph - bs * 1.2 : w;
      ctx.font = p.bf(400, bs * 0.9);
      const lines = wrap(ctx, d.bio.trim(), tw);
      if (draw) {
        if (imgs.photo) {
          ctx.save(); ctx.beginPath(); ctx.arc(x + ph / 2, y + ph / 2, ph / 2, 0, Math.PI * 2); ctx.clip();
          cover(ctx, imgs.photo, { x, y, w: ph, h: ph }); ctx.restore();
        }
        ctx.fillStyle = ink; textLines(ctx, lines, tx, y + bs * 0.95, bs * 1.35, "left");
      }
      y += Math.max(ph, lines.length * bs * 1.35);
    }
    return y;
  };
  let k = 1;
  while (k > 0.62 && layout(k, false) > limit) k -= 0.04;
  const overflow = layout(k, false) > limit;
  ctx.save();
  ctx.beginPath(); ctx.rect(T.x, T.y, T.w, limit - T.y + T.h * 0.01); ctx.clip();
  layout(k, true);
  ctx.restore();

  // Foot: publisher, category and price on the left; barcode on the right.
  const fs = Math.min(3.4, T.w * 0.02);
  ctx.textAlign = "left"; ctx.fillStyle = ink;
  let fy = barcode.y + barcode.h - fs * 0.2;
  if (d.price.trim()) { ctx.font = p.bf(600, fs); ctx.fillText(d.price.trim(), x, fy, barcode.x - x - 4); fy -= fs * 1.5; }
  if (d.category.trim()) { ctx.font = p.bf(400, fs * 0.92); spacing(ctx, 0.08, fs); ctx.fillText(d.category.trim().toUpperCase(), x, fy, barcode.x - x - 4); spacing(ctx, 0, fs); fy -= fs * 1.7; }
  if (d.publisher.trim()) { ctx.font = p.tf(t.titleWeight, fs * 1.25); ctx.fillText(d.publisher.trim(), x, fy, barcode.x - x - 4); }

  const isbn = toIsbn13(d.isbn);
  if (isbn) {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(barcode.x, barcode.y, barcode.w, barcode.h);
    if (o.rasterBarcode !== false) drawBarcode(ctx, isbn, barcode);
  }
  return overflow;
}

/** EAN-13 bars at 100% magnification (0.33 mm modules), centred in the barcode box, with the ISBN above and digits below. */
export function barcodeLayout(box: Rect) {
  const mod = 0.33, barsW = 95 * mod;
  const x0 = box.x + (box.w - barsW) / 2;
  const textH = 2.6;
  const top = box.y + box.h * 0.12 + textH;
  const h = box.h * 0.62;
  return { mod, x0, top, h, guardExtra: 1.6, textH };
}
function drawBarcode(ctx: Ctx, isbn: string, box: Rect) {
  const L = barcodeLayout(box);
  const m = ean13Modules(isbn);
  ctx.fillStyle = "#000000";
  for (let i = 0; i < 95; i++) if (m[i] === "1") ctx.fillRect(L.x0 + i * L.mod, L.top, L.mod, L.h + (isGuard(i) ? L.guardExtra : 0));
  ctx.font = font(500, L.textH, "'Inter', sans-serif"); ctx.textAlign = "center";
  ctx.fillText(isbnLabel(isbn), box.x + box.w / 2, L.top - 0.9);
  ctx.font = font(400, L.textH * 1.05, "'Inter', sans-serif");
  ctx.textAlign = "right"; ctx.fillText(isbn[0], L.x0 - 0.7, L.top + L.h + L.textH);
  ctx.textAlign = "center";
  ctx.fillText(isbn.slice(1, 7), L.x0 + (3 + 21) * L.mod, L.top + L.h + L.textH);
  ctx.fillText(isbn.slice(7), L.x0 + (50 + 21) * L.mod, L.top + L.h + L.textH);
}

function drawSpine(ctx: Ctx, d: CoverDesign, imgs: CoverImages, r: Rect, trimH: number, bleed: number, textOk: boolean) {
  const p = palette(d, imgs);
  const bg = imgs.front ? averageHex(imgs.front, true) : p.t.bg[0];
  ctx.fillStyle = bg; ctx.fillRect(r.x, r.y, r.w, r.h);
  if (!textOk) return;
  const ink = d.ink ?? inkFor(bg);
  const room = r.w - 2 * SPINE_MARGIN_MM;
  const size = Math.min(room * 0.62, 7.5);
  const len = trimH - 2 * SAFE_MM;
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + bleed + trimH / 2);
  ctx.rotate(Math.PI / 2); // reads top to bottom, the US/UK convention
  ctx.textBaseline = "middle"; ctx.fillStyle = ink;
  const pubSize = size * 0.62;
  const pubW = d.publisher.trim() ? (ctx.font = p.tf(p.t.titleWeight, pubSize), Math.min(ctx.measureText(d.publisher.trim()).width, len * 0.18)) : 0;
  const authW = d.author ? (ctx.font = p.bf(600, size * 0.78), Math.min(ctx.measureText(d.author).width, len * 0.3)) : 0;
  const titleRoom = len - authW - pubW - size * (pubW ? 4 : 2.5);
  ctx.font = p.tf(p.t.titleWeight, size); ctx.textAlign = "left";
  ctx.fillText(p.upper ? d.title.toUpperCase() : d.title, -len / 2, 0, Math.max(10, titleRoom));
  let end = len / 2;
  if (pubW) { ctx.font = p.tf(p.t.titleWeight, pubSize); ctx.textAlign = "right"; ctx.fillText(d.publisher.trim(), end, 0, pubW); end -= pubW + size * 1.6; }
  if (authW) { ctx.font = p.bf(600, size * 0.78); ctx.textAlign = "right"; ctx.fillText(d.author, end, 0, authW); }
  ctx.restore();
}

function drawGuides(ctx: Ctx, full: { w: number; h: number }, trims: Rect[], folds: number[], barcode: Rect | null, bleedMm: number, labelBarcode = true) {
  ctx.save();
  // Shade the bleed (it's trimmed off).
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(0, 0, full.w, bleedMm); ctx.fillRect(0, full.h - bleedMm, full.w, bleedMm);
  ctx.fillRect(0, 0, bleedMm, full.h); ctx.fillRect(full.w - bleedMm, 0, bleedMm, full.h);
  ctx.lineWidth = 0.3;
  ctx.setLineDash([1.6, 1.2]);
  ctx.strokeStyle = "#00b7ff";
  for (const t of trims) ctx.strokeRect(t.x, t.y, t.w, t.h);
  ctx.strokeStyle = "#ff2fa8";
  for (const t of trims) ctx.strokeRect(t.x + SAFE_MM, t.y + SAFE_MM, t.w - 2 * SAFE_MM, t.h - 2 * SAFE_MM);
  ctx.strokeStyle = "#00b7ff";
  for (const x of folds) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, full.h); ctx.stroke(); }
  if (barcode) {
    ctx.strokeStyle = "#ffb000"; ctx.strokeRect(barcode.x, barcode.y, barcode.w, barcode.h);
    if (!labelBarcode) { ctx.restore(); return; }
    ctx.setLineDash([]); ctx.fillStyle = "#ffb000"; ctx.font = font(600, 2.6, "'Inter', sans-serif"); ctx.textAlign = "center";
    ctx.fillText("BARCODE AREA", barcode.x + barcode.w / 2, barcode.y + barcode.h / 2 + 1);
  }
  ctx.restore();
}

/** Size in millimetres of a part, before scaling. */
export function partSize(d: CoverDesign, part: CoverPart) {
  const g = wrapGeometry(d);
  if (part === "wrap") return { w: g.full.w, h: g.full.h };
  if (part === "spine") return { w: Math.max(g.spine, 1), h: g.full.h };
  return { w: g.trim.wmm, h: g.trim.hmm };
}

/** Draws one part of the cover onto ctx at pxPerMm. Front and back are drawn trimmed (no bleed); the wrap includes bleed. */
export function drawCover(ctx: Ctx, d: CoverDesign, imgs: CoverImages, part: CoverPart, pxPerMm: number, o: RenderOptions = {}): RenderResult {
  const g = wrapGeometry(d);
  ctx.save();
  ctx.scale(pxPerMm, pxPerMm);
  let overflow = false;
  if (part === "wrap") {
    drawSpine(ctx, d, imgs, g.spineRect, g.trim.hmm, g.bleed, g.spineText);
    ctx.save(); ctx.beginPath(); ctx.rect(g.back.panel.x, 0, g.back.panel.w, g.full.h); ctx.clip();
    overflow = drawBack(ctx, d, imgs, g.back.panel, g.back.trim, g.barcode, o);
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(g.front.panel.x, 0, g.front.panel.w, g.full.h); ctx.clip();
    drawFront(ctx, d, imgs, g.front.panel, g.front.trim);
    ctx.restore();
    if (o.guides) drawGuides(ctx, g.full, [g.back.trim, g.front.trim], [g.spineRect.x, g.spineRect.x + g.spineRect.w], toIsbn13(d.isbn) || d.reserveBarcode ? g.barcode : null, g.bleed, !toIsbn13(d.isbn));
  } else if (part === "spine") {
    drawSpine(ctx, d, imgs, { x: 0, y: 0, w: Math.max(g.spine, 1), h: g.full.h }, g.trim.hmm, g.bleed, g.spineText);
  } else {
    const T = { x: 0, y: 0, w: g.trim.wmm, h: g.trim.hmm };
    ctx.beginPath(); ctx.rect(0, 0, T.w, T.h); ctx.clip();
    if (part === "front") drawFront(ctx, d, imgs, T, T);
    else {
      const bc = { ...g.barcode, x: g.barcode.x - g.back.trim.x, y: g.barcode.y - g.back.trim.y };
      overflow = drawBack(ctx, d, imgs, T, T, bc, o);
      if (o.guides && (toIsbn13(d.isbn) || d.reserveBarcode)) drawGuides(ctx, { w: T.w, h: T.h }, [], [], bc, 0, !toIsbn13(d.isbn));
    }
    if (o.guides && part === "front") drawGuides(ctx, { w: T.w, h: T.h }, [T], [], null, 0);
  }
  ctx.restore();
  return { overflow };
}

export function renderCanvas(d: CoverDesign, imgs: CoverImages, part: CoverPart, pxPerMm: number, o: RenderOptions = {}) {
  const s = partSize(d, part);
  const c = document.createElement("canvas");
  c.width = Math.round(s.w * pxPerMm); c.height = Math.round(s.h * pxPerMm);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  const r = drawCover(ctx, d, imgs, part, pxPerMm, o);
  return { canvas: c, ...r };
}

// ── Exports ──────────────────────────────────────────────────────────────────

const DPI300 = 300 / 25.4;
const slug = (s: string) => (s || "book").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "book";

function save(href: string, name: string) { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); }

/** Print-ready full wrap (back + spine + front + 0.125 in bleed) as a PDF at 300 dpi, with the ISBN barcode as vector bars. */
export async function exportPrintPdf(d: CoverDesign, opts: { guides?: boolean } = {}) {
  if (!d.pages) throw new Error("Set the page count first: the spine width depends on it.");
  await loadCoverFonts(d);
  const imgs = await loadCoverImages(d);
  const g = wrapGeometry(d);
  const { canvas } = renderCanvas(d, imgs, "wrap", DPI300, { guides: opts.guides, rasterBarcode: false });
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: g.full.w >= g.full.h ? "l" : "p", unit: "mm", format: [g.full.w, g.full.h], compress: true });
  pdf.setProperties({ title: `${d.title || "Book"} — cover`, author: d.author, creator: "Polished Pages Cover Studio" });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, g.full.w, g.full.h, undefined, "NONE");
  const isbn = toIsbn13(d.isbn);
  if (isbn) {
    const L = barcodeLayout(g.barcode);
    const m = ean13Modules(isbn);
    pdf.setFillColor(0, 0, 0);
    // Merge runs of bar modules into single rectangles for clean edges.
    for (let i = 0; i < 95;) {
      if (m[i] !== "1") { i++; continue; }
      let j = i; while (j < 95 && m[j] === "1" && isGuard(j) === isGuard(i)) j++;
      pdf.rect(L.x0 + i * L.mod, L.top, (j - i) * L.mod, L.h + (isGuard(i) ? L.guardExtra : 0), "F");
      i = j;
    }
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(L.textH / 0.3528);
    pdf.text(isbnLabel(isbn), g.barcode.x + g.barcode.w / 2, L.top - 0.9, { align: "center" });
    const by = L.top + L.h + L.textH;
    pdf.text(isbn[0], L.x0 - 0.7, by, { align: "right" });
    pdf.text(isbn.slice(1, 7), L.x0 + 24 * L.mod, by, { align: "center" });
    pdf.text(isbn.slice(7), L.x0 + 71 * L.mod, by, { align: "center" });
  }
  pdf.save(`${slug(d.title)}-cover-${opts.guides ? "proof-with-guides" : "print"}.pdf`);
}

/** The front cover as an image: "ebook" is 2560 px tall (KDP's recommended size), "web" 1536 px. */
export async function frontImage(d: CoverDesign, size: "ebook" | "web" = "web", type: "image/jpeg" | "image/png" = "image/jpeg") {
  await loadCoverFonts(d);
  const imgs = await loadCoverImages(d);
  const h = size === "ebook" ? 2560 : 1536;
  const g = wrapGeometry(d);
  return renderCanvas(d, imgs, "front", h / g.trim.hmm).canvas.toDataURL(type, 0.92);
}
export async function backImage(d: CoverDesign, height = 1536) {
  await loadCoverFonts(d);
  const imgs = await loadCoverImages(d);
  const g = wrapGeometry(d);
  return renderCanvas(d, imgs, "back", height / g.trim.hmm).canvas.toDataURL("image/jpeg", 0.92);
}
export async function downloadFront(d: CoverDesign, size: "ebook" | "web") {
  save(await frontImage(d, size), `${slug(d.title)}-${size === "ebook" ? "ebook-cover" : "front-cover"}.jpg`);
}
export async function downloadBack(d: CoverDesign) { save(await backImage(d, 2560), `${slug(d.title)}-back-cover.jpg`); }

/** Effective print resolution of an artwork image on its panel (with bleed). */
export function artDpi(img: HTMLImageElement | null, d: CoverDesign) {
  if (!img) return null;
  const g = wrapGeometry(d);
  return Math.round(Math.min(img.width / ((g.trim.wmm + g.bleed) / 25.4), img.height / (g.full.h / 25.4)));
}
