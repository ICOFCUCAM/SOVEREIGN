// Full-wrap print cover PDF: back + spine + front + bleed, sized by the shared
// coverSpec (so it matches the spine math used across cover + interior). The
// front/back artwork (OpenAI-generated, trim-proportioned) is placed full-bleed;
// the spine is drawn from the cover's sampled colour with the title + author.
import { getTrim, coverSpec, BLEED_MM } from "@/lib/print-sizes";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load a cover image."));
    img.src = src;
  });
}

function averageColor(img: HTMLImageElement): { r: number; g: number; b: number; lum: number } {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return { r: 30, g: 30, b: 36, lum: 30 };
  ctx.drawImage(img, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2], lum: 0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2] };
}

export async function composeFullWrapPdf(o: {
  frontSrc: string;
  backSrc?: string | null;
  title: string;
  author?: string;
  pages: number;
  trimId: string;
  paper: string;
  filename: string;
}): Promise<void> {
  if (!o.pages || o.pages <= 0) throw new Error("Set a page count under Production first — the spine width depends on it.");
  const { jsPDF } = await import("jspdf");
  const trim = getTrim(o.trimId);
  const spec = coverSpec(trim, o.pages, o.paper);
  const bleed = BLEED_MM;
  const trimW = trim.wmm;
  const fullW = spec.fullWmm, fullH = spec.fullHmm, spine = spec.spineMm;

  const front = await loadImage(o.frontSrc);
  const back = o.backSrc ? await loadImage(o.backSrc).catch(() => null) : null;
  const avg = averageColor(front);

  const pdf = new jsPDF({ orientation: "l", unit: "mm", format: [fullW, fullH] });

  // Back panel (left, includes the left bleed).
  const sideW = bleed + trimW;
  if (back && o.backSrc) {
    pdf.addImage(o.backSrc, "PNG", 0, 0, sideW, fullH, undefined, "FAST");
  } else {
    pdf.setFillColor(avg.r, avg.g, avg.b);
    pdf.rect(0, 0, sideW, fullH, "F");
  }

  // Front panel (right, includes the right bleed).
  pdf.addImage(o.frontSrc, "PNG", bleed + trimW + spine, 0, sideW, fullH, undefined, "FAST");

  // Spine (centre).
  pdf.setFillColor(avg.r, avg.g, avg.b);
  pdf.rect(bleed + trimW, 0, spine, fullH, "F");
  if (spine >= 8) {
    pdf.setTextColor(avg.lum > 140 ? 17 : 255);
    const sx = bleed + trimW + spine / 2;
    pdf.setFont("times", "bold");
    pdf.setFontSize(Math.min(spine * 1.5, 18));
    pdf.text(o.title.toUpperCase(), sx + spine * 0.18, fullH / 2, { angle: 90, align: "center", maxWidth: fullH * 0.6 });
    if (o.author) {
      pdf.setFont("times", "normal");
      pdf.setFontSize(Math.min(spine * 1.0, 12));
      pdf.text(o.author, sx + spine * 0.18, fullH * 0.84, { angle: 90, align: "center", maxWidth: fullH * 0.22 });
    }
  }

  pdf.save(`${o.filename}.pdf`);
}
