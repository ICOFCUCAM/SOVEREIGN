// Registers an embeddable serif (Liberation Serif, SIL OFL 1.1 — metric-compatible
// with Times) into a jsPDF document so exported PDFs carry their fonts embedded
// and pass print-preflight "all fonts embedded" checks. The TTFs are served as
// on-demand static assets (not inlined into the JS bundle) and base64-cached
// after first use. See src/assets/fonts/LICENSE-LiberationSerif.txt.
import regularUrl from "@/assets/fonts/LiberationSerif-Regular.ttf?url";
import boldUrl from "@/assets/fonts/LiberationSerif-Bold.ttf?url";
import italicUrl from "@/assets/fonts/LiberationSerif-Italic.ttf?url";

export const EMBED_SERIF = "LiberationSerif";

let cache: { normal: string; bold: string; italic: string } | null = null;

async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load the embedded font.");
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerEmbeddedSerif(pdf: any): Promise<string> {
  if (!cache) {
    const [normal, bold, italic] = await Promise.all([toBase64(regularUrl), toBase64(boldUrl), toBase64(italicUrl)]);
    cache = { normal, bold, italic };
  }
  pdf.addFileToVFS("LiberationSerif-Regular.ttf", cache.normal);
  pdf.addFont("LiberationSerif-Regular.ttf", EMBED_SERIF, "normal");
  pdf.addFileToVFS("LiberationSerif-Bold.ttf", cache.bold);
  pdf.addFont("LiberationSerif-Bold.ttf", EMBED_SERIF, "bold");
  pdf.addFileToVFS("LiberationSerif-Italic.ttf", cache.italic);
  pdf.addFont("LiberationSerif-Italic.ttf", EMBED_SERIF, "italic");
  return EMBED_SERIF;
}
