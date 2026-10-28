// Images and figures in the manuscript (DESIGN-SPEC.md §21). An image is kept with the book
// (manuscript meta.figures, a compressed JPEG) and placed in the text as ![Caption](figure:id), so the
// text stays readable; the book's exports and the Book page see the image itself.
import type { Manuscript } from "./manuscript";

export type Figures = Record<string, string>;
export const figuresOf = (m: Manuscript): Figures => ((m.meta?.figures as Figures | undefined) ?? {});

/** A picture made ready for the book: at most 1600 px on its long side, as a JPEG data URL. */
export async function prepareImage(file: Blob, maxSide = 1600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("That file isn't an image the browser can read.")); i.src = url; });
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

/** The text with each figure:id replaced by its image, for exports and the Book page. */
export const resolveFigures = (md: string, figures: Figures) => md.replace(/!\[([^\]]*)\]\(figure:([\w-]+)\)/g, (all, alt: string, id: string) => (figures[id] ? `![${alt}](${figures[id]})` : all));
